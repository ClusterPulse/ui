import React, { useState } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { motion, type Variants } from 'framer-motion';
import { ClusterCard } from './ClusterCard';
import { NodeDetailsModal } from './NodeDetailsModal';
import { OperatorsView } from './OperatorsView';
import { DashboardConfigPanel } from './DashboardConfigPanel';

interface ClusterGridProps {
  clusters: any[];
  onRefresh: () => void;
  permissions?: any;
}

const item: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
    },
  },
};

export const ClusterGrid: React.FC<ClusterGridProps> = ({ clusters, onRefresh }) => {
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [operatorsViewOpen, setOperatorsViewOpen] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);

  const handleNodeClick = (cluster: any) => {
    setSelectedCluster(cluster);
    setNodeModalOpen(true);
  };

  const handleOperatorsClick = (cluster: any) => {
    setSelectedCluster(cluster);
    setOperatorsViewOpen(true);
  };

  const handleConfigureMetrics = () => {
    setConfigPanelOpen(true);
  };

  return (
    <>
      <Grid hasGutter className="cluster-grid">
        {clusters.map((cluster) => (
          <GridItem
            key={cluster.name}
            span={12}
            md={6}
            lg={4}
            xl={4}
          >
            <motion.div variants={item} layout>
              <ClusterCard
                cluster={cluster}
                onRefresh={onRefresh}
                onNodeClick={() => handleNodeClick(cluster)}
                onOperatorsClick={() => handleOperatorsClick(cluster)}
                onConfigureMetrics={handleConfigureMetrics}
              />
            </motion.div>
          </GridItem>
        ))}
      </Grid>

      <NodeDetailsModal
        isOpen={nodeModalOpen}
        onClose={() => setNodeModalOpen(false)}
        cluster={selectedCluster}
      />

      {selectedCluster && (
        <OperatorsView
          isOpen={operatorsViewOpen}
          onClose={() => {
            setOperatorsViewOpen(false);
            setSelectedCluster(null);
          }}
          clusterName={selectedCluster.name}
        />
      )}

      <DashboardConfigPanel
        isOpen={configPanelOpen}
        onClose={() => setConfigPanelOpen(false)}
      />
    </>
  );
};
