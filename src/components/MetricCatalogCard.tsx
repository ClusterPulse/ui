/**
 * MetricCatalogCard Component
 * Browsable card for discovering and adding custom resource metric types
 * Supports adding multiple tiles per resource type (different aggregations)
 */
import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Label,
  LabelGroup,
  Badge,
  Button,
  FormSelect,
  FormSelectOption,
  TextInput,
  Flex,
  FlexItem,
  FormGroup,
  Form,
} from '@patternfly/react-core';
import {
  PlusCircleIcon,
} from '@patternfly/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardConfigStore, type TileDisplayType } from '../stores/dashboardConfigStore';
import { displayTypeOptions, colorOptions } from './DashboardConfigPanel';
import type { CustomResourceType } from '../types/customResources';

interface MetricCatalogCardProps {
  resourceType: CustomResourceType;
}

const toDisplayName = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const MetricCatalogCard: React.FC<MetricCatalogCardProps> = ({ resourceType }) => {
  const { addTile, getResourceTypeTileCount } = useDashboardConfigStore();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [aggregation, setAggregation] = useState('');
  const [displayType, setDisplayType] = useState<TileDisplayType>('count');
  const [color, setColor] = useState('blue');

  const tileCount = getResourceTypeTileCount(resourceType.resourceTypeName);
  const clusterCount = resourceType.clustersWithData?.length ?? 0;

  const aggregationOptions = useMemo(() => [
    { value: '', label: 'Total Count' },
    ...(resourceType.aggregations || []).map(agg => ({
      value: agg,
      label: toDisplayName(agg),
    })),
  ], [resourceType.aggregations]);

  const handleAddClick = () => {
    setDisplayName(toDisplayName(resourceType.resourceTypeName));
    setAggregation('');
    setDisplayType('count');
    setColor('blue');
    setIsConfigOpen(true);
  };

  const handleConfirm = () => {
    addTile({
      resourceTypeName: resourceType.resourceTypeName,
      displayName: displayName || toDisplayName(resourceType.resourceTypeName),
      aggregation: aggregation || undefined,
      displayType,
      color,
    });
    setIsConfigOpen(false);
  };

  const handleCancel = () => {
    setIsConfigOpen(false);
  };

  return (
    <Card
      isCompact
      className={`metric-catalog-card${tileCount > 0 ? ' metric-catalog-card--added' : ''}`}
    >
      <CardHeader>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsFlexStart' }}
        >
          <FlexItem>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px' }}>
              {toDisplayName(resourceType.resourceTypeName)}
            </div>
            <Flex spaceItems={{ default: 'spaceItemsXs' }}>
              <FlexItem>
                <Label isCompact color="blue">
                  {resourceType.source?.kind || 'Unknown'}
                </Label>
              </FlexItem>
              <FlexItem>
                <Label isCompact color={resourceType.source?.scope === 'Cluster' ? 'purple' : 'teal'}>
                  {resourceType.source?.scope || 'Unknown'}
                </Label>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            {!isConfigOpen && (
              <Button variant="link" icon={<PlusCircleIcon />} onClick={handleAddClick}>
                {tileCount > 0 ? 'Add Another' : 'Add'}
              </Button>
            )}
          </FlexItem>
        </Flex>
      </CardHeader>

      <CardBody style={{ paddingTop: 0 }}>
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          {clusterCount > 0 && (
            <FlexItem>
              <Badge isRead>Available in {clusterCount} cluster{clusterCount !== 1 ? 's' : ''}</Badge>
            </FlexItem>
          )}
          {tileCount > 0 && (
            <FlexItem>
              <Badge>{tileCount} configured</Badge>
            </FlexItem>
          )}
        </Flex>

        {resourceType.aggregations && resourceType.aggregations.length > 0 && (
          <LabelGroup className="pf-v6-u-mt-sm" numLabels={4}>
            {resourceType.aggregations.map(agg => (
              <Label key={agg} isCompact variant="outline">
                {toDisplayName(agg)}
              </Label>
            ))}
          </LabelGroup>
        )}

        <AnimatePresence>
          {isConfigOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <Form className="pf-v6-u-mt-md">
                <FormGroup label="Display Name" fieldId={`dn-${resourceType.resourceTypeName}`}>
                  <TextInput
                    id={`dn-${resourceType.resourceTypeName}`}
                    value={displayName}
                    onChange={(_, v) => setDisplayName(v)}
                  />
                </FormGroup>

                <FormGroup label="Aggregation" fieldId={`agg-${resourceType.resourceTypeName}`}>
                  <FormSelect
                    id={`agg-${resourceType.resourceTypeName}`}
                    value={aggregation}
                    onChange={(_, v) => setAggregation(v)}
                  >
                    {aggregationOptions.map(opt => (
                      <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
                    ))}
                  </FormSelect>
                </FormGroup>

                <Flex>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup label="Display Type" fieldId={`dt-${resourceType.resourceTypeName}`}>
                      <FormSelect
                        id={`dt-${resourceType.resourceTypeName}`}
                        value={displayType}
                        onChange={(_, v) => setDisplayType(v as TileDisplayType)}
                      >
                        {displayTypeOptions.map(opt => (
                          <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
                        ))}
                      </FormSelect>
                    </FormGroup>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup label="Color" fieldId={`clr-${resourceType.resourceTypeName}`}>
                      <FormSelect
                        id={`clr-${resourceType.resourceTypeName}`}
                        value={color}
                        onChange={(_, v) => setColor(v)}
                      >
                        {colorOptions.map(opt => (
                          <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
                        ))}
                      </FormSelect>
                    </FormGroup>
                  </FlexItem>
                </Flex>

                <Flex className="pf-v6-u-mt-sm">
                  <FlexItem>
                    <Button variant="primary" size="sm" onClick={handleConfirm}>
                      Confirm
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="link" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </FlexItem>
                </Flex>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </CardBody>
    </Card>
  );
};
