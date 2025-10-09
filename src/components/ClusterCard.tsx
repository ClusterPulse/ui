import React, { useState } from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  CardHeader,
  Label,
  LabelGroup,
  Flex,
  FlexItem,
  Button,
  Tooltip,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Badge,
  Modal,
  ModalVariant,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Spinner,
} from '@patternfly/react-core';
import {
  EllipsisVIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CubeIcon,
  LayerGroupIcon,
  CubesIcon,
  ClockIcon,
  LockIcon,
  EyeIcon,
  ExternalLinkAltIcon,
  CodeBranchIcon,
  TagIcon,
  ServerIcon,
  DatabaseIcon,
  ServiceIcon,
  BuildIcon,
  VolumeIcon,
  CpuIcon,
  MemoryIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { clusterAPI } from '../services/api';
import { OpenShiftIcon } from './icons/OpenShiftIcon';

interface ClusterCardProps {
  cluster: any;
  onRefresh: () => void;
  onNodeClick: () => void;
  onOperatorsClick: () => void;
}

interface AnonymousClusterCardProps {
  cluster: any;
}

const AnonymousClusterCard: React.FC<AnonymousClusterCardProps> = ({ cluster }) => {
  const displayName = cluster.displayName || cluster.name;
  const health = cluster.status?.health || 'unknown';
  const status = healthConfig[health as keyof typeof healthConfig] || healthConfig.unknown;
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className={clsx('cluster-card', `cluster-card--${health}`, 'cluster-card--anonymous')}>
        <CardHeader>
          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <FlexItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <OpenShiftIcon className="cluster-icon" />
                </FlexItem>
                <FlexItem>
                  <CardTitle className="cluster-title">
                    {displayName}
                  </CardTitle>
                  {cluster.name !== displayName && (
                    <div className="cluster-name pf-v5-u-font-size-sm pf-v5-u-color-200">
                      {cluster.name}
                    </div>
                  )}
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Badge className={`status-badge status-badge--${status.color}`}>
                <StatusIcon className="pf-v5-u-mr-xs" />
                {status.label}
              </Badge>
            </FlexItem>
          </Flex>
        </CardHeader>

        <CardBody>
          <Flex
            direction={{ default: 'column' }}
            spaceItems={{ default: 'spaceItemsMd' }}
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ padding: '2rem 1rem', textAlign: 'center' }}
          >
            <FlexItem>
              <LockIcon style={{ 
                fontSize: '3rem', 
                color: 'var(--pf-v5-global--Color--200)', 
                opacity: 0.4 
              }} />
            </FlexItem>
            <FlexItem>
              <div style={{ 
                color: 'var(--pf-v5-global--Color--200)', 
                fontSize: '0.875rem',
                maxWidth: '280px'
              }}>
                Authentication required to view detailed cluster information
              </div>
            </FlexItem>
            <FlexItem>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                justifyContent: 'center',
                color: 'var(--pf-v5-global--Color--300)', 
                fontSize: '0.75rem'
              }}>
                <span>Metrics</span>
                <span>•</span>
                <span>Nodes</span>
                <span>•</span>
                <span>Operators</span>
                <span>•</span>
                <span>Namespaces</span>
              </div>
            </FlexItem>
          </Flex>
        </CardBody>

        {cluster.status?.last_check && (
          <CardFooter>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <span className="last-check" style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }}>
                  <ClockIcon className="pf-v5-u-mr-xs" style={{ fontSize: '0.75rem' }} />
                  Last checked: {new Date(cluster.status.last_check).toLocaleTimeString()}
                </span>
              </FlexItem>
            </Flex>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

