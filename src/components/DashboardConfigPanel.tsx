/**
 * DashboardConfigPanel Component
 * Catalog-based browser for discovering and configuring custom resource metrics
 */
import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Button,
  Card,
  CardBody,
  Label,
  LabelGroup,
  Alert,
  Spinner,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Divider,
  ActionList,
  ActionListItem,
  Tooltip,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
  Gallery,
  GalleryItem,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  TrashIcon,
  CubesIcon,
  GripVerticalIcon,
  DownloadIcon,
  UploadIcon,
  UndoIcon,
} from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, Reorder } from 'framer-motion';
import { clusterAPI } from '../services/api';
import {
  useDashboardConfigStore,
  type MetricTileConfig,
  type TileDisplayType
} from '../stores/dashboardConfigStore';
import type { CustomResourceType } from '../types/customResources';
import { MetricCatalogCard } from './MetricCatalogCard';

interface DashboardConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const displayTypeOptions: { value: TileDisplayType; label: string; description: string }[] = [
  { value: 'count', label: 'Count', description: 'Simple numeric display' },
  { value: 'bar', label: 'Progress Bar', description: 'Bar with progress indicator' },
  { value: 'percentage', label: 'Percentage', description: 'Percentage with bar' },
  { value: 'status', label: 'Status Indicator', description: 'Colored status dot' },
  { value: 'sparkline', label: 'Sparkline', description: 'Compact with trend' },
];

export const colorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'teal', label: 'Teal' },
  { value: 'grey', label: 'Grey' },
];

type ScopeFilter = 'all' | 'Namespaced' | 'Cluster';

