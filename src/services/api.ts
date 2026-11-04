const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface BackendUser {
  id: string;
  username: string;
  email: string;
  nombre: string;
  cargo: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'COBRADOR' | 'AUDITOR';
  estado: 'ACTIVO' | 'INACTIVO';
  permisos?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password?: string;
  nombre: string;
  cargo: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'COBRADOR' | 'AUDITOR';
  estado?: 'ACTIVO' | 'INACTIVO';
  permisos?: any;
}

export function getStoredToken(): string | null {
  return localStorage.getItem('cmc_access_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('cmc_access_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('cmc_access_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Autenticación
  async login(usernameOrEmail: string, password: string) {
    const data = await request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    if (data.accessToken) {
      setStoredToken(data.accessToken);
    }
    return data;
  },

  async getMe() {
    return request<any>('/auth/me');
  },

  // Gestión de Usuarios (CRUD Backend)
  async getUsers(params: { search?: string; rol?: string; estado?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.rol && params.rol !== 'all') query.append('rol', params.rol.toUpperCase());
    if (params.estado && params.estado !== 'all') query.append('estado', params.estado.toUpperCase());
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const qs = query.toString();
    return request<{ items: BackendUser[]; total: number; totalPages: number }>(`/users${qs ? `?${qs}` : ''}`);
  },

  async getUserById(id: string) {
    return request<BackendUser>(`/users/${id}`);
  },

  async createUser(input: CreateUserInput) {
    return request<BackendUser>('/users', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        password: input.password || 'Admin123*',
        estado: input.estado || 'ACTIVO',
      }),
    });
  },

  async updateUser(id: string, input: Partial<CreateUserInput>) {
    return request<BackendUser>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};

