import React from 'react';
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TimesCircleIcon,
  CubesIcon,
  ServerIcon,
  LayerGroupIcon,
  CubeIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';

interface ClusterStatsProps {
  clusters: any[];
}

export const ClusterStats: React.FC<ClusterStatsProps> = ({ clusters }) => {
  const stats = React.useMemo(() => {
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let unknown = 0;
    let totalNodes = 0;
    let readyNodes = 0;
    let totalNamespaces = 0;
    let totalPods = 0;
    let runningPods = 0;
    
    clusters.forEach(cluster => {
      const health = cluster.status?.health || 'unknown';
      switch(health) {
        case 'healthy': healthy++; break;
        case 'degraded': degraded++; break;
        case 'unhealthy': unhealthy++; break;
        default: unknown++; break;
      }
      
      if (cluster.node_summary) {
        totalNodes += cluster.node_summary.total || 0;
        readyNodes += cluster.node_summary.ready || 0;
      } else if (cluster.metrics) {
        totalNodes += cluster.metrics.nodes || 0;
        readyNodes += cluster.metrics.nodes_ready || 0;
      }
      
      if (cluster.metrics) {
        totalNamespaces += cluster.metrics.namespaces || 0;
        totalPods += cluster.metrics.pods || 0;
        runningPods += cluster.metrics.pods_running || 0;
      }
    });

    return {
      total: clusters.length,
      healthy,
      degraded,
      unhealthy,
      unknown,
      totalNodes,
      readyNodes,
      totalNamespaces,
      totalPods,
      runningPods,
      healthPercentage: clusters.length > 0 ? 
        Math.round((healthy / clusters.length) * 100) : 0,
      nodeReadyPercentage: totalNodes > 0 ? 
        Math.round((readyNodes / totalNodes) * 100) : 0,
    };
  }, [clusters]);

  const statItems = [
    {
      title: 'Clusters',
      value: stats.total,
      icon: CubesIcon,
      color: 'blue',
      subtext: `${stats.healthPercentage}% healthy`,
    },
    {
      title: 'Healthy',
      value: stats.healthy,
      icon: CheckCircleIcon,
      color: 'green',
    },
    {
      title: 'Degraded',
      value: stats.degraded,
      icon: ExclamationTriangleIcon,
      color: 'orange',
    },
    {
      title: 'Critical',
      value: stats.unhealthy,
      icon: TimesCircleIcon,
      color: 'red',
    },
    {
      title: 'Nodes',
      value: `${stats.readyNodes}/${stats.totalNodes}`,
      icon: ServerIcon,
      color: 'purple',
      subtext: `${stats.nodeReadyPercentage}% ready`,
    },
    {
      title: 'Namespaces',
      value: stats.totalNamespaces,
      icon: LayerGroupIcon,
      color: 'cyan',
    },
    {
      title: 'Pods',
      value: `${stats.runningPods}/${stats.totalPods}`,
      icon: CubeIcon,
      color: 'teal',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="cluster-stats"
    >
      <Card className="stat-card">
        <CardBody>
          <Flex 
            justifyContent={{ default: 'justifyContentSpaceEvenly' }}
            alignItems={{ default: 'alignItemsCenter' }}
            flexWrap={{ default: 'nowrap' }}
          >
            {statItems.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <FlexItem key={stat.title}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Flex 
                      alignItems={{ default: 'alignItemsCenter' }}
                      direction={{ default: 'row' }}
                      gap={{ default: 'gapSm' }}
                    >
                      <FlexItem>
                        <div className={`stat-icon stat-icon--${stat.color}`}>
                          <Icon />
                        </div>
                      </FlexItem>
                      <FlexItem>
                        <div className="stat-content">
                          <div className="stat-value">{stat.value}</div>
                          <div className="stat-title">{stat.title}</div>
                          {stat.subtext && (
                            <div className="stat-description">{stat.subtext}</div>
                          )}
                        </div>
                      </FlexItem>
                    </Flex>
                  </motion.div>
                </FlexItem>
              );
            })}
          </Flex>
        </CardBody>
      </Card>
    </motion.div>
  );
};
