import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Label,
  LabelGroup,
  Flex,
  FlexItem,
  Alert,
  Bullseye,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import {
  CubesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InProgressIcon,
  BanIcon,
  QuestionCircleIcon,
  DatabaseIcon,
  CloudIcon,
  CogIcon,
  KeyIcon,
  ShieldAltIcon,
  UserIcon,
  LayerGroupIcon,
} from '@patternfly/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { clusterAPI } from '../services/api';

interface OperatorsViewProps {
  isOpen: boolean;
  onClose: () => void;
  clusterName: string;
}

// Map operator icons based on category or name
const operatorIcons: Record<string, React.ComponentType> = {
  storage: DatabaseIcon,
  network: CloudIcon,
  security: ShieldAltIcon,
  authentication: KeyIcon,
  monitoring: CogIcon,
  user: UserIcon,
  extension: CubesIcon,
  default: CubesIcon,
};

// Map API status values to display status
const statusMapping: Record<string, string> = {
  'Succeeded': 'healthy',
  'AtLatestKnown': 'healthy',
  'Replacing': 'progressing',
  'Installing': 'progressing',
  'Pending': 'progressing',
  'Failed': 'error',
  'Unknown': 'unknown',
};

const statusConfig = {
  'healthy': {
    color: 'green' as const,
    icon: CheckCircleIcon,
    label: 'Healthy',
  },
  'degraded': {
    color: 'orange' as const,
    icon: ExclamationTriangleIcon,
    label: 'Degraded',
  },
  'error': {
    color: 'red' as const,
    icon: ExclamationCircleIcon,
    label: 'Error',
  },
  'not_installed': {
    color: 'grey' as const,
    icon: BanIcon,
    label: 'Not Installed',
  },
  'progressing': {
    color: 'blue' as const,
    icon: InProgressIcon,
    label: 'Progressing',
  },
  'unknown': {
    color: 'grey' as const,
    icon: QuestionCircleIcon,
    label: 'Unknown',
  },
};

