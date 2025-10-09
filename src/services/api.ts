/**
 * API Service
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class APIClient {
  private client: AxiosInstance;
  private publicClient: AxiosInstance;

  constructor() {
    // Authenticated client
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Public client (no credentials)
    this.publicClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false,
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
        // Don't show toasts for auth/permissions endpoints - let components handle it
        const isSilentEndpoint = error.config?.url?.includes('/auth/status') || 
                                 error.config?.url?.includes('/auth/permissions') ||
                                 error.config?.url?.includes('/auth/me');

        if (error.response?.status === 401) {
          // Silently handle 401 for auth endpoints
          if (!isSilentEndpoint) {
            console.warn('Authentication required');
          }
        } else if (error.response?.status === 403) {
          // Silently handle 403 for auth endpoints
          if (!isSilentEndpoint) {
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

  // Check if public API is available
  async checkPublicApiAvailable() {
    try {
      const { data } = await this.publicClient.get('/public/health');
      return data.anonymous_access_enabled === true;
    } catch {
      return false;
    }
  }

  // Get public cluster health (no auth required)
  async getPublicClusterHealth() {
    const { data } = await this.publicClient.get('/public/clusters/health');
    return data;
  }

  // Authentication endpoints
  async getAuthStatus() {
    try {
      const { data } = await this.client.get('/auth/status');
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      // If 401 or 403, return unauthenticated status instead of throwing
      if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        return { authenticated: false, user: null, message: 'Not authenticated' };
      }
      throw error;
    }
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

  // Redirect to login
  redirectToLogin() {
    window.location.href = '/api/v1/auth/login';
  }

  // Cluster endpoints (authenticated)
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
