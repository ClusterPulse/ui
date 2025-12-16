import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Button,
  Card,
  CardBody,
  Title,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Spinner,
  Bullseye,
  SearchInput,
  Tooltip,
  Alert,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Label,
  LabelGroup,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  ServerIcon,
  TagIcon,
  FilterIcon,
  AngleDownIcon,
  AngleRightIcon,
} from '@patternfly/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { clusterAPI } from '../services/api';
import toast from 'react-hot-toast';

// Type definitions
type NodeStatus = 'Ready' | 'NotReady' | 'SchedulingDisabled' | 'Unknown';

interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: any | null;
}

// Node status configurations
const nodeStatusConfig: Record<NodeStatus, {
  color: 'green' | 'red' | 'orange' | 'grey';
  icon: React.ComponentType;
  label: string;
}> = {
  'Ready': {
    color: 'green',
    icon: CheckCircleIcon,
    label: 'Ready',
  },
  'NotReady': {
    color: 'red',
    icon: ExclamationCircleIcon,
    label: 'Not Ready',
  },
  'SchedulingDisabled': {
    color: 'orange',
    icon: ExclamationTriangleIcon,
    label: 'Scheduling Disabled',
  },
  'Unknown': {
    color: 'grey',
    icon: InfoCircleIcon,
    label: 'Unknown',
  },
};

