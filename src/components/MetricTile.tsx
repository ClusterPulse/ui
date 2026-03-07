/**
 * MetricTile Component
 * Displays a custom resource metric with configurable visualization types
 */
import React from 'react';
import {
  Tooltip,
  Progress,
  ProgressSize,
  ProgressMeasureLocation,
} from '@patternfly/react-core';
import {
  TrendUpIcon,
  TrendDownIcon,
  EqualsIcon,
  OutlinedQuestionCircleIcon,
} from '@patternfly/react-icons';
import { motion } from 'framer-motion';
import type { TileDisplayType, MetricTileConfig } from '../stores/dashboardConfigStore';

interface MetricTileProps {
  config: MetricTileConfig;
  value: number | string | null;
  maxValue?: number;
  previousValue?: number;
  onClick?: () => void;
  isLoading?: boolean;
}

const tileColors: Record<string, { bg: string; text: string; progress: string }> = {
  blue: {
    bg: 'color-mix(in srgb, var(--pf-t--global--color--brand--default) 12%, transparent)',
    text: 'var(--pf-t--global--color--brand--default)',
    progress: 'var(--pf-t--global--color--brand--default)',
  },
  green: {
    bg: 'color-mix(in srgb, var(--pf-t--global--color--status--success--default) 12%, transparent)',
    text: 'var(--pf-t--global--color--status--success--default)',
    progress: 'var(--pf-t--global--color--status--success--default)',
  },
  orange: {
    bg: 'color-mix(in srgb, var(--pf-t--global--color--status--warning--default) 12%, transparent)',
    text: 'var(--pf-t--global--color--status--warning--default)',
    progress: 'var(--pf-t--global--color--status--warning--default)',
  },
  red: {
    bg: 'color-mix(in srgb, var(--pf-t--global--color--status--danger--default) 12%, transparent)',
    text: 'var(--pf-t--global--color--status--danger--default)',
    progress: 'var(--pf-t--global--color--status--danger--default)',
  },
  purple: {
    bg: 'color-mix(in srgb, #7559dc 12%, transparent)',
    text: '#7559dc',
    progress: '#7559dc',
  },
  cyan: {
    bg: 'color-mix(in srgb, #009596 12%, transparent)',
    text: '#009596',
    progress: '#009596',
  },
  teal: {
    bg: 'color-mix(in srgb, #008080 12%, transparent)',
    text: '#008080',
    progress: '#008080',
  },
  grey: {
    bg: 'var(--pf-t--global--background--color--secondary--default)',
    text: 'var(--pf-t--global--text--color--subtle)',
    progress: 'var(--pf-t--global--text--color--subtle)',
  },
};

const formatValue = (value: number | string | null, displayType: TileDisplayType): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  
  if (displayType === 'percentage') {
    return `${Math.round(value)}%`;
  }
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toLocaleString();
};

const getTrend = (current: number, previous: number): 'up' | 'down' | 'same' => {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'same';
};

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'same'; color: string }> = ({ trend, color }) => {
  const iconStyle = { fontSize: '0.625rem', marginLeft: '4px' };
  
  switch (trend) {
    case 'up':
      return <TrendUpIcon style={{ ...iconStyle, color: 'var(--pf-t--global--color--status--success--default)' }} />;
    case 'down':
      return <TrendDownIcon style={{ ...iconStyle, color: 'var(--pf-t--global--color--status--danger--default)' }} />;
    default:
      return <EqualsIcon style={{ ...iconStyle, color }} />;
  }
};

