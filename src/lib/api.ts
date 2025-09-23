import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  RegisterRequest,
  DatasetsResponse, 
  DatasetFilters,
  SamplesResponse,
  CreateDatasetRequest,
  ApiError,
  TranscribeResponse,
  DatasetSamplesResponse,
  Dataset
} from '@/types';

import {API_BASE_URL} from '@/conf';

// Кастомный класс для API ошибок
class CustomApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'CustomApiError';
  }
}

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
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData: any = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { detail: `HTTP error! status: ${response.status}` };
      }

      // Бросаем кастомную ошибку с полной информацией
      throw new CustomApiError(
        errorData.detail?.message || errorData.detail || `HTTP ${response.status}`,
        response.status,
        errorData.detail
      );
    }

    // если запрос без ответа (204), вернём пустой объект
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ---------------- AUTH ----------------
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

  // ---------------- DATASETS ----------------
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


  async fetchDataset(datasetId: number): Promise<Dataset> {
    const response = await fetch(`${API_BASE_URL}/datasets/${datasetId}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Ошибка при получении датасета ${datasetId}`);
    }

    return response.json();
  }

  // Исправленный метод createDataset с обработкой конкретных ошибок
  async createDataset(data: CreateDatasetRequest): Promise<any> {
    try {
      const response = await this.request<{ message: string }>('/datasets/initialize', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      if (error instanceof CustomApiError) {
        // Специальная обработка для разных статусов
        if (error.status === 409) {
          // Конфликт - датасет уже существует
          throw new Error(` ${error.message}`);
        } else if (error.status === 400) {
          // Неверные данные
          throw new Error(`Неверные данные: ${error.message}`);
        } else if (error.status === 401) {
          // Не авторизован
          throw new Error('Необходима авторизация');
        } else if (error.status === 403) {
          // Запрещено
          throw new Error('Доступ запрещен');
        } else {
          throw new Error(`Ошибка сервера: ${error.message}`);
        }
      }
      
      // Если это не наша кастомная ошибка, перебрасываем как есть
      throw error;
    }
  }
  async deleteDataset(datasetId: number): Promise<any> {
    try {
      return await this.request<{ message: string }>(`/datasets/${datasetId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      if (error instanceof CustomApiError) {
        switch (error.status) {
          case 401:
            throw new Error('Необходима авторизация');
          case 403:
            throw new Error('Доступ запрещен');
          case 404:
            throw new Error('Датасет не найден');
          default:
            throw new Error(`Ошибка при удалении датасета: ${error.message}`);
        }
      }
      throw error; // если это не CustomApiError, пробросим дальше
    }
  }

  async fetchDatasetSamples(
    datasetId: number,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
    fromIndex?: number | null,
    toIndex?: number | null
  ): Promise<DatasetSamplesResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (status && status !== 'ALL') {
      params.append('status', status);
    }

    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }

    if (fromIndex != null && toIndex != null) {
      params.append('from_index', fromIndex.toString());
      params.append('to_index', toIndex.toString());
    }

    const endpoint = `/samples/by-dataset/${datasetId}?${params.toString()}`;
    return this.request<DatasetSamplesResponse>(endpoint);
  }

  async approveSample(sampleId: number): Promise<void> {
    return this.request<void>(`/samples/${sampleId}/approve`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });
  }

  async rejectSample(sampleId: number): Promise<void> {
    return this.request<void>(`/samples/${sampleId}/reject`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });
  }

  async updateSampleText(sampleId: number, text: string): Promise<void> {
    return this.request<void>(`/samples/${sampleId}`, {
      method: 'PUT',
      headers: { 'Accept': 'application/json' },
      body: JSON.stringify({ text }),
    });
  }

  // ---------------- TRANSCRIBE ----------------
  async startTranscription(
    datasetId: number,
    model_name: string
  ): Promise<TranscribeResponse> {
    return this.request<TranscribeResponse>(`/transcribe/${datasetId}`, {
      method: 'POST',
      body: JSON.stringify({ model_name }),
    });
  }


  // ---------------- USERS ----------------
  async getUsers(page: number = 1, pageSize: number = 10): Promise<{
    total: number;
    page: number;
    page_size: number;
    users: { id: number; username: string; role: string }[];
  }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    return this.request(`/users/?${params.toString()}`);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    try {
      return await this.request<{ message: string }>(`/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
    } catch (error) {
      if (error instanceof CustomApiError) {
        switch (error.status) {
          case 401:
            throw new Error('Необходима авторизация');
          case 403:
            throw new Error('Доступ запрещен');
          case 404:
            throw new Error('Пользователь не найден');
          default:
            throw new Error(`Ошибка при удалении пользователя: ${error.message}`);
        }
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();