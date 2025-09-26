/**
 * API Service - Updated for new RBAC-enabled backend
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
        // Headers are handled by OAuth proxy, no need for manual tokens
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
          // Redirect to login if not authenticated
          window.location.href = '/api/v1/auth/login';
        } else if (error.response?.status === 403) {
          toast.error('Access denied. You do not have permission to perform this action.');
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
    const { data } = await this.client.get('/auth/status');
    return data;
  }

  async getCurrentUser() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  async getUserPermissions() {
    const { data } = await this.client.get('/auth/permissions');
    return data;
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
    const { data } = await this.client.get('/clusters', {
      params: {
        include_status: includeStatus,
        include_metrics: includeMetrics,
      },
    });
    return data;
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
