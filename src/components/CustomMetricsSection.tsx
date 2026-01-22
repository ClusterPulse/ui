/**
 * CustomMetricsSection Component
 * Displays configured custom resource metrics within a ClusterCard
 */
import React, { useState } from 'react';
import {
  Flex,
  FlexItem,
  Spinner,
} from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
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

  // Get unique resource type names from config
  const resourceTypeNames = Array.from(
    new Set(globalConfig.tiles.map(t => t.resourceTypeName))
  );

  // Fetch counts for configured resource types
  const { data: resourceCounts = [], isLoading } = useQuery<ClusterResourceCount[]>({
    queryKey: ['customResourceCounts', clusterName, resourceTypeNames],
    queryFn: () => clusterAPI.getCustomResourceCounts(resourceTypeNames, [clusterName], true),
    enabled: resourceTypeNames.length > 0,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Build a map of resource type -> counts/aggregations for this cluster
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
      // Return total count
      return countData.count;
    }

    // Return specific aggregation
    const aggValue = countData.aggregations?.[tile.aggregation];
    if (aggValue === undefined) return null;
    
    // Handle grouped aggregations (object)
    if (typeof aggValue === 'object' && aggValue !== null) {
      // Sum all values in grouped aggregation
      return Object.values(aggValue as Record<string, number>).reduce((sum, v) => sum + v, 0);
    }
    
    return aggValue;
  };

  const getMaxValue = (tile: MetricTileConfig): number => {
    // For percentage display, max is 100
    if (tile.displayType === 'percentage') return 100;
    
    // For bar display with counts, use the total count as max
    const countData = countsMap.get(tile.resourceTypeName);
    if (countData && !tile.aggregation) {
      return countData.count || 100;
    }
    
    return 100;
  };

  // If no tiles configured, show empty state
  if (globalConfig.tiles.length === 0) {
    return (
      <div style={{ 
        padding: '12px 0',
        borderTop: '1px solid var(--pf-t--global--border--color--default)'
      }}>
        <EmptyMetricTile onClick={onConfigureClick} />
      </div>
    );
  }

  // Sort tiles by order
  const sortedTiles = [...globalConfig.tiles].sort((a, b) => a.order - b.order);

  return (
    <>
      <div style={{ 
        paddingTop: '12px',
        marginTop: '12px',
        borderTop: '1px solid var(--pf-t--global--border--color--default)'
      }}>
        {isLoading ? (
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '12px' }}>
            <FlexItem>
              <Spinner size="sm" />
            </FlexItem>
          </Flex>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '8px'
          }}>
            {sortedTiles.map((tile) => (
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
        )}
      </div>

      {/* Detail Modal */}
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
