import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalVariant,
  Label,
  Tooltip,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Title,
  List,
  ListItem,
  Alert,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  RegistryIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DatabaseIcon,
} from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { clusterAPI } from '../services/api';

interface Registry {
  name: string;
  display_name: string;
  endpoint: string | null;
  available: boolean;
  error: string | null;
}

export const RegistryStatus: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Fetch registry status
  const { data: registries = [], isLoading, error } = useQuery<Registry[]>({
    queryKey: ['registries'],
    queryFn: async () => {
      const response = await clusterAPI.getRegistriesStatus();
      return response;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate available count
  const availableCount = registries.filter(r => r.available).length;
  const totalCount = registries.length;

  // Determine color based on availability
  const getStatusColor = () => {
    if (totalCount === 0) return 'grey';
    if (availableCount === 0) return 'red';
    if (availableCount < totalCount) return 'orange';
    return 'green';
  };

  const handleRegistryClick = (registry: Registry) => {
    if (!registry.available && registry.error) {
      setSelectedRegistry(registry);
      setIsErrorModalOpen(true);
    }
  };

  const handleStatusClick = () => {
    setIsModalOpen(true);
  };

  if (error) {
    return null; // Don't show registry status if there's an error
  }

  return (
    <>
      {/* Status Button in Header */}
      <Tooltip
        content={
          isLoading 
            ? "Loading registry status..." 
            : `${availableCount} of ${totalCount} registries available`
        }
      >
        <Button
          variant="plain"
          onClick={handleStatusClick}
          isDisabled={isLoading || totalCount === 0}
          style={{ 
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RegistryIcon style={{ fontSize: '1rem' }} />
          {isLoading ? (
            <Spinner size="sm" />
          ) : (
            <Label 
              color={getStatusColor() as any} 
              isCompact
              style={{ cursor: 'pointer' }}
            >
              {availableCount}/{totalCount}
            </Label>
          )}
        </Button>
      </Tooltip>

      {/* Registry List Modal */}
      <Modal
        variant={ModalVariant.small}
        title={
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <DatabaseIcon className="pf-v5-u-mr-sm" />
            </FlexItem>
            <FlexItem>
              Container Registries
            </FlexItem>
          </Flex>
        }
        description={`${availableCount} of ${totalCount} registries are available`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {registries.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon icon={RegistryIcon} />
            <Title headingLevel="h4" size="lg">
              No registries configured
            </Title>
            <EmptyStateBody>
              No container registries are currently configured in the system.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <List isPlain>
            {registries.map((registry) => (
              <ListItem key={registry.name}>
                <Flex 
                  alignItems={{ default: 'alignItemsCenter' }}
                  justifyContent={{ default: 'justifyContentSpaceBetween' }}
                  style={{ 
                    padding: '8px 12px',
                    borderRadius: '4px',
                    background: registry.available 
                      ? 'rgba(92, 163, 82, 0.05)' 
                      : 'rgba(201, 25, 11, 0.05)',
                    marginBottom: '8px',
                    cursor: !registry.available ? 'pointer' : 'default',
                    transition: 'background 0.2s ease'
                  }}
                  onClick={() => handleRegistryClick(registry)}
                  onMouseEnter={(e) => {
                    if (!registry.available) {
                      e.currentTarget.style.background = 'rgba(201, 25, 11, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = registry.available 
                      ? 'rgba(92, 163, 82, 0.05)' 
                      : 'rgba(201, 25, 11, 0.05)';
                  }}
                >
                  <FlexItem>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        {registry.available ? (
                          <CheckCircleIcon color="green" />
                        ) : (
                          <ExclamationCircleIcon color="red" />
                        )}
                      </FlexItem>
                      <FlexItem>
                        <div>
                          <strong>{registry.display_name}</strong>
                          {registry.endpoint && (
                            <div 
                              style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--pf-v5-global--Color--200)',
                                marginTop: '2px'
                              }}
                            >
                              {registry.endpoint}
                            </div>
                          )}
                        </div>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                  <FlexItem>
                    <Label 
                      color={registry.available ? 'green' : 'red'} 
                      isCompact
                    >
                      {registry.available ? 'Available' : 'Unavailable'}
                    </Label>
                  </FlexItem>
                </Flex>
              </ListItem>
            ))}
          </List>
        )}
      </Modal>

      {/* Error Detail Modal */}
      <Modal
        variant={ModalVariant.small}
        title={`Registry Error - ${selectedRegistry?.display_name}`}
        isOpen={isErrorModalOpen}
        onClose={() => {
          setIsErrorModalOpen(false);
          setSelectedRegistry(null);
        }}
        actions={[
          <Button 
            key="close" 
            variant="primary" 
            onClick={() => {
              setIsErrorModalOpen(false);
              setSelectedRegistry(null);
            }}
          >
            Close
          </Button>,
        ]}
      >
        {selectedRegistry && (
          <>
            <Alert
              variant="danger"
              isInline
              title="Registry Unavailable"
              className="pf-v5-u-mb-md"
            />
            <div>
              <strong>Registry:</strong> {selectedRegistry.display_name}
            </div>
            {selectedRegistry.endpoint && (
              <div className="pf-v5-u-mt-sm">
                <strong>Endpoint:</strong> {selectedRegistry.endpoint}
              </div>
            )}
            <div className="pf-v5-u-mt-md">
              <strong>Error Details:</strong>
              <div 
                style={{ 
                  marginTop: '8px',
                  padding: '12px',
                  background: 'var(--pf-v5-global--BackgroundColor--200)',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {selectedRegistry.error}
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};
