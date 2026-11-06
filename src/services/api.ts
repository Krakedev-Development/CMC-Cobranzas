export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export interface BackendClient {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  estado: 'ACTIVO' | 'INACTIVO';
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendProduct {
  id: string;
  nombre: string;
  descripcion: string;
  precioNominal: number;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt: string;
  updatedAt: string;
}

export interface BackendDebt {
  id: string;
  clienteId: string;
  productoId: string;
  fechaAdquisicion: string;
  precioNominalAplicado: number;
  precioAcordado: number;
  saldoInicial: number;
  saldoActual: number;
  metodoPago?: string;
  plazoMeses?: number;
  diaCorte?: number;
  cuotas?: any[];
  observaciones?: string;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ANULADA';
  createdAt: string;
  updatedAt: string;
}

export interface BackendPayment {
  id: string;
  deudaId: string;
  clienteId: string;
  monto: number;
  fechaPago: string;
  metodo: string;
  bancoOrigen?: string;
  numeroTransaccion?: string;
  referencia?: string;
  comprobanteUrl?: string;
  estadoRegistro: string;
  estadoConciliacion: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
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
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
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
    return request<BackendUser>('/auth/me');
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar fallo de red en logout
    } finally {
      clearStoredToken();
    }
  },

  // Gestión de Usuarios
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

  // Clientes
  async getClients(params: { search?: string; estado?: string; skip?: number; take?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.estado && params.estado !== 'all') query.append('estado', params.estado.toUpperCase());
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.take !== undefined) query.append('take', String(params.take));

    const qs = query.toString();
    return request<{ items: BackendClient[]; total: number }>(`/clients${qs ? `?${qs}` : ''}`);
  },

  async createClient(data: Omit<BackendClient, 'id' | 'createdAt' | 'updatedAt'>) {
    return request<BackendClient>('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateClient(id: string, data: Partial<BackendClient>) {
    return request<BackendClient>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Productos
  async getProducts(params: { search?: string; estado?: string; skip?: number; take?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.estado && params.estado !== 'all') query.append('estado', params.estado.toUpperCase());
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.take !== undefined) query.append('take', String(params.take));

    const qs = query.toString();
    return request<{ items: BackendProduct[]; total: number }>(`/products${qs ? `?${qs}` : ''}`);
  },

  async createProduct(data: Omit<BackendProduct, 'id' | 'createdAt' | 'updatedAt'>) {
    return request<BackendProduct>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id: string, data: Partial<BackendProduct>) {
    return request<BackendProduct>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Deudas
  async getDebts(params: { clienteId?: string; productoId?: string; estado?: string; skip?: number; take?: number } = {}) {
    const query = new URLSearchParams();
    if (params.clienteId) query.append('clienteId', params.clienteId);
    if (params.productoId) query.append('productoId', params.productoId);
    if (params.estado && params.estado !== 'all') query.append('estado', params.estado.toUpperCase());
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.take !== undefined) query.append('take', String(params.take));

    const qs = query.toString();
    return request<{ items: BackendDebt[]; total: number }>(`/debts${qs ? `?${qs}` : ''}`);
  },

  async createDebt(data: {
    clienteId: string;
    productoId: string;
    precioAcordado: number;
    precioNominalAplicado?: number;
    fechaAdquisicion: string;
    metodoPago?: string;
    plazoMeses?: number;
    diaCorte?: number;
    observaciones?: string;
  }) {
    return request<BackendDebt>('/debts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Pagos
  async getPayments(params: { clienteId?: string; deudaId?: string; metodo?: string; estadoRegistro?: string } = {}) {
    const query = new URLSearchParams();
    if (params.clienteId) query.append('clienteId', params.clienteId);
    if (params.deudaId) query.append('deudaId', params.deudaId);
    if (params.metodo) query.append('metodo', params.metodo.toUpperCase());
    if (params.estadoRegistro) query.append('estadoRegistro', params.estadoRegistro.toUpperCase());

    const qs = query.toString();
    return request<{ items: BackendPayment[]; total: number }>(`/payments${qs ? `?${qs}` : ''}`);
  },

  async createPayment(data: {
    deudaId: string;
    clienteId: string;
    monto: number;
    fechaPago: string;
    metodo: string;
    bancoOrigen?: string;
    numeroTransaccion?: string;
    referencia?: string;
    observaciones?: string;
  }, file?: File) {
    if (file) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      formData.append('comprobante', file);

      return request<BackendPayment>('/payments', {
        method: 'POST',
        body: formData,
      });
    }

    return request<BackendPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