const healthConfig = {
  healthy: {
    icon: CheckCircleIcon,
    color: 'green',
    label: 'Healthy',
  },
  degraded: {
    icon: ExclamationTriangleIcon,
    color: 'orange', 
    label: 'Degraded',
  },
  unhealthy: {
    icon: ExclamationCircleIcon,
    color: 'red',
    label: 'Unhealthy',
  },
  unknown: {
    icon: ExclamationCircleIcon,
    color: 'grey',
    label: 'Unknown',
  },
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onNodeClick,
  onOperatorsClick,
}) => {
  // Render anonymous view if flag is set
  if (cluster.anonymous_view) {
    return <AnonymousClusterCard cluster={cluster} />;
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [clusterDetails, setClusterDetails] = useState<any>(null);
  
  const clusterName = cluster.name;
  const displayName = cluster.displayName || cluster.name;
  const health = cluster.status?.health || 'unknown';
  const status = healthConfig[health as keyof typeof healthConfig] || healthConfig.unknown;
  const StatusIcon = status.icon;
  
  const metrics = cluster.metrics || {};

  const handleViewDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const details = await clusterAPI.getCluster(clusterName);
      setClusterDetails(details);
      setIsDetailsModalOpen(true);
      toast.success(`Loaded details for ${displayName}`);
    } catch (error) {
      toast.error(`Failed to load details for ${displayName}`);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const onDropdownSelect = () => {
    setIsDropdownOpen(false);
  };

  const dropdownItems = [
    <DropdownItem
      key="details"
      icon={<EyeIcon />}
      onClick={() => {
        handleViewDetails();
        setIsDropdownOpen(false);
      }}
      isDisabled={isLoadingDetails}
    >
      {isLoadingDetails ? 'Loading...' : 'View Details'}
    </DropdownItem>,
    <DropdownItem
      key="nodes"
      icon={<CubeIcon />}
      onClick={() => {
        onNodeClick();
        setIsDropdownOpen(false);
      }}
    >
      View Nodes
    </DropdownItem>,
    <DropdownItem
      key="operators"
      icon={<CubesIcon />}
      onClick={() => {
        onOperatorsClick();
        setIsDropdownOpen(false);
      }}
    >
      View Operators
    </DropdownItem>,
  ];

  // Calculate resource percentages for display
  const cpuUsagePercent = metrics.cpu_usage_percent || 0;
  const memoryUsagePercent = metrics.memory_usage_percent || 0;
  const storageUsagePercent = metrics.storage_capacity > 0 
    ? (metrics.storage_used / metrics.storage_capacity) * 100 
    : 0;

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Card className={clsx('cluster-card', `cluster-card--${health}`)}>
          <CardHeader>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr auto',
              gap: '0.5rem',
              alignItems: 'start'
            }}>
              {/* Left side: Icon and name */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                minWidth: 0,
                overflow: 'hidden'
              }}>
                <div style={{ flexShrink: 0 }}>
                  <OpenShiftIcon className="cluster-icon" />
                </div>
                <div style={{ 
                  overflow: 'hidden',
                  minWidth: 0
                }}>
                  <CardTitle 
                    className="cluster-title" 
                    style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={displayName}
                  >
                    {displayName}
                  </CardTitle>
                  {clusterName !== displayName && (
                    <div 
                      className="cluster-name pf-v5-u-font-size-sm pf-v5-u-color-200"
                      style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={clusterName}
                    >
                      {clusterName}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right side: Status badge and dropdown */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.25rem'
              }}>
                <Badge className={`status-badge status-badge--${status.color}`}>
                  <StatusIcon className="pf-v5-u-mr-xs" />
                  {status.label}
                </Badge>
                <Dropdown
                  isOpen={isDropdownOpen}
                  onSelect={onDropdownSelect}
                  onOpenChange={(isOpen: boolean) => setIsDropdownOpen(isOpen)}
                  popperProps={{
                    position: 'right',
                    appendTo: () => document.body,
                  }}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      isExpanded={isDropdownOpen}
                      variant="plain"
                      aria-label="Cluster actions"
                      style={{ padding: '6px' }}
                    >
                      <EllipsisVIcon />
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    {dropdownItems}
                  </DropdownList>
                </Dropdown>
              </div>
            </div>

            {/* Version, Channel, Console Link Row */}
            {(cluster.version || cluster.channel || cluster.console_url) && (
              <Flex 
                alignItems={{ default: 'alignItemsCenter' }} 
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                style={{ marginTop: '8px' }}
              >
                <FlexItem>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    {cluster.version && (
                      <FlexItem>
                        <Label color="blue" isCompact icon={<TagIcon />}>
                          {cluster.version}
                        </Label>
                      </FlexItem>
                    )}
                    {cluster.channel && (
                      <FlexItem>
                        <Label color="purple" isCompact icon={<CodeBranchIcon />}>
                          {cluster.channel}
                        </Label>
                      </FlexItem>
                    )}
                  </Flex>
                </FlexItem>
                {cluster.console_url && (
                  <FlexItem>
                    <Tooltip content={`Open ${displayName} console`}>
                      <Button
                        variant="plain"
                        component="a"
                        href={cluster.console_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open console"
                        size="sm"
                        className="console-link-button"
                        style={{ 
                          padding: '6px',
                          color: 'var(--pf-v5-global--Color--200)',
                        }}
                      >
                        <ExternalLinkAltIcon style={{ fontSize: '1rem' }} />
                      </Button>
                    </Tooltip>
                  </FlexItem>
                )}
              </Flex>
            )}
          </CardHeader>
          
          <CardBody>
            {/* Cluster Labels */}
            {cluster.labels && Object.keys(cluster.labels).length > 0 && (
              <LabelGroup numLabels={5} className="cluster-labels" style={{ marginBottom: '12px' }}>
                {cluster.labels.environment && (
                  <Label color="blue" isCompact>
                    {cluster.labels.environment}
                  </Label>
                )}
                {cluster.labels.region && (
                  <Label color="purple" isCompact>
                    {cluster.labels.region}
                  </Label>
                )}
                {Object.entries(cluster.labels)
                  .filter(([key]) => key !== 'environment' && key !== 'region')
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <Label key={key} isCompact>
                      {value as string}
                    </Label>
                  ))}
              </LabelGroup>
            )}

            {/* Compact Metrics Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '8px',
              marginBottom: '12px'
            }}>
              {/* Infrastructure Row */}
              <Tooltip content={`${metrics.nodes_ready || 0} ready, ${metrics.nodes_not_ready || 0} not ready`}>
                <div 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.02)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={onNodeClick}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ServerIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)' }}>
                      Nodes
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    color: metrics.nodes_not_ready > 0 ? 'var(--cluster-degraded)' : 'var(--pf-v5-global--Color--100)'
                  }}>
                    {metrics.nodes_ready || 0}/{metrics.nodes || 0}
                  </div>
                </div>
              </Tooltip>

              <Tooltip content={`${metrics.namespaces || 0} total namespaces`}>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.02)',
                  padding: '6px 8px',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LayerGroupIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)' }}>
                      Namespaces
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {metrics.namespaces || 0}
                  </div>
                </div>
              </Tooltip>

              <Tooltip content="Click to view operators">
                <div 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.02)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={onOperatorsClick}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CubesIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)' }}>
                      Operators
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {cluster.operator_count || 0}
                  </div>
                </div>
              </Tooltip>

              {/* Workloads Row */}
              <Tooltip content={`Running: ${metrics.pods_running || 0}, Failed: ${metrics.pods_failed || 0}, Pending: ${metrics.pods_pending || 0}`}>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.02)',
                  padding: '6px 8px',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CubeIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)' }}>
                      Pods
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600,
                    color: (metrics.pods_failed > 0 || metrics.pods_pending > 5) ? 'var(--cluster-degraded)' : 'var(--pf-v5-global--Color--100)'
                  }}>
                    {metrics.pods_running || 0}/{metrics.pods || 0}
                  </div>
                </div>
              </Tooltip>

              <Tooltip content={`${metrics.deployments || 0} deployments`}>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.02)',
                  padding: '6px 8px',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BuildIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)' }}>
                      Deployments
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {metrics.deployments || 0}
                  </div>
                </div>
              </Tooltip>

              <Tooltip content={`${metrics.services || 0} services`}>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.02)',
                  padding: '6px 8px',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ServiceIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)' }}>
                      Services
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {metrics.services || 0}
                  </div>
                </div>
              </Tooltip>
            </div>

            {/* Resource Usage Section */}
            <div style={{ 
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              paddingTop: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {/* CPU */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)', fontWeight: 600 }}>
                    <CpuIcon style={{ marginRight: '2px', fontSize: '0.75rem' }} />
                    CPU
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    color: cpuUsagePercent < 60 ? 'var(--cluster-healthy)' : cpuUsagePercent < 80 ? 'var(--cluster-degraded)' : 'var(--cluster-unhealthy)'
                  }}>
                    {Math.round(cpuUsagePercent)}%
                  </span>
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--pf-v5-global--Color--300)' }}>
                  {Math.round(metrics.cpu_requested || 0)}/{Math.round(metrics.cpu_capacity || 0)} cores
                </div>
              </div>

              {/* Memory */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)', fontWeight: 600 }}>
                    <MemoryIcon style={{ marginRight: '2px', fontSize: '0.75rem' }} />
                    Memory
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    color: memoryUsagePercent < 60 ? 'var(--cluster-healthy)' : memoryUsagePercent < 80 ? 'var(--cluster-degraded)' : 'var(--cluster-unhealthy)'
                  }}>
                    {Math.round(memoryUsagePercent)}%
                  </span>
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--pf-v5-global--Color--300)' }}>
                  {formatBytes(metrics.memory_requested || 0)}/{formatBytes(metrics.memory_capacity || 0)}
                </div>
              </div>

              {/* Storage */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: 'var(--pf-v5-global--Color--200)', fontWeight: 600 }}>
                    <VolumeIcon style={{ marginRight: '2px', fontSize: '0.75rem' }} />
                    Storage
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    color: storageUsagePercent < 60 ? 'var(--cluster-healthy)' : storageUsagePercent < 80 ? 'var(--cluster-degraded)' : 'var(--cluster-unhealthy)'
                  }}>
                    {Math.round(storageUsagePercent)}%
                  </span>
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--pf-v5-global--Color--300)' }}>
                  {metrics.pvcs || 0} PVCs
                </div>
              </div>
            </div>

            {/* Additional metrics */}
            {(metrics.statefulsets > 0 || metrics.daemonsets > 0) && (
              <div style={{ 
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                gap: '16px'
              }}>
                {metrics.statefulsets > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DatabaseIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }}>
                      {metrics.statefulsets} StatefulSets
                    </span>
                  </div>
                )}
                {metrics.daemonsets > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BuildIcon style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--pf-v5-global--Color--200)' }}>
                      {metrics.daemonsets} DaemonSets
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardBody>

          <CardFooter>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                {cluster.status?.last_check && (
                  <span className="last-check" style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--pf-v5-global--Color--200)',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}>
                    <ClockIcon className="pf-v5-u-mr-xs" style={{ fontSize: '0.75rem' }} />
                    Last checked: {new Date(cluster.status.last_check).toLocaleTimeString()}
                  </span>
                )}
              </FlexItem>
            </Flex>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Cluster Details Modal */}
      <Modal
        variant={ModalVariant.medium}
        title={`Cluster Details - ${displayName}`}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setIsDetailsModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {isLoadingDetails ? (
          <Spinner size="xl" />
        ) : clusterDetails ? (
          <DescriptionList isHorizontal>
            <DescriptionListGroup>
              <DescriptionListTerm>Cluster Name</DescriptionListTerm>
              <DescriptionListDescription>{clusterDetails.name}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Display Name</DescriptionListTerm>
              <DescriptionListDescription>{clusterDetails.spec?.displayName || clusterDetails.name}</DescriptionListDescription>
            </DescriptionListGroup>
            {clusterDetails.version && (
              <DescriptionListGroup>
                <DescriptionListTerm>Version</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="blue" isCompact>{clusterDetails.version}</Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {clusterDetails.channel && (
              <DescriptionListGroup>
                <DescriptionListTerm>Channel</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="purple" isCompact>{clusterDetails.channel}</Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>API URL</DescriptionListTerm>
              <DescriptionListDescription>{clusterDetails.api_url || 'Not available'}</DescriptionListDescription>
            </DescriptionListGroup>
            {clusterDetails.console_url && (
              <DescriptionListGroup>
                <DescriptionListTerm>Console URL</DescriptionListTerm>
                <DescriptionListDescription>
                  <a 
                    href={clusterDetails.console_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'var(--pf-v5-global--link--Color)',
                      textDecoration: 'none'
                    }}
                  >
                    {clusterDetails.console_url}
                    <ExternalLinkAltIcon className="pf-v5-u-ml-xs" style={{ fontSize: '0.875rem' }} />
                  </a>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Platform</DescriptionListTerm>
              <DescriptionListDescription>{clusterDetails.platform || 'OpenShift'}</DescriptionListDescription>
            </DescriptionListGroup>
            {clusterDetails.metrics && (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>Total Nodes</DescriptionListTerm>
                  <DescriptionListDescription>
                    {clusterDetails.metrics.nodes || 0} ({clusterDetails.metrics.nodes_ready || 0} ready)
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Namespaces</DescriptionListTerm>
                  <DescriptionListDescription>{clusterDetails.metrics.namespaces || 0}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Pods</DescriptionListTerm>
                  <DescriptionListDescription>
                    {clusterDetails.metrics.pods || 0} total ({clusterDetails.metrics.pods_running || 0} running)
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Deployments</DescriptionListTerm>
                  <DescriptionListDescription>{clusterDetails.metrics.deployments || 0}</DescriptionListDescription>
                </DescriptionListGroup>
              </>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Operators</DescriptionListTerm>
              <DescriptionListDescription>{clusterDetails.operator_count || 0}</DescriptionListDescription>
            </DescriptionListGroup>
            {clusterDetails.labels && (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>Environment</DescriptionListTerm>
                  <DescriptionListDescription>{clusterDetails.labels.environment || 'N/A'}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Region</DescriptionListTerm>
                  <DescriptionListDescription>{clusterDetails.labels.region || 'N/A'}</DescriptionListDescription>
                </DescriptionListGroup>
              </>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Last Updated</DescriptionListTerm>
              <DescriptionListDescription>
                {clusterDetails.status?.last_check 
                  ? new Date(clusterDetails.status.last_check).toLocaleString()
                  : 'Unknown'}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        ) : (
          <div>No details available</div>
        )}
      </Modal>
    </>
  );
};
