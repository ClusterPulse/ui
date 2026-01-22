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
  ModalBody,
  ModalFooter,
  ModalHeader,
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
  CubesIcon,
  ClockIcon,
  LockIcon,
  EyeIcon,
  ExternalLinkAltIcon,
  CodeBranchIcon,
  TagIcon,
  CogIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { clusterAPI } from '../services/api';
import { OpenShiftIcon } from './icons/OpenShiftIcon';
import { CustomMetricsSection } from './CustomMetricsSection';

interface ClusterCardProps {
  cluster: any;
  onRefresh: () => void;
  onNodeClick: () => void;
  onOperatorsClick: () => void;
  onConfigureMetrics: () => void;
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
                    <div className="cluster-name pf-v6-u-font-size-sm pf-v6-u-color-200">
                      {cluster.name}
                    </div>
                  )}
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Badge className={`status-badge status-badge--${status.color}`}>
                <StatusIcon className="pf-v6-u-mr-xs" />
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
                color: 'var(--pf-t--global--text--color--subtle)', 
                opacity: 0.4 
              }} />
            </FlexItem>
            <FlexItem>
              <div style={{ 
                color: 'var(--pf-t--global--text--color--subtle)', 
                fontSize: '0.875rem',
                maxWidth: '280px'
              }}>
                Authentication required to view detailed cluster information
              </div>
            </FlexItem>
          </Flex>
        </CardBody>

        {cluster.status?.last_check && (
          <CardFooter>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <span className="last-check" style={{ fontSize: '0.75rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
                  <ClockIcon className="pf-v6-u-mr-xs" style={{ fontSize: '0.75rem' }} />
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

export const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onNodeClick,
  onOperatorsClick,
  onConfigureMetrics,
}) => {
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
    <DropdownItem
      key="configure"
      icon={<CogIcon />}
      onClick={() => {
        onConfigureMetrics();
        setIsDropdownOpen(false);
      }}
    >
      Configure Metrics
    </DropdownItem>,
  ];

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
                      className="cluster-name pf-v6-u-font-size-sm pf-v6-u-color-200"
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
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.25rem'
              }}>
                <Badge className={`status-badge status-badge--${status.color}`}>
                  <StatusIcon className="pf-v6-u-mr-xs" />
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
                          color: 'var(--pf-t--global--text--color--subtle)',
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

            {/* Custom Metrics Section */}
            <CustomMetricsSection
              clusterName={clusterName}
              onConfigureClick={onConfigureMetrics}
            />
          </CardBody>

          <CardFooter>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                {cluster.status?.last_check && (
                  <span className="last-check" style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--pf-t--global--text--color--subtle)',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}>
                    <ClockIcon className="pf-v6-u-mr-xs" style={{ fontSize: '0.75rem' }} />
                    Last checked: {new Date(cluster.status.last_check).toLocaleTimeString()}
                  </span>
                )}
              </FlexItem>
            </Flex>
          </CardFooter>
        </Card>
      </motion.div>

      <Modal
        variant={ModalVariant.medium}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        aria-label={`Cluster Details - ${displayName}`}
      >
        <ModalHeader title={`Cluster Details - ${displayName}`} />
        <ModalBody>
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
                        color: 'var(--pf-t--global--text--color--link--default)',
                        textDecoration: 'none'
                      }}
                    >
                      {clusterDetails.console_url}
                      <ExternalLinkAltIcon className="pf-v6-u-ml-xs" style={{ fontSize: '0.875rem' }} />
                    </a>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>Platform</DescriptionListTerm>
                <DescriptionListDescription>{clusterDetails.platform || 'OpenShift'}</DescriptionListDescription>
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
        </ModalBody>
        <ModalFooter>
          <Button key="close" variant="primary" onClick={() => setIsDetailsModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