export const OperatorsView: React.FC<OperatorsViewProps> = ({
  isOpen,
  onClose,
  clusterName,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && clusterName) {
      fetchOperators();
    }
  }, [isOpen, clusterName]);

  const fetchOperators = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const operatorsData = await clusterAPI.getClusterOperators(clusterName);
      setOperators(operatorsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch operators');
      setOperators([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter operators based on search
  const filteredOperators = operators.filter(op => {
    const matchesSearch = 
      op.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      op.display_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      op.installed_namespace?.toLowerCase().includes(searchValue.toLowerCase()) ||
      op.provider?.toLowerCase().includes(searchValue.toLowerCase());
    return matchesSearch;
  });

  const getOperatorStatus = (operator: any) => {
    // Use the status mapping to convert API status to our status
    const apiStatus = operator.status;
    const mappedStatus = statusMapping[apiStatus] || 'unknown';
    return mappedStatus;
  };

  const getNamespaceDisplay = (operator: any) => {
    if (operator.is_cluster_wide) {
      return 'Cluster-wide';
    }
    
    if (operator.available_count !== undefined) {
      if (operator.available_count === 1) {
        return operator.available_namespaces_detail || operator.installed_namespace;
      } else if (operator.available_in_namespaces?.[0] === '*') {
        return 'All namespaces';
      } else {
        return `${operator.available_count} namespaces`;
      }
    }
    
    // Fallback
    return operator.installed_namespace || 'Unknown';
  };

  const renderOperatorCard = (operator: any) => {
    // Determine icon based on provider or name
    const iconKey = operator.icon || 
                   (operator.provider?.toLowerCase().includes('red hat') ? 'security' : 
                    operator.display_name?.toLowerCase().includes('storage') ? 'storage' :
                    operator.display_name?.toLowerCase().includes('network') ? 'network' : 
                    'extension');
    const Icon = operatorIcons[iconKey] || operatorIcons.default;
    
    const status = getOperatorStatus(operator);
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
    const HealthIcon = config.icon;
    const namespaceDisplay = getNamespaceDisplay(operator);

    return (
      <motion.div
        key={operator.name}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Card className="operator-card">
          <CardHeader>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <div className="operator-icon-wrapper" style={{ position: 'relative', marginRight: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>
                    <Icon />
                  </span>
                  <div 
                    className={`health-badge health-badge--${config.color}`}
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      background: 'white',
                      borderRadius: '50%',
                      padding: '2px',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem' }}>
                      <HealthIcon />
                    </span>
                  </div>
                </div>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <CardTitle>{operator.display_name}</CardTitle>
                <div className="operator-namespace" style={{ fontSize: '0.875rem', color: '#6a6e73' }}>
                  {operator.provider || 'Unknown Provider'}
                </div>
              </FlexItem>
            </Flex>
          </CardHeader>
          <CardBody>
            <LabelGroup numLabels={4}>
              <Label color={config.color} icon={<HealthIcon />} isCompact>
                {config.label}
              </Label>
              {operator.version && (
                <Label isCompact>v{operator.version}</Label>
              )}
              <Tooltip 
                content={
                  operator.available_namespaces_detail && operator.available_count > 1
                    ? operator.available_namespaces_detail
                    : namespaceDisplay
                }
              >
                <Label icon={<LayerGroupIcon />} isCompact>
                  {namespaceDisplay}
                </Label>
              </Tooltip>
              {operator.install_mode && (
                <Label isCompact color="cyan">
                  {operator.install_mode}
                </Label>
              )}
            </LabelGroup>
            
            {/* Additional details */}
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6a6e73' }}>
              <div>Installed: {operator.installed_namespace}</div>
              {operator.updated_at && (
                <div>Updated: {new Date(operator.updated_at).toLocaleDateString()}</div>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    );
  };

  // Count operators by status
  const statusCounts = operators.reduce((acc, op) => {
    const status = getOperatorStatus(op);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusSummary = () => {
    const parts = [];
    if (statusCounts.healthy > 0) parts.push(`${statusCounts.healthy} healthy`);
    if (statusCounts.progressing > 0) parts.push(`${statusCounts.progressing} progressing`);
    if (statusCounts.error > 0) parts.push(`${statusCounts.error} failed`);
    if (statusCounts.degraded > 0) parts.push(`${statusCounts.degraded} degraded`);
    if (statusCounts.unknown > 0) parts.push(`${statusCounts.unknown} unknown`);
    return parts.join(', ');
  };

  return (
    <Modal
      variant={ModalVariant.large}
      title={`Operators - ${clusterName}`}
      description={
        !loading && operators.length > 0 
          ? `${operators.length} operators installed (${getStatusSummary()})`
          : ''
      }
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <Toolbar style={{ 
        background: 'transparent',
        border: 'none',
        padding: '12px 0',
        marginBottom: '16px'
      }}>
        <ToolbarContent>
          <ToolbarItem variant="search-filter" className="pf-v5-u-flex-1">
            <SearchInput
              placeholder="Search by name, namespace, or provider..."
              value={searchValue}
              onChange={(_, value) => setSearchValue(value)}
              onClear={() => setSearchValue('')}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <AnimatePresence mode="wait">
        {loading ? (
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        ) : error ? (
          <Alert variant="danger" title="Failed to load operators">
            {error}
          </Alert>
        ) : filteredOperators.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon icon={CubesIcon} />
            <Title headingLevel="h4" size="lg">
              No operators found
            </Title>
            <EmptyStateBody>
              {searchValue
                ? 'No operators match your search criteria.'
                : 'No operators are available for this cluster.'}
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Grid hasGutter>
            {filteredOperators.map(operator => (
              <GridItem key={operator.name} span={12} md={6} lg={4}>
                {renderOperatorCard(operator)}
              </GridItem>
            ))}
          </Grid>
        )}
      </AnimatePresence>
    </Modal>
  );
};
