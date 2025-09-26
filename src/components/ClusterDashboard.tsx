import React, { useState, useMemo } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
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
  EmptyStateIcon,
  EmptyStateBody,
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

  // Fetch clusters with new API
  const {
    data: clustersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => clusterAPI.getClusters(),
    refetchInterval: 30000, // 30 seconds
  });

  const clusters = clustersData || [];

  // Fetch user permissions
  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => clusterAPI.getUserPermissions(),
  });

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
      {/* Stats Section */}
      <PageSection variant={PageSectionVariants.default} className="stats-section pf-v5-u-pb-0">
        <ClusterStats clusters={filteredClusters} />
      </PageSection>

      {/* Toolbar */}
      <PageSection variant={PageSectionVariants.default} className="pf-v5-u-pb-0">
        <Toolbar id="cluster-toolbar" className="cluster-toolbar">
          <ToolbarContent>
            <ToolbarItem variant="search-filter" className="pf-v5-u-mr-md">
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
          <EmptyState>
            <EmptyStateIcon icon={CubesIcon} />
            <Title headingLevel="h4" size="lg">
              {clusters.length === 0 ? 'No clusters available' : 'No clusters match your search'}
            </Title>
            <EmptyStateBody>
              {clusters.length === 0
                ? 'No clusters are currently configured. Clusters are managed through Kubernetes Custom Resources.'
                : 'Try adjusting your search or filter criteria.'}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <ClusterGrid clusters={filteredClusters} onRefresh={refetch} permissions={permissions} />
        )}
      </PageSection>
    </motion.div>
  );
};
