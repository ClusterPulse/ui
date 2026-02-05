/**
 * CustomResourceDetailModal Component
 * Displays detailed information about custom resources for a cluster
 */
import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Button,
  Flex,
  FlexItem,
  Card,
  CardBody,
  Label,
  LabelGroup,
  Alert,
  Spinner,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Pagination,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tooltip,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import {
  CubesIcon,
  FilterIcon,
  SortAmountDownIcon,
  SortAmountUpIcon,
  LayerGroupIcon,
  OutlinedClockIcon,
} from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { clusterAPI } from '../services/api';
import type { CustomResourcesResponse, CustomResourceItem } from '../types/customResources';

interface CustomResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusterName: string;
  resourceTypeName: string;
  displayName: string;
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toLocaleString();
  }
  return String(value);
};

const ResourceCard: React.FC<{ resource: CustomResourceItem; index: number }> = ({ resource, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract common fields
  const name = resource._name || resource.values?.name || 'Unknown';
  const namespace = resource._namespace || resource.values?.namespace;
  const values = resource.values || {};
  
  // Get display fields (exclude internal ones)
  const displayFields = Object.entries(values).filter(
    ([key]) => !key.startsWith('_') && key !== 'name' && key !== 'namespace'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card isCompact style={{ marginBottom: '8px' }}>
        <CardBody style={{ padding: '12px 16px' }}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <FlexItem flex={{ default: 'flex_1' }}>
              <div>
                <strong style={{ fontSize: '0.875rem' }}>{name}</strong>
                {namespace && (
                  <LabelGroup style={{ marginLeft: '8px', display: 'inline-flex' }}>
                    <Label isCompact icon={<LayerGroupIcon />} color="blue">
                      {namespace}
                    </Label>
                  </LabelGroup>
                )}
              </div>
              
              {/* Quick preview of key values */}
              {displayFields.length > 0 && !isExpanded && (
                <div style={{ 
                  marginTop: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--pf-t--global--text--color--subtle)'
                }}>
                  {displayFields.slice(0, 3).map(([key, val]) => (
                    <span key={key} style={{ marginRight: '12px' }}>
                      <strong>{key}:</strong> {formatValue(val)}
                    </span>
                  ))}
                  {displayFields.length > 3 && (
                    <span>+{displayFields.length - 3} more</span>
                  )}
                </div>
              )}
            </FlexItem>
            <FlexItem>
              <Button
                variant="link"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Less' : 'More'}
              </Button>
            </FlexItem>
          </Flex>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--pf-t--global--border--color--default)'
                }}>
                  <DescriptionList isHorizontal isCompact>
                    {displayFields.map(([key, val]) => (
                      <DescriptionListGroup key={key}>
                        <DescriptionListTerm>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {formatValue(val)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    ))}
                  </DescriptionList>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>
    </motion.div>
  );
};

