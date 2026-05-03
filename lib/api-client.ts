import axios, { AxiosInstance } from 'axios';

export class CertiDraftAPI {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          // Attempt to refresh or redirect to login
          if (!window.location.pathname.startsWith('/auth')) {
             window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from storage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  // Auth methods
  async register(data: any) {
    return this.client.post('/auth/register', data);
  }

  async login(data: any) {
    const response = await this.client.post('/auth/login', data);
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }
    return response;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.client.get('/users/me');
  }

  // Templates methods
  async getTemplates() {
    return this.client.get('/templates');
  }

  // Projects methods
  async getProjects(page = 1, filters = {}) {
    return this.client.get('/projects', {
      params: { page, per_page: 20, ...filters },
    });
  }

  async createProject(data: any) {
    return this.client.post('/projects', data);
  }

  async getProject(id: string) {
    return this.client.get(`/projects/${id}`);
  }

  async updateProject(id: string, data: any) {
    return this.client.put(`/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.client.delete(`/projects/${id}`);
  }

  // Batch methods
  async startBatch(projectId: string, uploadId: string, aiEnabled = true) {
    return this.client.post(`/projects/${projectId}/batches`, {
      upload_id: uploadId,
      ai_enabled: aiEnabled,
    });
  }

  async getBatchStatus(projectId: string, batchId: string) {
    return this.client.get(`/projects/${projectId}/batches?batch_id=${batchId}`);
  }

  async sendEmails(batchId: string, emails: string[]) {
    return this.client.post(`/batches/${batchId}/send-email`, {
      recipient_emails: emails,
    });
  }

  async downloadCertificate(batchId: string, certId: string) {
    return this.client.get(`/batches/${batchId}/certificates/${certId}/download`, {
      responseType: 'blob',
    });
  }

  // Subscription methods
  async upgradeSubscription(plan: string, billingCycle: 'monthly' | 'yearly' = 'monthly') {
    return this.client.post('/subscription/upgrade', { plan, billingCycle });
  }

  // AI methods
  async generateCitation(prompt: string, context?: string) {
    return this.client.post('/ai/citation', { prompt, context });
  }

  // Usage methods
  async updateUsage() {
    return this.client.post('/users/usage');
  }
}

export const api = new CertiDraftAPI();
