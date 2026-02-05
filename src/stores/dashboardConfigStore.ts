/**
 * Dashboard Configuration Store
 * Persists user's custom metric tile configurations to localStorage
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TileDisplayType = 'count' | 'percentage' | 'bar' | 'sparkline' | 'status';

export interface MetricTileConfig {
  id: string;
  resourceTypeName: string;
  displayName: string;
  aggregation?: string; // null means show total count
  displayType: TileDisplayType;
  color?: string;
  order: number;
}

export interface ClusterDashboardConfig {
  tiles: MetricTileConfig[];
}

interface DashboardConfigState {
  // Global config that applies to all clusters
  globalConfig: ClusterDashboardConfig;
  
  // Actions
  addTile: (tile: Omit<MetricTileConfig, 'id' | 'order'>) => void;
  removeTile: (tileId: string) => void;
  updateTile: (tileId: string, updates: Partial<MetricTileConfig>) => void;
  reorderTiles: (tileIds: string[]) => void;
  resetConfig: () => void;
  importConfig: (config: ClusterDashboardConfig) => void;
  exportConfig: () => ClusterDashboardConfig;
}

const generateId = () => `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const defaultConfig: ClusterDashboardConfig = {
  tiles: [],
};

export const useDashboardConfigStore = create<DashboardConfigState>()(
  persist(
    (set, get) => ({
      globalConfig: defaultConfig,

      addTile: (tile) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            tiles: [
              ...state.globalConfig.tiles,
              {
                ...tile,
                id: generateId(),
                order: state.globalConfig.tiles.length,
              },
            ],
          },
        }));
      },

      removeTile: (tileId) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            tiles: state.globalConfig.tiles
              .filter((t) => t.id !== tileId)
              .map((t, idx) => ({ ...t, order: idx })),
          },
        }));
      },

      updateTile: (tileId, updates) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            tiles: state.globalConfig.tiles.map((t) =>
              t.id === tileId ? { ...t, ...updates } : t
            ),
          },
        }));
      },

      reorderTiles: (tileIds) => {
        set((state) => {
          const tileMap = new Map(state.globalConfig.tiles.map((t) => [t.id, t]));
          const reordered = tileIds
            .map((id, idx) => {
              const tile = tileMap.get(id);
              return tile ? { ...tile, order: idx } : null;
            })
            .filter((t): t is MetricTileConfig => t !== null);

          return {
            globalConfig: {
              ...state.globalConfig,
              tiles: reordered,
            },
          };
        });
      },

      resetConfig: () => {
        set({ globalConfig: defaultConfig });
      },

      importConfig: (config) => {
        set({ globalConfig: config });
      },

      exportConfig: () => {
        return get().globalConfig;
      },
    }),
    {
      name: 'clusterpulse-dashboard-config',
      version: 1,
    }
  )
);