export const DashboardConfigPanel: React.FC<DashboardConfigPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { globalConfig, removeTile, reorderTiles, resetConfig, importConfig, exportConfig } = useDashboardConfigStore();
  const [searchValue, setSearchValue] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');

  const { data: resourceTypes = [], isLoading, error } = useQuery<CustomResourceType[]>({
    queryKey: ['customResourceTypes'],
    queryFn: () => clusterAPI.getCustomResourceTypes(true, true),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const filteredResourceTypes = useMemo(() => {
    return resourceTypes.filter(rt => {
      const search = searchValue.toLowerCase();
      const matchesSearch = !search ||
        rt.resourceTypeName.toLowerCase().includes(search) ||
        (rt.source?.kind || '').toLowerCase().includes(search);
      const matchesScope = scopeFilter === 'all' || rt.source?.scope === scopeFilter;
      return matchesSearch && matchesScope;
    });
  }, [resourceTypes, searchValue, scopeFilter]);

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clusterpulse-dashboard-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text);
        if (config.tiles && Array.isArray(config.tiles)) {
          importConfig(config);
        }
      } catch (err) {
        console.error('Failed to import config:', err);
      }
    };
    input.click();
  };

  const handleReorder = (newOrder: MetricTileConfig[]) => {
    reorderTiles(newOrder.map(t => t.id));
  };

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Configure Dashboard Metrics"
    >
      <ModalHeader
        title="Configure Dashboard Metrics"
        description="Browse available metric sources and add them to your cluster cards"
      />
      <ModalBody>
        {/* Metric Source Catalog */}
        <div className="pf-v6-u-mb-lg">
          <strong className="pf-v6-u-mb-sm" style={{ display: 'block' }}>Metric Source Catalog</strong>

          <Flex
            spaceItems={{ default: 'spaceItemsMd' }}
            alignItems={{ default: 'alignItemsCenter' }}
            className="pf-v6-u-mb-md"
          >
            <FlexItem flex={{ default: 'flex_1' }}>
              <SearchInput
                aria-label="Search metric sources"
                placeholder="Search by name or kind..."
                value={searchValue}
                onChange={(_, value) => setSearchValue(value)}
                onClear={() => setSearchValue('')}
              />
            </FlexItem>
            <FlexItem>
              <ToggleGroup aria-label="Scope filter">
                <ToggleGroupItem
                  text="All"
                  isSelected={scopeFilter === 'all'}
                  onChange={() => setScopeFilter('all')}
                />
                <ToggleGroupItem
                  text="Namespaced"
                  isSelected={scopeFilter === 'Namespaced'}
                  onChange={() => setScopeFilter('Namespaced')}
                />
                <ToggleGroupItem
                  text="Cluster"
                  isSelected={scopeFilter === 'Cluster'}
                  onChange={() => setScopeFilter('Cluster')}
                />
              </ToggleGroup>
            </FlexItem>
          </Flex>

          {isLoading ? (
            <Bullseye>
              <Spinner size="lg" />
            </Bullseye>
          ) : error ? (
            <Alert variant="danger" title="Failed to load resource types" isInline>
              Unable to fetch available custom resource types.
            </Alert>
          ) : filteredResourceTypes.length === 0 ? (
            <EmptyState
              titleText={resourceTypes.length === 0 ? 'No metric sources available' : 'No matches'}
              headingLevel="h4"
              icon={CubesIcon}
            >
              <EmptyStateBody>
                {resourceTypes.length === 0
                  ? 'No custom resource types are configured or accessible.'
                  : 'Try adjusting your search or filter.'}
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <Gallery hasGutter minWidths={{ default: '100%', md: '280px' }} maxWidths={{ md: '1fr' }}>
              {filteredResourceTypes.map(rt => (
                <GalleryItem key={rt.resourceTypeName}>
                  <MetricCatalogCard resourceType={rt} />
                </GalleryItem>
              ))}
            </Gallery>
          )}
        </div>

        {/* Configured Metrics */}
        {globalConfig.tiles.length > 0 && (
          <>
            <Divider className="pf-v6-u-mb-md" />
            <div className="pf-v6-u-mb-md">
              <Flex
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                alignItems={{ default: 'alignItemsCenter' }}
                className="pf-v6-u-mb-sm"
              >
                <FlexItem>
                  <strong>Configured Metrics ({globalConfig.tiles.length})</strong>
                </FlexItem>
                <FlexItem>
                  <ActionList>
                    <ActionListItem>
                      <Tooltip content="Export configuration">
                        <Button variant="plain" onClick={handleExport} icon={<DownloadIcon />}>
                          Export
                        </Button>
                      </Tooltip>
                    </ActionListItem>
                    <ActionListItem>
                      <Tooltip content="Import configuration">
                        <Button variant="plain" onClick={handleImport} icon={<UploadIcon />}>
                          Import
                        </Button>
                      </Tooltip>
                    </ActionListItem>
                    <ActionListItem>
                      <Tooltip content="Reset to defaults">
                        <Button variant="plain" onClick={resetConfig} icon={<UndoIcon />}>
                          Reset
                        </Button>
                      </Tooltip>
                    </ActionListItem>
                  </ActionList>
                </FlexItem>
              </Flex>

              <Reorder.Group
                axis="y"
                values={globalConfig.tiles}
                onReorder={handleReorder}
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                <AnimatePresence>
                  {globalConfig.tiles.map((tile) => (
                    <Reorder.Item
                      key={tile.id}
                      value={tile}
                      style={{ marginBottom: '8px' }}
                    >
                      <Card isCompact>
                        <CardBody style={{ padding: '12px 16px' }}>
                          <Flex alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <GripVerticalIcon
                                style={{
                                  cursor: 'grab',
                                  color: 'var(--pf-t--global--text--color--subtle)'
                                }}
                              />
                            </FlexItem>
                            <FlexItem flex={{ default: 'flex_1' }}>
                              <div>
                                <strong>{tile.displayName}</strong>
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--pf-t--global--text--color--subtle)'
                                }}>
                                  {tile.resourceTypeName}
                                  {tile.aggregation && ` \u2022 ${tile.aggregation}`}
                                </div>
                              </div>
                            </FlexItem>
                            <FlexItem>
                              <LabelGroup>
                                <Label isCompact color={tile.color as any}>
                                  {tile.displayType}
                                </Label>
                              </LabelGroup>
                            </FlexItem>
                            <FlexItem>
                              <Button
                                variant="plain"
                                icon={<TrashIcon />}
                                onClick={() => removeTile(tile.id)}
                                aria-label="Remove metric"
                              />
                            </FlexItem>
                          </Flex>
                        </CardBody>
                      </Card>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </div>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button key="done" variant="primary" onClick={onClose}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
};
