/**
 * Custom Resource Types
 */

export interface CustomResourceType {
  resourceTypeName: string;
  sourceId: string;
  source?: {
    apiVersion: string;
    kind: string;
    scope: 'Namespaced' | 'Cluster';
  };
  fields?: string[];
  computedFields?: string[];
  aggregations?: string[];
  clustersWithData?: string[];
}

export interface ClusterResourceCount {
  cluster: string;
  resourceTypeName: string;
  count: number;
  aggregations?: Record<string, number | string | Record<string, number>>;
  lastCollection?: string;
}

export interface CustomResourceItem {
  _id: string;
  _name: string;
  _namespace?: string;
  values: Record<string, any>;
  [key: string]: any;
}

export interface CustomResourcesResponse {
  resourceTypeName: string;
  cluster: string;
  collectedAt?: string;
  truncated?: boolean;
  items: CustomResourceItem[];
  filtered: boolean;
  filterNote?: string;
  aggregations?: Record<string, any>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AggregationOption {
  name: string;
  label: string;
  type: 'number' | 'percentage' | 'grouped';
}