export const MetricTile: React.FC<MetricTileProps> = ({
  config,
  value,
  maxValue = 100,
  previousValue,
  onClick,
  isLoading = false,
}) => {
  const colorScheme = tileColors[config.color || 'blue'] || tileColors.blue;
  const numericValue = typeof value === 'number' ? value : 0;
  const percentage = maxValue > 0 ? Math.min((numericValue / maxValue) * 100, 100) : 0;
  
  const trend = previousValue !== undefined && typeof value === 'number'
    ? getTrend(value, previousValue)
    : undefined;

  const renderContent = () => {
    switch (config.displayType) {
      case 'bar':
      case 'percentage':
        return (
          <div style={{ width: '100%' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ 
                fontSize: '0.625rem', 
                textTransform: 'uppercase', 
                color: 'var(--pf-t--global--text--color--subtle)',
                fontWeight: 600,
                letterSpacing: '0.3px'
              }}>
                {config.displayName}
              </span>
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: 700,
                color: colorScheme.text,
                display: 'flex',
                alignItems: 'center'
              }}>
                {isLoading ? '...' : formatValue(value, config.displayType)}
                {trend && <TrendIndicator trend={trend} color={colorScheme.text} />}
              </span>
            </div>
            <Progress
              value={percentage}
              size={ProgressSize.sm}
              measureLocation={ProgressMeasureLocation.none}
              style={{
                '--pf-v6-c-progress__bar--BackgroundColor': colorScheme.progress,
              } as React.CSSProperties}
            />
            {maxValue !== 100 && (
              <div style={{ 
                fontSize: '0.625rem', 
                color: 'var(--pf-t--global--text--color--subtle)',
                marginTop: '2px'
              }}>
                of {formatValue(maxValue, 'count')}
              </div>
            )}
          </div>
        );

      case 'sparkline':
        // Simplified sparkline - could be enhanced with actual historical data
        return (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ 
              fontSize: '0.625rem', 
              textTransform: 'uppercase', 
              color: 'var(--pf-t--global--text--color--subtle)',
              marginBottom: '4px',
              fontWeight: 600
            }}>
              {config.displayName}
            </div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700,
              color: colorScheme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isLoading ? '...' : formatValue(value, 'count')}
              {trend && <TrendIndicator trend={trend} color={colorScheme.text} />}
            </div>
          </div>
        );

      case 'status':
        const statusColor = numericValue > 0 
          ? 'var(--pf-t--global--color--status--success--default)'
          : 'var(--pf-t--global--color--status--danger--default)';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }} />
            <div>
              <div style={{ 
                fontSize: '0.625rem', 
                textTransform: 'uppercase', 
                color: 'var(--pf-t--global--text--color--subtle)',
                fontWeight: 600
              }}>
                {config.displayName}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600,
                color: 'var(--pf-t--global--text--color--regular)'
              }}>
                {isLoading ? '...' : formatValue(value, 'count')}
              </div>
            </div>
          </div>
        );

      case 'count':
      default:
        return (
          <div style={{ textAlign: 'center', minWidth: '60px' }}>
            <div style={{ 
              fontSize: '0.625rem', 
              textTransform: 'uppercase', 
              color: 'var(--pf-t--global--text--color--subtle)',
              marginBottom: '4px',
              fontWeight: 600,
              letterSpacing: '0.3px'
            }}>
              {config.displayName}
            </div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: 700,
              color: colorScheme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isLoading ? '...' : formatValue(value, 'count')}
              {trend && <TrendIndicator trend={trend} color={colorScheme.text} />}
            </div>
            {config.aggregation && (
              <div style={{ 
                fontSize: '0.5625rem', 
                color: 'var(--pf-t--global--text--color--subtle)',
                marginTop: '2px'
              }}>
                {config.aggregation}
              </div>
            )}
          </div>
        );
    }
  };

  const tooltipContent = config.aggregation 
    ? `${config.displayName} (${config.aggregation})`
    : `${config.displayName} - Click for details`;

  return (
    <Tooltip content={tooltipContent}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: colorScheme.bg,
          padding: '8px 12px',
          borderRadius: 'var(--pf-t--global--border--radius--small)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'box-shadow 0.2s',
          minWidth: config.displayType === 'bar' || config.displayType === 'percentage' ? '120px' : '70px',
        }}
        onClick={onClick}
      >
        {renderContent()}
      </motion.div>
    </Tooltip>
  );
};

// Empty state tile for when no metrics are configured
export const EmptyMetricTile: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Tooltip content="Click to add metrics">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'var(--pf-t--global--background--color--secondary--default)',
          border: '2px dashed var(--pf-t--global--border--color--default)',
          padding: '12px 16px',
          borderRadius: 'var(--pf-t--global--border--radius--small)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: '60px',
        }}
        onClick={onClick}
      >
        <OutlinedQuestionCircleIcon style={{ 
          fontSize: '1rem',
          color: 'var(--pf-t--global--text--color--subtle)'
        }} />
        <span style={{ 
          fontSize: '0.75rem',
          color: 'var(--pf-t--global--text--color--subtle)'
        }}>
          Add Metrics
        </span>
      </motion.div>
    </Tooltip>
  );
};
