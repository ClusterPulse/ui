/**
 * DashboardConfigPanel Component
 * Panel for configuring which custom resource metrics to display
 */
import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput,
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
  Divider,
  ActionList,
  ActionListItem,
  Tooltip,
} from '@patternfly/react-core';
import {
  PlusCircleIcon,
  TrashIcon,
  CubesIcon,
  GripVerticalIcon,
  DownloadIcon,
  UploadIcon,
  UndoIcon,
} from '@patternfly/react-icons';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { clusterAPI } from '../services/api';
import { 
  useDashboardConfigStore, 
  type MetricTileConfig, 
  type TileDisplayType 
} from '../stores/dashboardConfigStore';
import type { CustomResourceType } from '../types/customResources';

interface DashboardConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const displayTypeOptions: { value: TileDisplayType; label: string; description: string }[] = [
  { value: 'count', label: 'Count', description: 'Simple numeric display' },
  { value: 'bar', label: 'Progress Bar', description: 'Bar with progress indicator' },
  { value: 'percentage', label: 'Percentage', description: 'Percentage with bar' },
  { value: 'status', label: 'Status Indicator', description: 'Colored status dot' },
  { value: 'sparkline', label: 'Sparkline', description: 'Compact with trend' },
];

const colorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'teal', label: 'Teal' },
  { value: 'grey', label: 'Grey' },
];

interface NewTileFormData {
  resourceTypeName: string;
  displayName: string;
  aggregation: string;
  displayType: TileDisplayType;
  color: string;
}

const defaultFormData: NewTileFormData = {
  resourceTypeName: '',
  displayName: '',
  aggregation: '',
  displayType: 'count',
  color: 'blue',
};

