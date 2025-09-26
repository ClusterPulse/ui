/**
 * TypeScript Type Definitions
 */

export enum ClusterStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
  UNKNOWN = 'unknown',
}

export enum OperatorHealth {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  ERROR = 'error',
  NOT_INSTALLED = 'not_installed',
  PROGRESSING = 'progressing',
  UNKNOWN = 'unknown',
}

export interface ClusterHealth {
  status: ClusterStatus;
  last_check: string;
  response_time_ms?: number;
  error_message?: string;
}

export interface NodeInfo {
  name: string;
  status: string;
  role: string;
  version: string;
  capacity: Record<string, any>;
  allocatable: Record<string, any>;
}

export interface ClusterInfo {
  name: string;
  api_url: string;
  version?: string;
  platform?: string;
  node_count: number;
  namespace_count: number;
}

export interface Cluster {
  info: ClusterInfo;
  health: ClusterHealth;
  nodes?: NodeInfo[];
  metrics?: Record<string, any>;
}

export interface ClusterListResponse {
  clusters: Cluster[];
  total: number;
  timestamp: string;
}

export interface ServiceStatus {
  name: string;
  namespace: string;
  status: string;
  ready_replicas: number;
  total_replicas: number;
  conditions: Array<Record<string, any>>;
}

export interface ClusterServices {
  cluster_name: string;
  services: ServiceStatus[];
  timestamp: string;
}

export interface ClusterConfig {
  name: string;
  api_url: string;
  token: string;
  verify_ssl: boolean;
}

export interface ClusterConfigResponse {
  name: string;
  message: string;
  success: boolean;
}

export interface OperatorStatus {
  operator_key: string;
  name: string;
  short_name: string;
  namespace: string;
  category: string;
  icon: string;
  status: string;
  health: OperatorHealth;
  installed_version?: string;
  details: Record<string, any>;
}

export interface ClusterOperators {
  cluster_name: string;
  operators: OperatorStatus[];
  total: number;
  healthy: number;
  degraded: number;
  not_installed: number;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

/**
 * Enhanced Node Type Definitions
 * Add these to your types/index.ts file
 */

export interface NodeCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  message?: string;
  reason?: string;
  lastTransitionTime?: string;
  lastHeartbeatTime?: string;
}

export interface NodeAddress {
  type: 'InternalIP' | 'ExternalIP' | 'Hostname' | 'InternalDNS' | 'ExternalDNS';
  address: string;
}

export interface NodeSystemInfo {
  machineID?: string;
  systemUUID?: string;
  bootID?: string;
  kernelVersion?: string;
  osImage?: string;
  containerRuntimeVersion?: string;
  kubeletVersion?: string;
  kubeProxyVersion?: string;
  operatingSystem?: string;
  architecture?: string;
}

export interface NodeResources {
  cpu_capacity: number;
  cpu_allocatable: number;
  cpu_requested?: number;
  cpu_limits?: number;
  memory_capacity: number;
  memory_allocatable: number;
  memory_requested?: number;
  memory_limits?: number;
  storage_capacity?: number;
  storage_allocatable?: number;
  pods_capacity: number;
  pods_running: number;
  pods_pending?: number;
  pods_failed?: number;
  pods_succeeded?: number;
  ephemeral_storage_capacity?: number;
  ephemeral_storage_allocatable?: number;
  hugepages_capacity?: Record<string, number>;
  hugepages_allocatable?: Record<string, number>;
}

export interface NodeTaint {
  key: string;
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
  timeAdded?: string;
}

export interface NodeMetrics {
  timestamp: string;
  cpu_usage_cores?: number;
  cpu_usage_percent?: number;
  memory_usage_bytes?: number;
  memory_usage_percent?: number;
  network_rx_bytes?: number;
  network_tx_bytes?: number;
  fs_usage_bytes?: number;
  fs_usage_percent?: number;
}

export interface EnhancedNodeInfo extends NodeInfo {
  // Basic identification
  name: string;
  uid?: string;
  resourceVersion?: string;
  generation?: number;

  // Status and state
  status: 'Ready' | 'NotReady' | 'SchedulingDisabled' | 'Unknown';
  unschedulable?: boolean;
  phase?: string;

  // Roles and labels
  roles: string[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;

  // Versioning
  kubelet_version?: string;
  kube_proxy_version?: string;
  kernel_version?: string;
  os_image?: string;
  container_runtime?: string;
  container_runtime_version?: string;

  // System information
  architecture?: string;
  operating_system?: string;
  machine_id?: string;
  system_uuid?: string;
  boot_id?: string;

  // Resources
  cpu_capacity: number;
  cpu_allocatable: number;
  memory_capacity: number;
  memory_allocatable: number;
  pods_capacity: number;
  pods_running: number;
  storage_capacity?: number;
  storage_allocatable?: number;

  // Network
  pod_cidr?: string;
  pod_cidrs?: string[];
  provider_id?: string;
  addresses?: NodeAddress[];

  // Conditions
  conditions?: NodeCondition[];

  // Taints
  taints?: NodeTaint[];

  // Timestamps
  creation_timestamp?: string;
  last_heartbeat?: string;
  last_transition?: string;

  // Metrics (if available)
  current_metrics?: NodeMetrics;
  metrics_history?: NodeMetrics[];

  // Additional metadata
  node_info?: NodeSystemInfo;
  images?: Array<{
    names: string[];
    sizeBytes: number;
  }>;
  volumes_in_use?: string[];
  volumes_attached?: Array<{
    name: string;
    devicePath: string;
  }>;
}

export interface NodeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: {
    name: string;
    displayName?: string;
    version?: string;
    platform?: string;
  } | null;
}

export interface NodeFilterState {
  searchValue: string;
  statusFilter: 'all' | 'Ready' | 'NotReady' | 'SchedulingDisabled' | 'Unknown';
  roleFilter: 'all' | string;
  sortBy: 'name' | 'status' | 'cpu' | 'memory' | 'pods' | 'age';
  sortOrder: 'asc' | 'desc';
}

export interface NodeSummaryStats {
  total: number;
  ready: number;
  notReady: number;
  schedulingDisabled: number;
  unknown: number;
  totalCpu: number;
  totalMemory: number;
  totalPods: number;
  runningPods: number;
  roleDistribution: Record<string, number>;
}

// Node Health Score calculation
export interface NodeHealthScore {
  overall: number; // 0-100
  factors: {
    status: number;
    cpuPressure: number;
    memoryPressure: number;
    diskPressure: number;
    pidPressure: number;
    networkAvailability: number;
    podCapacity: number;
  };
  recommendation?: 'healthy' | 'monitor' | 'investigate' | 'critical';
}

// For API responses
export interface NodeListResponse {
  nodes: EnhancedNodeInfo[];
  total: number;
  filtered?: number;
  summary?: NodeSummaryStats;
  timestamp: string;
}

export interface NodeDetailsResponse extends EnhancedNodeInfo {
  health_score?: NodeHealthScore;
  related_pods?: Array<{
    name: string;
    namespace: string;
    status: string;
    cpu_usage?: number;
    memory_usage?: number;
  }>;
  recent_events?: Array<{
    type: string;
    reason: string;
    message: string;
    timestamp: string;
    count?: number;
  }>;
}
