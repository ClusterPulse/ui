import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Label,
  Tooltip,
  Spinner,
  EmptyState,
  EmptyStateBody,
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
} from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { clusterAPI } from '../services/api';

interface Registry {
  name: string;
  spec: { displayName?: string; endpoint?: string; [key: string]: any };
  status: { available?: boolean; error?: string; [key: string]: any };
}

export const RegistryStatus: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegistry, setSelectedRegistry] = useState<Registry | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const { data: registries = [], isLoading, error } = useQuery<Registry[]>({
    queryKey: ['registries'],
    queryFn: async () => {
      const response = await clusterAPI.getRegistriesStatus();
      return response;
    },
    refetchInterval: 30000,
  });

  const availableCount = registries.filter(r => r.status?.available).length;
  const totalCount = registries.length;

  const getStatusColor = () => {
    if (totalCount === 0) return 'grey';
    if (availableCount === 0) return 'red';
    if (availableCount < totalCount) return 'orange';
    return 'green';
  };

  const handleRegistryClick = (registry: Registry) => {
    if (!registry.status?.available && registry.status?.error) {
      setSelectedRegistry(registry);
      setIsErrorModalOpen(true);
    }
  };

  const handleStatusClick = () => {
    setIsModalOpen(true);
  };

  if (error) {
    return null;
  }

  return (
    <>
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

      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-label="Container Registries"
      >
        <ModalHeader 
          title="Container Registries"
          description={`${availableCount} of ${totalCount} registries are available`}
        />
        <ModalBody>
          {registries.length === 0 ? (
            <EmptyState
              titleText="No registries configured"
              headingLevel="h4"
              icon={RegistryIcon}
            >
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
                      borderRadius: 'var(--pf-t--global--border--radius--small)',
                      background: registry.status?.available
                        ? 'color-mix(in srgb, var(--cluster-healthy) 8%, transparent)'
                        : 'color-mix(in srgb, var(--cluster-unhealthy) 8%, transparent)',
                      marginBottom: '8px',
                      cursor: !registry.status?.available ? 'pointer' : 'default',
                      transition: 'background 0.2s ease'
                    }}
                    onClick={() => handleRegistryClick(registry)}
                  >
                    <FlexItem>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          {registry.status?.available ? (
                            <CheckCircleIcon color="var(--cluster-healthy)" />
                          ) : (
                            <ExclamationCircleIcon color="var(--cluster-unhealthy)" />
                          )}
                        </FlexItem>
                        <FlexItem>
                          <div>
                            <strong>{registry.spec?.displayName}</strong>
                            {registry.spec?.endpoint && (
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--pf-t--global--text--color--subtle)',
                                  marginTop: '2px'
                                }}
                              >
                                {registry.spec.endpoint}
                              </div>
                            )}
                          </div>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Label
                        color={registry.status?.available ? 'green' : 'red'}
                        isCompact
                      >
                        {registry.status?.available ? 'Available' : 'Unavailable'}
                      </Label>
                    </FlexItem>
                  </Flex>
                </ListItem>
              ))}
            </List>
          )}
        </ModalBody>
        <ModalFooter>
          <Button key="close" variant="primary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        variant={ModalVariant.small}
        isOpen={isErrorModalOpen}
        onClose={() => {
          setIsErrorModalOpen(false);
          setSelectedRegistry(null);
        }}
        aria-label={`Registry Error - ${selectedRegistry?.spec?.displayName}`}
      >
        <ModalHeader title={`Registry Error - ${selectedRegistry?.spec?.displayName}`} />
        <ModalBody>
          {selectedRegistry && (
            <>
              <Alert
                variant="danger"
                isInline
                title="Registry Unavailable"
                className="pf-v6-u-mb-md"
              />
              <div>
                <strong>Registry:</strong> {selectedRegistry.spec?.displayName}
              </div>
              {selectedRegistry.spec?.endpoint && (
                <div className="pf-v6-u-mt-sm">
                  <strong>Endpoint:</strong> {selectedRegistry.spec.endpoint}
                </div>
              )}
              <div className="pf-v6-u-mt-md">
                <strong>Error Details:</strong>
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'var(--pf-t--global--background--color--secondary--default)',
                    borderRadius: 'var(--pf-t--global--border--radius--small)',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {selectedRegistry.status?.error}
                </div>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button 
            key="close" 
            variant="primary" 
            onClick={() => {
              setIsErrorModalOpen(false);
              setSelectedRegistry(null);
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