export const CustomResourceDetailModal: React.FC<CustomResourceDetailModalProps> = ({
  isOpen,
  onClose,
  clusterName,
  resourceTypeName,
  displayName,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [namespaceFilter, setNamespaceFilter] = useState<string>('');
  const [isNamespaceFilterOpen, setIsNamespaceFilterOpen] = useState(false);

  const { data, isLoading, error } = useQuery<CustomResourcesResponse>({
    queryKey: ['customResources', clusterName, resourceTypeName, page, pageSize, sortBy, sortOrder, namespaceFilter],
    queryFn: () => clusterAPI.getCustomResources(clusterName, resourceTypeName, {
      page,
      pageSize,
      includeAggregations: true,
      namespace: namespaceFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder,
    }),
    enabled: isOpen && !!clusterName && !!resourceTypeName,
    staleTime: 30000,
  });

  // Get unique namespaces from current data for filter
  const availableNamespaces = useMemo(() => {
    if (!data?.items) return [];
    const namespaces = new Set<string>();
    data.items.forEach(item => {
      const ns = item._namespace || item.values?.namespace;
      if (ns) namespaces.add(ns);
    });
    return Array.from(namespaces).sort();
  }, [data?.items]);

  // Client-side search filter
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!searchValue) return data.items;
    
    const search = searchValue.toLowerCase();
    return data.items.filter(item => {
      const name = (item._name || item.values?.name || '').toLowerCase();
      const namespace = (item._namespace || item.values?.namespace || '').toLowerCase();
      return name.includes(search) || namespace.includes(search);
    });
  }, [data?.items, searchValue]);

  const handlePageChange = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (_: any, newPerPage: number) => {
    setPageSize(newPerPage);
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      aria-label={`${displayName} - ${clusterName}`}
    >
      <ModalHeader
        title={`${displayName}`}
        description={
          <Flex spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem>
              <Label isCompact color="blue">{clusterName}</Label>
            </FlexItem>
            <FlexItem>
              <Label isCompact>{resourceTypeName}</Label>
            </FlexItem>
            {data?.collectedAt && (
              <FlexItem>
                <Tooltip content={`Last collected: ${new Date(data.collectedAt).toLocaleString()}`}>
                  <Label isCompact icon={<OutlinedClockIcon />} color="grey">
                    {new Date(data.collectedAt).toLocaleTimeString()}
                  </Label>
                </Tooltip>
              </FlexItem>
            )}
            {data?.filtered && (
              <FlexItem>
                <Label isCompact color="orange">Filtered by permissions</Label>
              </FlexItem>
            )}
          </Flex>
        }
      />
      <ModalBody>
        {/* Aggregations summary */}
        {data?.aggregations && Object.keys(data.aggregations).length > 0 && (
          <Card isCompact className="pf-v6-u-mb-md">
            <CardBody>
              <Flex spaceItems={{ default: 'spaceItemsLg' }}>
                {Object.entries(data.aggregations).map(([key, value]) => (
                  <FlexItem key={key}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700,
                        color: 'var(--pf-t--global--color--brand--default)'
                      }}>
                        {formatValue(value)}
                      </div>
                      <div style={{ 
                        fontSize: '0.625rem',
                        textTransform: 'uppercase',
                        color: 'var(--pf-t--global--text--color--subtle)',
                        fontWeight: 600
                      }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </FlexItem>
                ))}
              </Flex>
            </CardBody>
          </Card>
        )}

        {/* Toolbar */}
        <Toolbar className="pf-v6-u-mb-md">
          <ToolbarContent>
            <ToolbarItem className="pf-v6-u-flex-1">
              <SearchInput
                placeholder="Search by name or namespace..."
                value={searchValue}
                onChange={(_, value) => setSearchValue(value)}
                onClear={() => setSearchValue('')}
              />
            </ToolbarItem>
            
            {availableNamespaces.length > 0 && (
              <ToolbarItem>
                <Dropdown
                  isOpen={isNamespaceFilterOpen}
                  onOpenChange={setIsNamespaceFilterOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsNamespaceFilterOpen(!isNamespaceFilterOpen)}
                      isExpanded={isNamespaceFilterOpen}
                      icon={<FilterIcon />}
                    >
                      {namespaceFilter || 'All Namespaces'}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="all"
                      onClick={() => {
                        setNamespaceFilter('');
                        setIsNamespaceFilterOpen(false);
                        setPage(1);
                      }}
                    >
                      All Namespaces
                    </DropdownItem>
                    {availableNamespaces.map(ns => (
                      <DropdownItem
                        key={ns}
                        onClick={() => {
                          setNamespaceFilter(ns);
                          setIsNamespaceFilterOpen(false);
                          setPage(1);
                        }}
                      >
                        {ns}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>
            )}

            <ToolbarItem>
              <Tooltip content={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}>
                <Button
                  variant="plain"
                  onClick={toggleSortOrder}
                  icon={sortOrder === 'asc' ? <SortAmountUpIcon /> : <SortAmountDownIcon />}
                />
              </Tooltip>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <Bullseye style={{ minHeight: '200px' }}>
              <Spinner size="lg" />
            </Bullseye>
          ) : error ? (
            <Alert variant="danger" title="Failed to load resources" isInline>
              {(error as any).message || 'An error occurred while fetching resources.'}
            </Alert>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              titleText="No resources found"
              headingLevel="h4"
              icon={CubesIcon}
            >
              <EmptyStateBody>
                {searchValue || namespaceFilter
                  ? 'No resources match your search or filter criteria.'
                  : 'No resources of this type are available in this cluster.'}
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {filteredItems.map((item, index) => (
                <ResourceCard key={item._id || index} resource={item} index={index} />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {data?.pagination && data.pagination.total > 0 && (
          <Pagination
            itemCount={data.pagination.total}
            page={page}
            perPage={pageSize}
            onSetPage={handlePageChange}
            onPerPageSelect={handlePerPageSelect}
            variant="bottom"
            className="pf-v6-u-mt-md"
          />
        )}
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
