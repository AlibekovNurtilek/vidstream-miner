import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  RegisterRequest,
  DatasetsResponse, 
  DatasetFilters,
  SamplesResponse,
  CreateDatasetRequest,
  ApiError 
} from '@/types';

const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ 
        detail: `HTTP error! status: ${response.status}` 
      }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: '',
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async register(data: RegisterRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dataset endpoints
  async getDatasets(filters: DatasetFilters = {}): Promise<DatasetsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/datasets/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<DatasetsResponse>(endpoint);
  }

  async createDataset(data: CreateDatasetRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/datasets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sample endpoints
  async getSamplesByDataset(
    datasetId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<SamplesResponse> {
    return this.request<SamplesResponse>(
      `/samples/by-dataset/${datasetId}?page=${page}&limit=${limit}`
    );
  }
}

export const apiClient = new ApiClient();