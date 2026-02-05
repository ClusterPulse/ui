import React, { useState, useMemo } from 'react';
import {
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
  SearchInput,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  EmptyState,
  EmptyStateBody,
  Title,
  Spinner,
  Alert,
  Bullseye,
  Button,
  Tooltip,
} from '@patternfly/react-core';
import {
  CubesIcon,
  FilterIcon,
  CogIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import { ClusterGrid } from './ClusterGrid';
import { ClusterStats } from './ClusterStats';
import { LoginBanner } from './LoginBanner';
import { DashboardConfigPanel } from './DashboardConfigPanel';
import { clusterAPI } from '../services/api';
import { useDashboardConfigStore } from '../stores/dashboardConfigStore';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const getHealthStatus = (cluster: any) => {
  return cluster?.status?.health || 'unknown';
};

export const ClusterDashboard: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  const { globalConfig } = useDashboardConfigStore();

  const { data: publicApiAvailable, isLoading: publicApiLoading } = useQuery({
    queryKey: ['publicApiAvailable'],
    queryFn: () => clusterAPI.checkPublicApiAvailable(),
    retry: 1,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ['authStatus'],
    queryFn: () => clusterAPI.getAuthStatus(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    enabled: !publicApiLoading,
  });

  const isAuthenticated = authStatus?.authenticated === true;
  const isAnonymousMode = !isAuthenticated && publicApiAvailable === true;

  const {
    data: clustersData,
    isLoading: clustersLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clusters', isAuthenticated ? 'authenticated' : 'anonymous'],
    queryFn: async () => {
      if (isAuthenticated) {
        return await clusterAPI.getClusters();
      } else if (isAnonymousMode) {
        return await clusterAPI.getPublicClusterHealth();
      }
      return [];
    },
    refetchInterval: isAuthenticated ? 30000 : 60000,
    enabled: !publicApiLoading && !authLoading && (isAuthenticated || isAnonymousMode),
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => clusterAPI.getUserPermissions(),
    enabled: isAuthenticated === true,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const clusters = clustersData || [];

  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster: any) => {
      const matchesSearch = 
        cluster.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        cluster.displayName?.toLowerCase().includes(searchValue.toLowerCase());
      
      const health = getHealthStatus(cluster);
      const matchesStatus = statusFilter === 'all' || health === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [clusters, searchValue, statusFilter]);

  const isLoading = publicApiLoading || authLoading || clustersLoading;

  if (isLoading) {
    return (
      <Bullseye>
        <div className="loading-container">
          <Spinner size="xl" />
          <Title headingLevel="h4" className="pf-v6-u-mt-md">
            Loading clusters...
          </Title>
        </div>
      </Bullseye>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant="danger" title="Failed to load clusters">
          {(error as any).message}
        </Alert>
      </PageSection>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="cluster-dashboard"
    >
      {isAnonymousMode && (
        <PageSection className="pf-v6-u-pb-sm">
          <LoginBanner />
        </PageSection>
      )}

      {isAuthenticated && (
        <PageSection className="pf-v6-u-pb-sm">
          <ClusterStats clusters={filteredClusters} />
        </PageSection>
      )}

      <PageSection className="pf-v6-u-pb-sm pf-v6-u-pt-0">
        <Toolbar id="cluster-toolbar" className="cluster-toolbar">
          <ToolbarContent>
            <ToolbarItem className="pf-v6-u-mr-md">
              <SearchInput
                aria-label="Search clusters"
                placeholder="Search clusters..."
                value={searchValue}
                onChange={(_, value) => setSearchValue(value)}
                onClear={() => setSearchValue('')}
              />
            </ToolbarItem>
            
            <ToolbarGroup variant="filter-group">
              <ToolbarItem>
                <Dropdown
                  isOpen={isFilterOpen}
                  onOpenChange={setIsFilterOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      isExpanded={isFilterOpen}
                      icon={<FilterIcon />}
                    >
                      {statusFilter === 'all' ? 'All statuses' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="all"
                      onClick={() => {
                        setStatusFilter('all');
                        setIsFilterOpen(false);
                      }}
                    >
                      All statuses
                    </DropdownItem>
                    <DropdownItem
                      key="healthy"
                      onClick={() => {
                        setStatusFilter('healthy');
                        setIsFilterOpen(false);
                      }}
                    >
                      Healthy
                    </DropdownItem>
                    <DropdownItem
                      key="degraded"
                      onClick={() => {
                        setStatusFilter('degraded');
                        setIsFilterOpen(false);
                      }}
                    >
                      Degraded
                    </DropdownItem>
                    <DropdownItem
                      key="unhealthy"
                      onClick={() => {
                        setStatusFilter('unhealthy');
                        setIsFilterOpen(false);
                      }}
                    >
                      Unhealthy
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>
            </ToolbarGroup>

            <ToolbarItem variant="separator" />

            {isAuthenticated && (
              <ToolbarItem>
                <Tooltip content={`Configure metrics (${globalConfig.tiles.length} configured)`}>
                  <Button
                    variant="secondary"
                    icon={<CogIcon />}
                    onClick={() => setIsConfigPanelOpen(true)}
                  >
                    Configure Metrics
                    {globalConfig.tiles.length > 0 && (
                      <span 
                        style={{ 
                          marginLeft: '8px',
                          background: 'var(--pf-t--global--color--brand--default)',
                          color: 'white',
                          borderRadius: '10px',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {globalConfig.tiles.length}
                      </span>
                    )}
                  </Button>
                </Tooltip>
              </ToolbarItem>
            )}
          </ToolbarContent>
        </Toolbar>
      </PageSection>

      <PageSection className="pf-v6-u-pt-0">
        {filteredClusters.length === 0 ? (
          <EmptyState
            titleText={clusters.length === 0 ? 'No clusters available' : 'No clusters match your search'}
            headingLevel="h4"
            icon={CubesIcon}
          >
            <EmptyStateBody>
              {clusters.length === 0
                ? isAnonymousMode 
                  ? 'No clusters are currently available. Login to see if you have access to more clusters.'
                  : 'No clusters are currently configured. Clusters are managed through Kubernetes Custom Resources.'
                : 'Try adjusting your search or filter criteria.'}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <ClusterGrid 
            clusters={filteredClusters} 
            onRefresh={refetch} 
            permissions={isAuthenticated ? permissions : undefined}
          />
        )}
      </PageSection>

      {/* Global Config Panel */}
      <DashboardConfigPanel
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
      />
    </motion.div>
  );
};
