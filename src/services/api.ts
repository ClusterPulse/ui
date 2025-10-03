/**
 * API Service
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for OAuth proxy cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Check if getting anonymous access (unauth mode)
          // Don't redirect if already on an allowed endpoint
          const path = error.config?.url || '';
          
          // Allow clusters and auth/status endpoints for anonymous users
          if (path.includes('/clusters') || path.includes('/auth/status')) {
            // Don't redirect - let the response through
            return Promise.reject(error);
          }
          
          // For other endpoints, redirect to login
          window.location.href = '/api/v1/auth/login';
        } else if (error.response?.status === 403) {
          // Access denied - this is expected for anonymous users on some endpoints
          // Don't show toast for anonymous users
          const errorData = error.response?.data as any;
          const isAnonymousError = errorData?.detail?.includes('Anonymous');
          if (!isAnonymousError) {
            toast.error('Access denied. You do not have permission to perform this action.');
          }
        } else if (error.response?.status === 500) {
          toast.error('Server error. Please try again later.');
        } else if (!error.response) {
          toast.error('Network error. Please check your connection.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async getAuthStatus() {
    try {
      const { data } = await this.client.get('/auth/status');
      return data;
    } catch (error) {
      // Return default anonymous status if endpoint fails
      return {
        authenticated: false,
        user: null,
        message: 'Not authenticated'
      };
    }
  }

  async getCurrentUser() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  async getUserPermissions() {
    try {
      const { data } = await this.client.get('/auth/permissions');
      return data;
    } catch (error) {
      // Return empty permissions for anonymous users
      return {
        user: { username: 'anonymous', groups: [] },
        summary: { total_clusters: 0, accessible_clusters: 0 },
        clusters: {},
        accessible_cluster_names: []
      };
    }
  }

  async logout() {
    const { data } = await this.client.post('/auth/logout');
    if (data.redirect) {
      window.location.href = data.redirect;
    }
    return data;
  }

  // Cluster endpoints
  async getClusters(includeStatus = true, includeMetrics = true) {
    try {
      const { data } = await this.client.get('/clusters', {
        params: {
          include_status: includeStatus,
          include_metrics: includeMetrics,
        },
      });
      return data;
    } catch (error) {
      // For anonymous users, return empty array on error
      return [];
    }
  }

  async getCluster(clusterName: string) {
    const { data } = await this.client.get(`/clusters/${clusterName}`);
    return data;
  }

  async getClusterNodes(clusterName: string, role?: string, status?: string) {
    const { data } = await this.client.get(`/clusters/${clusterName}/nodes`, {
      params: { role, status },
    });
    return data;
  }

  async getClusterNode(clusterName: string, nodeName: string, includeMetrics = false) {
    const { data } = await this.client.get(`/clusters/${clusterName}/nodes/${nodeName}`, {
      params: { include_metrics: includeMetrics },
    });
    return data;
  }

  async getClusterOperators(clusterName: string, namespace?: string, status?: string) {
    const { data } = await this.client.get(`/clusters/${clusterName}/operators`, {
      params: { namespace, status },
    });
    return data;
  }

  async getClusterNamespaces(clusterName: string, withOperatorCount = false) {
    const { data } = await this.client.get(`/clusters/${clusterName}/namespaces`, {
      params: { with_operator_count: withOperatorCount },
    });
    return data;
  }

  async getClusterMetrics(clusterName: string, includeCosts = false) {
    const { data } = await this.client.get(`/clusters/${clusterName}/metrics`, {
      params: { include_costs: includeCosts },
    });
    return data;
  }

  async getRegistriesStatus(includeResponseTime = false) {
    const { data } = await this.client.get('/registries/status', {
      params: {
        include_response_time: includeResponseTime,
      },
    });
    return data;
  }

  async getClusterAlerts(clusterName: string, severity?: string) {
    const { data } = await this.client.get(`/clusters/${clusterName}/alerts`, {
      params: { severity },
    });
    return data;
  }

  async getClusterEvents(clusterName: string, limit = 100) {
    const { data } = await this.client.get(`/clusters/${clusterName}/events`, {
      params: { limit },
    });
    return data;
  }
}

// Create and export a singleton instance
export const clusterAPI = new APIClient();

// Export the class for testing purposes
export { APIClient };