export const DashboardConfigPanel: React.FC<DashboardConfigPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { globalConfig, addTile, removeTile, reorderTiles, resetConfig, importConfig, exportConfig } = useDashboardConfigStore();
  const [formData, setFormData] = useState<NewTileFormData>(defaultFormData);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch available custom resource types
  const { data: resourceTypes = [], isLoading, error } = useQuery<CustomResourceType[]>({
    queryKey: ['customResourceTypes'],
    queryFn: () => clusterAPI.getCustomResourceTypes(true, true),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Get aggregations for selected resource type
  const selectedResourceType = useMemo(() => {
    return resourceTypes.find(rt => rt.resourceTypeName === formData.resourceTypeName);
  }, [resourceTypes, formData.resourceTypeName]);

  const availableAggregations = useMemo(() => {
    if (!selectedResourceType) return [];
    return [
      { value: '', label: 'Total Count' },
      ...(selectedResourceType.aggregations || []).map(agg => ({
        value: agg,
        label: agg.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      })),
    ];
  }, [selectedResourceType]);

  const handleResourceTypeChange = (value: string) => {
    const rt = resourceTypes.find(r => r.resourceTypeName === value);
    setFormData({
      ...formData,
      resourceTypeName: value,
      displayName: rt?.resourceTypeName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '',
      aggregation: '',
    });
  };

  const handleAddTile = () => {
    if (!formData.resourceTypeName) return;
    
    addTile({
      resourceTypeName: formData.resourceTypeName,
      displayName: formData.displayName || formData.resourceTypeName,
      aggregation: formData.aggregation || undefined,
      displayType: formData.displayType,
      color: formData.color,
    });
    
    setFormData(defaultFormData);
    setShowAddForm(false);
  };

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
        description="Add and arrange custom resource metrics for your cluster cards"
      />
      <ModalBody>
        {/* Action buttons */}
        <Flex justifyContent={{ default: 'justifyContentFlexEnd' }} className="pf-v6-u-mb-md">
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

        {/* Current tiles */}
        <div className="pf-v6-u-mb-lg">
          <Flex alignItems={{ default: 'alignItemsCenter' }} className="pf-v6-u-mb-sm">
            <FlexItem>
              <strong>Configured Metrics ({globalConfig.tiles.length})</strong>
            </FlexItem>
            <FlexItem>
              <Button
                variant="link"
                icon={<PlusCircleIcon />}
                onClick={() => setShowAddForm(true)}
                isDisabled={showAddForm}
              >
                Add Metric
              </Button>
            </FlexItem>
          </Flex>

          {globalConfig.tiles.length === 0 && !showAddForm ? (
            <EmptyState
              titleText="No metrics configured"
              headingLevel="h4"
              icon={CubesIcon}
            >
              <EmptyStateBody>
                Add custom resource metrics to display on your cluster cards.
              </EmptyStateBody>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Metric
              </Button>
            </EmptyState>
          ) : (
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
                                {tile.aggregation && ` • ${tile.aggregation}`}
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
          )}
        </div>

        {/* Add new tile form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Divider className="pf-v6-u-mb-md" />
              <Card>
                <CardBody>
                  <Form>
                    {isLoading ? (
                      <Bullseye>
                        <Spinner size="lg" />
                      </Bullseye>
                    ) : error ? (
                      <Alert variant="danger" title="Failed to load resource types" isInline>
                        Unable to fetch available custom resource types.
                      </Alert>
                    ) : resourceTypes.length === 0 ? (
                      <Alert variant="info" title="No custom resource types available" isInline>
                        No custom resource types are configured or accessible.
                      </Alert>
                    ) : (
                      <>
                        <FormGroup label="Resource Type" isRequired fieldId="resource-type">
                          <FormSelect
                            id="resource-type"
                            value={formData.resourceTypeName}
                            onChange={(_, value) => handleResourceTypeChange(value)}
                          >
                            <FormSelectOption value="" label="Select a resource type..." />
                            {resourceTypes.map((rt) => (
                              <FormSelectOption
                                key={rt.resourceTypeName}
                                value={rt.resourceTypeName}
                                label={`${rt.resourceTypeName} (${rt.source?.kind || 'Unknown'})`}
                              />
                            ))}
                          </FormSelect>
                        </FormGroup>

                        {formData.resourceTypeName && (
                          <>
                            <FormGroup label="Display Name" fieldId="display-name">
                              <TextInput
                                id="display-name"
                                value={formData.displayName}
                                onChange={(_, value) => setFormData({ ...formData, displayName: value })}
                                placeholder="Friendly name for display"
                              />
                            </FormGroup>

                            <FormGroup label="Metric" fieldId="aggregation">
                              <FormSelect
                                id="aggregation"
                                value={formData.aggregation}
                                onChange={(_, value) => setFormData({ ...formData, aggregation: value })}
                              >
                                {availableAggregations.map((agg) => (
                                  <FormSelectOption
                                    key={agg.value}
                                    value={agg.value}
                                    label={agg.label}
                                  />
                                ))}
                              </FormSelect>
                            </FormGroup>

                            <Flex>
                              <FlexItem flex={{ default: 'flex_1' }}>
                                <FormGroup label="Display Type" fieldId="display-type">
                                  <FormSelect
                                    id="display-type"
                                    value={formData.displayType}
                                    onChange={(_, value) => setFormData({ ...formData, displayType: value as TileDisplayType })}
                                  >
                                    {displayTypeOptions.map((opt) => (
                                      <FormSelectOption
                                        key={opt.value}
                                        value={opt.value}
                                        label={`${opt.label} - ${opt.description}`}
                                      />
                                    ))}
                                  </FormSelect>
                                </FormGroup>
                              </FlexItem>
                              <FlexItem flex={{ default: 'flex_1' }}>
                                <FormGroup label="Color" fieldId="color">
                                  <FormSelect
                                    id="color"
                                    value={formData.color}
                                    onChange={(_, value) => setFormData({ ...formData, color: value })}
                                  >
                                    {colorOptions.map((opt) => (
                                      <FormSelectOption
                                        key={opt.value}
                                        value={opt.value}
                                        label={opt.label}
                                      />
                                    ))}
                                  </FormSelect>
                                </FormGroup>
                              </FlexItem>
                            </Flex>

                            {selectedResourceType?.clustersWithData && (
                              <FormGroup label="Available in clusters" fieldId="clusters">
                                <LabelGroup>
                                  {selectedResourceType.clustersWithData.map((cluster) => (
                                    <Label key={cluster} isCompact>
                                      {cluster}
                                    </Label>
                                  ))}
                                </LabelGroup>
                              </FormGroup>
                            )}
                          </>
                        )}

                        <Flex className="pf-v6-u-mt-md">
                          <FlexItem>
                            <Button
                              variant="primary"
                              onClick={handleAddTile}
                              isDisabled={!formData.resourceTypeName}
                            >
                              Add Metric
                            </Button>
                          </FlexItem>
                          <FlexItem>
                            <Button
                              variant="link"
                              onClick={() => {
                                setFormData(defaultFormData);
                                setShowAddForm(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </FlexItem>
                        </Flex>
                      </>
                    )}
                  </Form>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalBody>
      <ModalFooter>
        <Button key="done" variant="primary" onClick={onClose}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  );
};
