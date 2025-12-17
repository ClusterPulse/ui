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
} from '@patternfly/react-core';
import {
  CubesIcon,
  FilterIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// Components
import { ClusterGrid } from './ClusterGrid';
import { ClusterStats } from './ClusterStats';
import { LoginBanner } from './LoginBanner';
import { clusterAPI } from '../services/api';

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

  // Check if public API is available
  const { data: publicApiAvailable, isLoading: publicApiLoading } = useQuery({
    queryKey: ['publicApiAvailable'],
    queryFn: () => clusterAPI.checkPublicApiAvailable(),
    retry: 1,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Check authentication status
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

  // Fetch clusters - use appropriate endpoint based on auth
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

  // Fetch user permissions only when authenticated
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => clusterAPI.getUserPermissions(),
    enabled: isAuthenticated === true,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const clusters = clustersData || [];

  // Filter clusters
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

  // Show loading only for initial load
  const isLoading = publicApiLoading || authLoading || clustersLoading;

  if (isLoading) {
    return (
      <Bullseye>
        <div className="loading-container">
          <Spinner size="xl" />
          <Title headingLevel="h4" className="pf-v5-u-mt-md">
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
      {/* Show login banner for anonymous users */}
      {isAnonymousMode && (
        <PageSection className="pf-v5-u-pb-0">
          <LoginBanner />
        </PageSection>
      )}

      {/* Stats Section - Only show for authenticated users */}
      {isAuthenticated && (
        <PageSection className="stats-section pf-v5-u-pb-0">
          <ClusterStats clusters={filteredClusters} />
        </PageSection>
      )}

      {/* Toolbar */}
      <PageSection className="pf-v5-u-pb-0">
        <Toolbar id="cluster-toolbar" className="cluster-toolbar">
          <ToolbarContent>
            <ToolbarItem className="pf-v5-u-mr-md">
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
            
          </ToolbarContent>
        </Toolbar>
      </PageSection>

      {/* Clusters Grid */}
      <PageSection>
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
    </motion.div>
  );
};