// Helper functions
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatUptime = (startTime?: string): string => {
  if (!startTime) return 'Unknown';
  const start = new Date(startTime);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
};

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  isOpen,
  onClose,
  cluster,
}) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && cluster) {
      fetchNodes();
    }
  }, [isOpen, cluster]);

  const fetchNodes = async () => {
    if (!cluster) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const nodesData = await clusterAPI.getClusterNodes(cluster.name);
      setNodes(nodesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch nodes');
      setNodes([]);
      toast.error(`Failed to load nodes for ${cluster.displayName || cluster.name}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch = 
        node.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        node.roles?.some((role: string) => role.toLowerCase().includes(searchValue.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
      
      const matchesRole = roleFilter === 'all' || 
        node.roles?.some((role: string) => role === roleFilter);
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [nodes, searchValue, statusFilter, roleFilter]);

  // Count nodes by status
  const statusCounts = useMemo(() => {
    const counts: Record<NodeStatus, number> = {
      Ready: 0,
      NotReady: 0,
      SchedulingDisabled: 0,
      Unknown: 0,
    };
    
    nodes.forEach(node => {
      const status = (node.status || 'Unknown') as NodeStatus;
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts.Unknown++;
      }
    });
    
    return counts;
  }, [nodes]);

  // Get unique roles
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    nodes.forEach(node => {
      node.roles?.forEach((role: string) => roles.add(role));
    });
    return Array.from(roles).sort();
  }, [nodes]);

  const toggleNodeExpansion = (nodeName: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeName)) {
      newExpanded.delete(nodeName);
    } else {
      newExpanded.add(nodeName);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNodeCard = (node: any) => {
    const status = (node.status || 'Unknown') as NodeStatus;
    const statusInfo = nodeStatusConfig[status] || nodeStatusConfig.Unknown;
    const StatusIcon = statusInfo.icon;
    const isExpanded = expandedNodes.has(node.name);
    
    // Calculate resource usage percentages based on requested vs allocatable
    const cpuUsagePercent = node.cpu_allocatable > 0 
      ? Math.round(((node.cpu_requested || 0) / node.cpu_allocatable) * 100) 
      : 0;
    const memoryUsagePercent = node.memory_allocatable > 0 
      ? Math.round(((node.memory_requested || 0) / node.memory_allocatable) * 100) 
      : 0;
    const podsTotal = node.pods_total || (node.pods_running + node.pods_succeeded + node.pods_failed + node.pods_pending) || 0;

    return (
      <motion.div
        key={node.name}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className="node-minimal-card"
          style={{ 
            border: 'none',
            borderRadius: '4px',
            background: 'var(--pf-v6-global--BackgroundColor--100)',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
            marginBottom: '8px',
            overflow: 'visible',
          }}
        >
          <CardBody style={{ padding: '16px 20px' }}>
            {/* Main Row */}
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                  {/* Expand/Collapse Button */}
                  <FlexItem>
                    <Button
                      variant="plain"
                      onClick={() => toggleNodeExpansion(node.name)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      style={{ 
                        padding: '4px',
                        minWidth: '24px',
                        color: 'var(--pf-v6-global--Color--200)'
                      }}
                    >
                      {isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
                    </Button>
                  </FlexItem>

                  {/* Status Icon */}
                  <FlexItem>
                    <span style={{ 
                      color: `var(--pf-v6-global--${statusInfo.color}-color--100)`,
                      fontSize: '1rem'
                    }}>
                      <StatusIcon />
                    </span>
                  </FlexItem>

                  {/* Node Name */}
                  <FlexItem>
                    <div>
                      <strong style={{ 
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--pf-v6-global--Color--100)'
                      }}>
                        {node.name}
                      </strong>
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: 'var(--pf-v6-global--Color--200)',
                        marginTop: '2px'
                      }}>
                        {node.roles?.join(', ') || 'No roles'}
                      </div>
                    </div>
                  </FlexItem>

                  {/* Version Badge */}
                  {node.kubelet_version && (
                    <FlexItem>
                      <Label isCompact style={{ fontSize: '0.625rem' }}>
                        {node.kubelet_version}
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
              </FlexItem>

              {/* Resource Metrics */}
              <FlexItem>
                <Flex spaceItems={{ default: 'spaceItemsXl' }}>
                  {/* CPU */}
                  <FlexItem>
                    <Tooltip content={`CPU Requested: ${(node.cpu_requested || 0).toFixed(1)} / Allocatable: ${(node.cpu_allocatable || 0).toFixed(1)} cores`}>
                      <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                        <div style={{ 
                          fontSize: '0.625rem',
                          color: 'var(--pf-v6-global--Color--200)',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          CPU
                        </div>
                        <div style={{ 
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: cpuUsagePercent > 80 ? 'var(--pf-v6-global--danger-color--100)' : 
                                 cpuUsagePercent > 60 ? 'var(--pf-v6-global--warning-color--100)' : 
                                 'var(--pf-v6-global--success-color--100)'
                        }}>
                          {cpuUsagePercent}%
                        </div>
                        <div style={{ 
                          fontSize: '0.625rem',
                          color: 'var(--pf-v6-global--Color--300)'
                        }}>
                          {(node.cpu_requested || 0).toFixed(1)}/{(node.cpu_allocatable || 0).toFixed(1)}
                        </div>
                      </div>
                    </Tooltip>
                  </FlexItem>

                  {/* Memory */}
                  <FlexItem>
                    <Tooltip content={`Memory Requested: ${formatBytes(node.memory_requested || 0)} / Allocatable: ${formatBytes(node.memory_allocatable || 0)}`}>
                      <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                        <div style={{ 
                          fontSize: '0.625rem',
                          color: 'var(--pf-v6-global--Color--200)',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Memory
                        </div>
                        <div style={{ 
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: memoryUsagePercent > 80 ? 'var(--pf-v6-global--danger-color--100)' : 
                                 memoryUsagePercent > 60 ? 'var(--pf-v6-global--warning-color--100)' : 
                                 'var(--pf-v6-global--success-color--100)'
                        }}>
                          {memoryUsagePercent}%
                        </div>
                        <div style={{ 
                          fontSize: '0.625rem',
                          color: 'var(--pf-v6-global--Color--300)'
                        }}>
                          {formatBytes(node.memory_requested || 0)}
                        </div>
                      </div>
                    </Tooltip>
                  </FlexItem>

                  {/* Pods */}
                  <FlexItem>
                    <Tooltip content={
                      <div>
                        <div>Running: {node.pods_running || 0}</div>
                        {node.pods_pending > 0 && <div>Pending: {node.pods_pending}</div>}
                        {node.pods_failed > 0 && <div>Failed: {node.pods_failed}</div>}
                        {node.pods_succeeded > 0 && <div>Succeeded: {node.pods_succeeded}</div>}
                        <div>Total: {podsTotal} / Capacity: {node.pods_capacity || 0}</div>
                      </div>
                    }>
                      <div style={{ textAlign: 'center', minWidth: '60px', cursor: 'help' }}>
                        <div style={{ 
                          fontSize: '0.625rem',
                          color: 'var(--pf-v6-global--Color--200)',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Pods
                        </div>
                        <div style={{ 
                          fontSize: '1rem',
                          fontWeight: 500,
                          color: (node.pods_failed > 0 || node.pods_pending > 0) 
                            ? 'var(--pf-v6-global--warning-color--100)' 
                            : 'var(--pf-v6-global--Color--100)'
                        }}>
                          {node.pods_running || 0}
                        </div>
                        <div style={{ 
                          fontSize: '0.625rem',
                          color: 'var(--pf-v6-global--Color--300)'
                        }}>
                          of {podsTotal}
                          {(node.pods_failed > 0 || node.pods_pending > 0) && (
                            <span style={{ 
                              color: 'var(--pf-v6-global--warning-color--100)',
                              marginLeft: '2px'
                            }}>
                              !
                            </span>
                          )}
                        </div>
                      </div>
                    </Tooltip>
                  </FlexItem>

                  {/* Age */}
                  <FlexItem>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                      <div style={{ 
                        fontSize: '0.625rem',
                        color: 'var(--pf-v6-global--Color--200)',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Age
                      </div>
                      <div style={{ 
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'var(--pf-v6-global--Color--100)'
                      }}>
                        {formatUptime(node.creation_timestamp)}
                      </div>
                    </div>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ 
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--pf-v6-global--BorderColor--100)'
                  }}>
                    {/* System Info */}
                    <div style={{ marginBottom: '16px' }}>
                      <Title headingLevel="h6" size="md" style={{ 
                        fontSize: '0.75rem',
                        marginBottom: '8px',
                        color: 'var(--pf-v6-global--Color--200)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        System Information
                      </Title>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px'
                      }}>
                        <div style={{ fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>OS: </span>
                          <span style={{ color: 'var(--pf-v6-global--Color--100)' }}>
                            {node.os_image || 'Unknown'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>Runtime: </span>
                          <span style={{ color: 'var(--pf-v6-global--Color--100)' }}>
                            {node.container_runtime || 'Unknown'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>Kernel: </span>
                          <span style={{ color: 'var(--pf-v6-global--Color--100)' }}>
                            {node.kernel_version || 'Unknown'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>Architecture: </span>
                          <span style={{ color: 'var(--pf-v6-global--Color--100)' }}>
                            {node.architecture || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Node Conditions */}
                    {node.conditions && node.conditions.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <Title headingLevel="h6" size="md" style={{ 
                          fontSize: '0.75rem',
                          marginBottom: '8px',
                          color: 'var(--pf-v6-global--Color--200)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Conditions
                        </Title>
                        <LabelGroup numLabels={10}>
                          {node.conditions.map((condition: any, idx: number) => {
                            // Pressure conditions should be green when False
                            const isPressureCondition = condition.type?.includes('Pressure') || 
                                                       condition.type === 'DiskPressure' ||
                                                       condition.type === 'MemoryPressure' ||
                                                       condition.type === 'PIDPressure';
                            const isReady = condition.type === 'Ready';
                            
                            let backgroundColor = 'rgba(0, 0, 0, 0.05)'; // default/unknown
                            
                            if (condition.status === 'True') {
                              backgroundColor = isReady ? 'rgba(92, 163, 82, 0.1)' : // Ready=True is good
                                              isPressureCondition ? 'rgba(201, 25, 11, 0.1)' : // Pressure=True is bad
                                              'rgba(92, 163, 82, 0.1)'; // Others True is usually good
                            } else if (condition.status === 'False') {
                              backgroundColor = isReady ? 'rgba(201, 25, 11, 0.1)' : // Ready=False is bad
                                              isPressureCondition ? 'rgba(92, 163, 82, 0.1)' : // Pressure=False is good
                                              'rgba(201, 25, 11, 0.1)'; // Others False is usually bad
                            }
                            
                            return (
                              <Label
                                key={idx}
                                isCompact
                                style={{ 
                                  fontSize: '0.625rem',
                                  background: backgroundColor
                                }}
                              >
                                {condition.type}: {condition.status}
                              </Label>
                            );
                          })}
                        </LabelGroup>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardBody>
        </Card>
      </motion.div>
    );
  };

  if (!cluster) return null;

  const getStatusSummary = () => {
    const parts = [];
    if (statusCounts.Ready > 0) parts.push(`${statusCounts.Ready} ready`);
    if (statusCounts.NotReady > 0) parts.push(`${statusCounts.NotReady} not ready`);
    if (statusCounts.SchedulingDisabled > 0) parts.push(`${statusCounts.SchedulingDisabled} disabled`);
    return parts.join(', ');
  };

  const modalDescription = loading 
    ? 'Loading nodes...' 
    : error 
      ? 'Error loading nodes' 
      : nodes.length > 0 
        ? `${nodes.length} nodes (${getStatusSummary()})` 
        : '';

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="node-details-modal-title"
      aria-describedby="node-details-modal-body"
    >
      <ModalHeader 
        title={`Nodes - ${cluster.displayName || cluster.name}`} 
        labelId="node-details-modal-title"
        description={modalDescription}
      />
      <ModalBody id="node-details-modal-body">
        {/* Minimal Toolbar */}
        <div style={{ 
          marginBottom: '16px',
          padding: '12px 0',
          background: 'transparent'
        }}>
          <Flex>
            <FlexItem flex={{ default: 'flex_1' }}>
              <SearchInput
                placeholder="Search nodes..."
                value={searchValue}
                onChange={(_, value) => setSearchValue(value)}
                onClear={() => setSearchValue('')}
                style={{ maxWidth: '400px' }}
              />
            </FlexItem>
            <FlexItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Dropdown
                    isOpen={isStatusFilterOpen}
                    onOpenChange={setIsStatusFilterOpen}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                        isExpanded={isStatusFilterOpen}
                        variant="secondary"
                        style={{ 
                          fontSize: '0.875rem',
                          padding: '6px 12px'
                        }}
                      >
                        <span style={{ marginRight: '4px', fontSize: '0.75rem' }}>
                          <FilterIcon />
                        </span>
                        {statusFilter === 'all' ? 'All Status' : statusFilter}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem
                        key="all"
                        onClick={() => {
                          setStatusFilter('all');
                          setIsStatusFilterOpen(false);
                        }}
                      >
                        All ({nodes.length})
                      </DropdownItem>
                      {Object.entries(statusCounts).map(([status, count]) => (
                        count > 0 && (
                          <DropdownItem
                            key={status}
                            onClick={() => {
                              setStatusFilter(status);
                              setIsStatusFilterOpen(false);
                            }}
                          >
                            {status} ({count})
                          </DropdownItem>
                        )
                      ))}
                    </DropdownList>
                  </Dropdown>
                </FlexItem>
                {uniqueRoles.length > 0 && (
                  <FlexItem>
                    <Dropdown
                      isOpen={isRoleFilterOpen}
                      onOpenChange={setIsRoleFilterOpen}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                          isExpanded={isRoleFilterOpen}
                          variant="secondary"
                          style={{ 
                            fontSize: '0.875rem',
                            padding: '6px 12px'
                          }}
                        >
                          <span style={{ marginRight: '4px', fontSize: '0.75rem' }}>
                            <TagIcon />
                          </span>
                          {roleFilter === 'all' ? 'All Roles' : roleFilter}
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem
                          key="all"
                          onClick={() => {
                            setRoleFilter('all');
                            setIsRoleFilterOpen(false);
                          }}
                        >
                          All Roles
                        </DropdownItem>
                        {uniqueRoles.map(role => (
                          <DropdownItem
                            key={role}
                            onClick={() => {
                              setRoleFilter(role);
                              setIsRoleFilterOpen(false);
                            }}
                          >
                            {role}
                          </DropdownItem>
                        ))}
                      </DropdownList>
                    </Dropdown>
                  </FlexItem>
                )}
              </Flex>
            </FlexItem>
          </Flex>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <Bullseye style={{ minHeight: '200px' }}>
              <Spinner size="lg" />
            </Bullseye>
          ) : error ? (
            <Alert variant="danger" title="Failed to load nodes" isInline>
              {error}
            </Alert>
          ) : filteredNodes.length === 0 ? (
            <EmptyState
              titleText="No nodes found"
              headingLevel="h4"
              icon={ServerIcon}
            >
              <EmptyStateBody>
                {searchValue || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'No nodes match your search or filter criteria.'
                  : 'No node information is available for this cluster.'}
              </EmptyStateBody>
              <EmptyStateFooter />
            </EmptyState>
          ) : (
            <div>
              {filteredNodes.map((node) => renderNodeCard(node))}
            </div>
          )}
        </AnimatePresence>
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
