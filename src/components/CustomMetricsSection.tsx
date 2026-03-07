/**
 * CustomMetricsSection Component
 * Displays configured custom resource metrics within a ClusterCard
 * Auto-hides tiles for resource types not present on this cluster
 */
import React, { useState } from 'react';
import {
  Flex,
  FlexItem,
  Spinner,
  Button,
} from '@patternfly/react-core';
import {
  AngleRightIcon,
  AngleDownIcon,
} from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clusterAPI } from '../services/api';
import { MetricTile, EmptyMetricTile } from './MetricTile';
import { CustomResourceDetailModal } from './CustomResourceDetailModal';
import { useDashboardConfigStore, type MetricTileConfig } from '../stores/dashboardConfigStore';
import type { ClusterResourceCount } from '../types/customResources';

interface CustomMetricsSectionProps {
  clusterName: string;
  onConfigureClick: () => void;
}

export const CustomMetricsSection: React.FC<CustomMetricsSectionProps> = ({
  clusterName,
  onConfigureClick,
}) => {
  const { globalConfig } = useDashboardConfigStore();
  const [selectedTile, setSelectedTile] = useState<MetricTileConfig | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const resourceTypeNames = Array.from(
    new Set(globalConfig.tiles.map(t => t.resourceTypeName))
  );

  const { data: resourceCounts = [], isLoading } = useQuery<ClusterResourceCount[]>({
    queryKey: ['customResourceCounts', clusterName, resourceTypeNames],
    queryFn: () => clusterAPI.getCustomResourceCounts(resourceTypeNames, [clusterName], true),
    enabled: resourceTypeNames.length > 0,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const countsMap = React.useMemo(() => {
    const map = new Map<string, ClusterResourceCount>();
    resourceCounts
      .filter(rc => rc.cluster === clusterName)
      .forEach(rc => map.set(rc.resourceTypeName, rc));
    return map;
  }, [resourceCounts, clusterName]);

  const handleTileClick = (tile: MetricTileConfig) => {
    setSelectedTile(tile);
    setIsDetailModalOpen(true);
  };

  const getValue = (tile: MetricTileConfig): number | string | null => {
    const countData = countsMap.get(tile.resourceTypeName);
    if (!countData) return null;

    if (!tile.aggregation) {
      return countData.count;
    }

    const aggValue = countData.aggregations?.[tile.aggregation];
    if (aggValue === undefined) return null;

    if (typeof aggValue === 'object' && aggValue !== null) {
      return Object.values(aggValue as Record<string, number>).reduce((sum, v) => sum + v, 0);
    }

    return aggValue;
  };

  const getMaxValue = (tile: MetricTileConfig): number => {
    if (tile.displayType === 'percentage') return 100;

    const countData = countsMap.get(tile.resourceTypeName);
    if (countData && !tile.aggregation) {
      return countData.count || 100;
    }

    return 100;
  };

  // No tiles configured globally
  if (globalConfig.tiles.length === 0) {
    return (
      <div style={{ padding: '12px 0' }}>
        <EmptyMetricTile onClick={onConfigureClick} />
      </div>
    );
  }

  const sortedTiles = [...globalConfig.tiles].sort((a, b) => a.order - b.order);

  // Auto-hide: only show tiles where this cluster has data
  const visibleTiles = sortedTiles.filter(tile => countsMap.has(tile.resourceTypeName));

  // If no tiles have data for this cluster, render nothing
  if (!isLoading && visibleTiles.length === 0) {
    return null;
  }

  return (
    <>
      <div style={{ marginTop: '12px' }}>
        {/* Header with tile count and expand toggle */}
        <div className="metrics-section-header">
          <Button
            variant="plain"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '2px 6px',
              fontSize: '0.75rem',
              color: 'var(--pf-t--global--text--color--subtle)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
            Metrics ({visibleTiles.length})
          </Button>
        </div>

        {isLoading ? (
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '12px' }}>
            <FlexItem>
              <Spinner size="sm" />
            </FlexItem>
          </Flex>
        ) : (
          <>
            {/* Compact tile grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: '8px'
            }}>
              {visibleTiles.map((tile) => (
                <MetricTile
                  key={tile.id}
                  config={tile}
                  value={getValue(tile)}
                  maxValue={getMaxValue(tile)}
                  onClick={() => handleTileClick(tile)}
                  isLoading={isLoading}
                />
              ))}
            </div>

            {/* Expanded detail section */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  className="metrics-expanded-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ marginTop: '8px' }}>
                    {visibleTiles.map((tile) => {
                      const countData = countsMap.get(tile.resourceTypeName);
                      const value = getValue(tile);
                      return (
                        <div
                          key={tile.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            borderBottom: '1px solid var(--pf-t--global--border--color--default)',
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            {tile.displayName}
                            {tile.aggregation && (
                              <span style={{ color: 'var(--pf-t--global--text--color--subtle)', marginLeft: '4px' }}>
                                ({tile.aggregation.replace(/_/g, ' ')})
                              </span>
                            )}
                          </span>
                          <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <strong>{value !== null ? value.toLocaleString() : '-'}</strong>
                            </FlexItem>
                            {countData?.lastCollection && (
                              <FlexItem>
                                <span style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: '0.625rem' }}>
                                  {new Date(countData.lastCollection).toLocaleTimeString()}
                                </span>
                              </FlexItem>
                            )}
                          </Flex>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {selectedTile && (
        <CustomResourceDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTile(null);
          }}
          clusterName={clusterName}
          resourceTypeName={selectedTile.resourceTypeName}
          displayName={selectedTile.displayName}
        />
      )}
    </>
  );
};
