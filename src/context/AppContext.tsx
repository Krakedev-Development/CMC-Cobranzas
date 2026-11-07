import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Client,
  Product,
  Debt,
  DebtStatus,
  Payment,
  Voucher,
  BankMovement,
  Reconciliation,
  Invoice,
  DemoUser,
  AuditLog,
  ModuleName,
  PermissionSet,
  UserPermissions,
  ExtractedData,
  AuditAction,
  PaymentMethod,
} from '../types';
import {
  INITIAL_CLIENTS,
  INITIAL_PRODUCTS,
  INITIAL_DEBTS,
  INITIAL_PAYMENTS,
  INITIAL_VOUCHERS,
  INITIAL_BANK_MOVEMENTS,
  INITIAL_RECONCILIATIONS,
  INITIAL_INVOICES,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  createFullPermissionSet,
} from '../data/mockData';
import { api, getStoredToken, clearStoredToken } from '../services/api';

const STORAGE_KEY = 'cobranzas_cmc_app_v2';

// Limpieza de datos antiguos de prueba en localStorage
if (typeof window !== 'undefined') {
  const OLD_STORAGE_PREFIXES = ['cobranzas_conciliacion_proto_v1', 'cobranzas_cmc_prod_v1'];
  OLD_STORAGE_PREFIXES.forEach((prefix) => {
    ['clients', 'products', 'debts', 'payments', 'vouchers', 'bankMovements', 'reconciliations', 'invoices', 'users', 'auditLogs', 'currentUserId'].forEach((k) => {
      try {
        localStorage.removeItem(`${prefix}_${k}`);
      } catch {
        // ignore
      }
    });
  });
}

// Administrador inicial del sistema
const DEFAULT_ADMIN: DemoUser = {
  id: 'admin',
  username: 'admin',
  nombre: 'Administrador Principal',
  cargo: 'Administrador del Sistema',
  estado: 'activo',
  perfilBase: 'Administrador',
  permisos: createFullPermissionSet(),
  createdAt: new Date().toISOString(),
  createdBy: 'sistema',
  updatedAt: new Date().toISOString(),
  updatedBy: 'sistema',
};

export interface DebtFinancialSummary {
  debt: Debt;
  client?: Client;
  product?: Product;
  validPaymentsTotal: number;
  saldoPendiente: number;
  calculatedStatus: DebtStatus;
}

export interface ClientFinancialSummary {
  client: Client;
  totalPrecioNominal: number;
  totalPrecioAcordado: number;
  totalPagado: number;
  saldoPendienteTotal: number;
  deudas: Debt[];
  pagos: Payment[];
  facturas: Invoice[];
}

interface AppContextType {
  // State
  clients: Client[];
  products: Product[];
  debts: Debt[];
  payments: Payment[];
  vouchers: Voucher[];
  bankMovements: BankMovement[];
  reconciliations: Reconciliation[];
  invoices: Invoice[];
  users: DemoUser[];
  auditLogs: AuditLog[];
  currentUserId: string;
  currentUser: DemoUser;
  isNavPinned: boolean;
  setIsNavPinned: (pinned: boolean) => void;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Actions
  setCurrentUserId: (id: string) => void;
  resetToDemoData: () => void;
  hasPermission: (module: ModuleName, action: keyof PermissionSet) => boolean;
  logAudit: (
    modulo: ModuleName | string,
    accion: AuditAction,
    entidadTipo: string,
    entidadId: string,
    valoresAnteriores?: Record<string, any>,
    valoresNuevos?: Record<string, any>,
    motivo?: string,
    resultado?: 'exitoso' | 'rechazado' | 'fallido',
    origen?: 'interfaz' | 'importacion' | 'simulacion',
    aprobadorId?: string,
    reglaEjecutada?: string
  ) => void;

  // Clients
  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => void;
  toggleClientStatus: (id: string) => void;
  importClientsBulk: (newClients: Array<Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>) => { imported: number; duplicates: number };

  // Products
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;

  // Debts
  addDebt: (data: {
    clienteId: string;
    productoId: string;
    fechaAdquisicion: string;
    fechaCompromisoPago?: string;
    diasMora?: number;
    precioNominalAplicado: number;
    precioAcordado: number;
    metodoPago?: PaymentMethod;
    plazoMeses?: number;
    diaCorte?: number;
    cuotas?: Array<{ numero: number; monto: number; fechaVencimiento: string; estado: 'pendiente' | 'pagada' | 'vencida' }>;
    observaciones?: string;
  }) => Promise<Debt>;
  importDebtsBulk: (items: Array<{ clienteId: string; productoId: string; fechaAdquisicion: string; precioNominal: number; precioAcordado: number; observaciones?: string }>) => number;
  getDebtFinancials: (debtId: string) => DebtFinancialSummary | null;
  getClientFinancials: (clientId: string) => ClientFinancialSummary | null;

  // Payments
  registerPayment: (
    paymentData: {
      deudaId: string;
      clienteId: string;
      monto: number;
      fechaPago: string;
      metodo: Payment['metodo'];
      bancoOrigen?: string;
      numeroTransaccion?: string;
      referencia?: string;
      observaciones?: string;
    },
    voucherData?: {
      nombreArchivo: string;
      tipoArchivo?: string;
      archivoUrl?: string;
      datosExtraidos?: ExtractedData;
    },
    initialDebt?: Debt,
    file?: File
  ) => Promise<Payment>;
  cancelPayment: (paymentId: string, motivo: string) => void;

  // Vouchers
  getVoucherById: (voucherId: string) => Voucher | undefined;
  getVouchersForPayment: (paymentId: string) => Voucher[];

  // Reconciliation
  runAutoReconciliation: () => { autoReconciled: number; diffFound: number; manualPending: number };
  reconcileManually: (paymentId: string, bankMovementId: string, observacion?: string) => void;
  undoReconciliation: (reconciliationId: string, motivo: string) => void;
  importBankMovements: (movements: Array<Omit<BankMovement, 'id' | 'estado' | 'archivoImportacionId'>>) => {
    inserted: number;
    duplicates: number;
  };

  // Invoices
  registerInvoice: (data: { clienteId: string; deudaId?: string; numeroFactura: string; fechaFactura: string; monto?: number; nombreArchivo?: string; observaciones?: string }) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;

  // Users & Permissions
  addUser: (data: Omit<DemoUser, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => DemoUser;
  updateUser: (id: string, data: Partial<DemoUser>) => void;
  updateUserPermissions: (userId: string, permissions: UserPermissions, motivo?: string) => void;

  // Utility
  exportToCSV: (filename: string, headers: string[], rows: (string | number | undefined | null)[][]) => void;
  exportToPDF: (title: string, headers: string[], rows: (string | number | undefined | null)[][], subtitle?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load saved state or default
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_clients`);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_debts`);
    return saved ? JSON.parse(saved) : INITIAL_DEBTS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vouchers`);
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  });

  const [bankMovements, setBankMovements] = useState<BankMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bankMovements`);
    return saved ? JSON.parse(saved) : INITIAL_BANK_MOVEMENTS;
  });

  const [reconciliations, setReconciliations] = useState<Reconciliation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reconciliations`);
    return saved ? JSON.parse(saved) : INITIAL_RECONCILIATIONS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [users, setUsers] = useState<DemoUser[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_auditLogs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_currentUserId`);
    return saved || 'admin';
  });

  const [isNavPinned, setIsNavPinnedState] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_isNavPinned`);
    return saved ? JSON.parse(saved) : false;
  });

  // Current user resolution
  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId || u.username === currentUserId) || users[0];
  }, [users, currentUserId]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getStoredToken());
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Sincronización completa con el Backend (PostgreSQL) si está disponible
  const syncBackendData = async () => {
    try {
      // 1. Usuarios
      const usersRes = await api.getUsers({ limit: 100 }).catch(() => null);
      if (usersRes?.items?.length) {
        const backendMapped: DemoUser[] = usersRes.items.map((bu) => {
          const perfil = bu.rol === 'ADMIN' ? 'Administrador'
            : bu.rol === 'SUPERVISOR' ? 'Supervisor'
            : bu.rol === 'AUDITOR' ? 'Auditor'
            : 'Cobranzas';

          return {
            id: bu.id,
            username: bu.username,
            nombre: bu.nombre,
            cargo: bu.cargo,
            estado: bu.estado.toLowerCase() as 'activo' | 'inactivo',
            perfilBase: perfil,
            permisos: (bu.permisos as UserPermissions) || createFullPermissionSet(),
            createdAt: bu.createdAt,
            createdBy: 'backend',
            updatedAt: bu.updatedAt,
            updatedBy: 'backend',
          };
        });
        setUsers(backendMapped);
      }

      // 2. Clientes
      const clientsRes = await api.getClients({ take: 200 }).catch(() => null);
      if (clientsRes?.items) {
        const mappedClients: Client[] = clientsRes.items.map((c) => ({
          id: c.id,
          cedula: c.cedula,
          nombres: c.nombres,
          apellidos: c.apellidos,
          telefono: c.telefono,
          correo: c.correo,
          estado: c.estado.toLowerCase() as 'activo' | 'inactivo',
          notas: c.notas || '',
          createdAt: c.createdAt,
          createdBy: 'backend',
          updatedAt: c.updatedAt,
          updatedBy: 'backend',
        }));
        setClients(mappedClients);
      }

      // 3. Productos
      const productsRes = await api.getProducts({ take: 200 }).catch(() => null);
      if (productsRes?.items) {
        const mappedProducts: Product[] = productsRes.items.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioNominal: p.precioNominal,
          estado: p.estado.toLowerCase() as 'activo' | 'inactivo',
          createdAt: p.createdAt,
          createdBy: 'backend',
          updatedAt: p.updatedAt,
          updatedBy: 'backend',
        }));
        setProducts(mappedProducts);
      }

      // 4. Deudas
      const debtsRes = await api.getDebts({ take: 200 }).catch(() => null);
      if (debtsRes?.items) {
        const mappedDebts: Debt[] = debtsRes.items.map((d) => ({
          id: d.id,
          clienteId: d.clienteId,
          productoId: d.productoId,
          fechaAdquisicion: d.fechaAdquisicion,
          precioNominalAplicado: d.precioNominalAplicado,
          precioAcordado: d.precioAcordado,
          saldoInicial: d.saldoInicial,
          metodoPago: (d.metodoPago?.toLowerCase() as PaymentMethod) || 'transferencia',
          plazoMeses: d.plazoMeses || 1,
          diaCorte: d.diaCorte || 15,
          cuotas: d.cuotas || undefined,
          observaciones: d.observaciones || undefined,
          estado: d.estado.toLowerCase() as 'pendiente' | 'parcial' | 'pagada' | 'anulada',
          createdAt: d.createdAt,
          createdBy: 'backend',
          updatedAt: d.updatedAt,
          updatedBy: 'backend',
        }));
        setDebts(mappedDebts);
      }

      // 5. Pagos
      const paymentsRes = await api.getPayments().catch(() => null);
      if (paymentsRes?.items) {
        const mappedPayments: Payment[] = paymentsRes.items.map((pay) => ({
          id: pay.id,
          deudaId: pay.deudaId,
          clienteId: pay.clienteId,
          monto: pay.monto,
          fechaPago: pay.fechaPago,
          metodo: (pay.metodo?.toLowerCase() as PaymentMethod) || 'transferencia',
          bancoOrigen: pay.bancoOrigen || undefined,
          numeroTransaccion: pay.numeroTransaccion || undefined,
          referencia: pay.referencia || undefined,
          comprobanteId: pay.comprobanteUrl || undefined,
          estadoRegistro: (pay.estadoRegistro?.toLowerCase() as any) || 'registrado',
          estadoConciliacion: (pay.estadoConciliacion?.toLowerCase() as any) || 'pendiente',
          observaciones: pay.observaciones || undefined,
          createdAt: pay.createdAt,
          createdBy: 'backend',
          updatedAt: pay.updatedAt,
          updatedBy: 'backend',
        }));
        setPayments(mappedPayments);
      }
    } catch (e) {
      console.warn('Sincronización con backend completada con advertencias:', e);
    }
  };

  // Verificación de sesión al montar
  useEffect(() => {
    async function checkSessionAndSync() {
      const token = getStoredToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      try {
        const me = await api.getMe();
        if (me && (me.username || me.id)) {
          setIsAuthenticated(true);
          setCurrentUserIdState(me.username || me.id);
          await syncBackendData();
        } else {
          clearStoredToken();
          setIsAuthenticated(false);
        }
      } catch {
        clearStoredToken();
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    checkSessionAndSync();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await api.login(usernameOrEmail, password);
    if (res && res.accessToken) {
      setIsAuthenticated(true);
      if (res.user) {
        setCurrentUserIdState(res.user.username || res.user.id);
      }
      await syncBackendData();
    }
  };

  const logout = async () => {
    await api.logout();
    clearStoredToken();
    setIsAuthenticated(false);
    setCurrentUserIdState('admin');
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_debts`, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_vouchers`, JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_bankMovements`, JSON.stringify(bankMovements));
  }, [bankMovements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_reconciliations`, JSON.stringify(reconciliations));
  }, [reconciliations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_auditLogs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    localStorage.setItem(`${STORAGE_KEY}_currentUserId`, id);
  };

  const setIsNavPinned = (pinned: boolean) => {
    setIsNavPinnedState(pinned);
    localStorage.setItem(`${STORAGE_KEY}_isNavPinned`, JSON.stringify(pinned));
  };

  // Helper for generating current timestamp format YYYY-MM-DD HH:MM:SS
  const getNowString = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  // Audit Logger
  const logAudit = (
    modulo: ModuleName | string,
    accion: AuditAction,
    entidadTipo: string,
    entidadId: string,
    valoresAnteriores?: Record<string, any>,
    valoresNuevos?: Record<string, any>,
    motivo?: string,
    resultado: 'exitoso' | 'rechazado' | 'fallido' = 'exitoso',
    origen: 'interfaz' | 'importacion' | 'simulacion' = 'interfaz',
    aprobadorId?: string,
    reglaEjecutada?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fechaHora: getNowString(),
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre,
      modulo,
      accion,
      entidadTipo,
      entidadId,
      resultado,
      valoresAnteriores,
      valoresNuevos,
      motivo,
      aprobadorId,
      reglaEjecutada,
      origen,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Restaurar datos completos
  const resetToDemoData = () => {
    setClients(INITIAL_CLIENTS);
    setProducts(INITIAL_PRODUCTS);
    setDebts(INITIAL_DEBTS);
    setPayments(INITIAL_PAYMENTS);
    setVouchers(INITIAL_VOUCHERS);
    setBankMovements(INITIAL_BANK_MOVEMENTS);
    setReconciliations(INITIAL_RECONCILIATIONS);
    setInvoices(INITIAL_INVOICES);
    setUsers(INITIAL_USERS);
    setCurrentUserIdState('admin');

    const resetAuditLog: AuditLog = {
      id: `aud-${Date.now()}`,
      fechaHora: getNowString(),
      usuarioId: 'admin',
      usuarioNombre: 'Administrador CMC',
      modulo: 'sistema',
      accion: 'restaurar_demo',
      entidadTipo: 'sistema',
      entidadId: 'data-root',
      resultado: 'exitoso',
      motivo: 'Restauración confirmada de datos con relaciones coherentes.',
      origen: 'interfaz',
    };

    setAuditLogs([resetAuditLog, ...INITIAL_AUDIT_LOGS]);
  };

  // Permissions check
  const hasPermission = (module: ModuleName, action: keyof PermissionSet): boolean => {
    if (!currentUser || currentUser.estado === 'inactivo') return false;
    // Admin has verified full permissions
    const isAdmin =
      currentUser.username === 'admin' ||
      currentUser.perfilBase === 'Administrador' ||
      currentUser.cargo?.toLowerCase().includes('administrador') ||
      (currentUser as any).rol === 'ADMIN';

    if (isAdmin) {
      if (module === 'auditoria' && (action === 'modificar' || action === 'eliminar' || action === 'crear')) {
        return false; // Audit is strictly read-only for everyone!
      }
      return true;
    }
    const modulePerms = currentUser.permisos?.[module];
    if (!modulePerms) return false;
    return !!modulePerms[action];
  };

  // --- CLIENT OPERATIONS ---
  const addClient = async (data: Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Promise<Client> => {
    const now = getNowString();
    let realId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cli-${Date.now().toString().slice(-4)}`;

    try {
      const created = await api.createClient({
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos,
        telefono: data.telefono,
        correo: data.correo,
        estado: data.estado === 'activo' ? 'ACTIVO' : 'INACTIVO',
        notas: data.notas,
      });
      if (created?.id) {
        realId = created.id;
      }
    } catch (e) {
      console.warn('Error sincronizando cliente con backend PostgreSQL:', e);
    }

    const newClient: Client = {
      ...data,
      id: realId,
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };

    setClients((prev) => [newClient, ...prev.filter((c) => c.id !== realId)]);
    logAudit('clientes', 'crear', 'cliente', realId, undefined, {
      cedula: newClient.cedula,
      nombres: `${newClient.nombres} ${newClient.apellidos}`,
      telefono: newClient.telefono,
    }, 'Creación individual de cliente registrada en PostgreSQL');

    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    const existing = clients.find((c) => c.id === id);
    if (!existing) return;
    const now = getNowString();
    const updated = { ...existing, ...data, updatedAt: now, updatedBy: currentUser.username };

    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    logAudit('clientes', 'modificar', 'cliente', id, existing, updated, 'Actualización de datos de cliente');

    api.updateClient(id, {
      ...(data.cedula && { cedula: data.cedula }),
      ...(data.nombres && { nombres: data.nombres }),
      ...(data.apellidos && { apellidos: data.apellidos }),
      ...(data.telefono && { telefono: data.telefono }),
      ...(data.correo && { correo: data.correo }),
      ...(data.estado && { estado: data.estado === 'activo' ? 'ACTIVO' : 'INACTIVO' }),
      ...(data.notas !== undefined && { notas: data.notas }),
    }).catch((e) => console.warn('Error actualizando cliente en backend:', e));
  };

  const toggleClientStatus = (id: string) => {
    const existing = clients.find((c) => c.id === id);
    if (!existing) return;
    const newStatus = existing.estado === 'activo' ? 'inactivo' : 'activo';
    updateClient(id, { estado: newStatus });
  };

  const importClientsBulk = (newClients: Array<Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>) => {
    let imported = 0;
    let duplicates = 0;
    const now = getNowString();
    const existingCedulas = new Set(clients.map((c) => c.cedula.trim().toLowerCase()));

    const toAdd: Client[] = [];
    newClients.forEach((nc, idx) => {
      const cleanCedula = nc.cedula.trim().toLowerCase();
      if (existingCedulas.has(cleanCedula)) {
        duplicates++;
      } else {
        existingCedulas.add(cleanCedula);
        toAdd.push({
          ...nc,
          id: `cli-imp-${Date.now().toString().slice(-4)}-${idx}`,
          createdAt: now,
          createdBy: currentUser.username,
          updatedAt: now,
          updatedBy: currentUser.username,
        });
        imported++;
      }
    });

    if (toAdd.length > 0) {
      setClients((prev) => [...toAdd, ...prev]);
      // Sincronizar clientes con PostgreSQL
      toAdd.forEach((cl) => {
        api.createClient({
          cedula: cl.cedula,
          nombres: cl.nombres,
          apellidos: cl.apellidos,
          telefono: cl.telefono,
          correo: cl.correo,
          estado: cl.estado === 'activo' ? 'ACTIVO' : 'INACTIVO',
          notas: cl.notas,
        }).catch((err) => console.warn('Error sincronizando cliente importado con PostgreSQL:', err));
      });
      logAudit(
        'clientes',
        'importar',
        'cliente',
        `lote-${Date.now()}`,
        undefined,
        { importados: imported, duplicadosOmitidos: duplicates },
        `Importación de ${imported} clientes a PostgreSQL`,
        'exitoso',
        'importacion'
      );
    }

    return { imported, duplicates };
  };

  // --- PRODUCT OPERATIONS ---
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Product => {
    const newId = `prod-${Date.now().toString().slice(-4)}`;
    const now = getNowString();
    const newProduct: Product = {
      ...data,
      id: newId,
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };
    setProducts((prev) => [...prev, newProduct]);
    logAudit('productos', 'crear', 'producto', newId, undefined, {
      nombre: newProduct.nombre,
      precioNominal: newProduct.precioNominal,
    }, 'Creación de nuevo producto');

    api.createProduct({
      nombre: data.nombre,
      descripcion: data.descripcion,
      precioNominal: data.precioNominal,
      estado: data.estado === 'activo' ? 'ACTIVO' : 'INACTIVO',
    }).then((created) => {
      if (created?.id) {
        setProducts((prev) => prev.map((p) => (p.id === newId ? { ...p, id: created.id } : p)));
      }
    }).catch((e) => console.warn('Error sincronizando producto con backend:', e));

    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;
    const now = getNowString();
    const updated = { ...existing, ...data, updatedAt: now, updatedBy: currentUser.username };
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    logAudit('productos', 'modificar', 'producto', id, existing, updated, 'Modificación de producto');

    api.updateProduct(id, {
      ...(data.nombre && { nombre: data.nombre }),
      ...(data.descripcion && { descripcion: data.descripcion }),
      ...(data.precioNominal && { precioNominal: data.precioNominal }),
      ...(data.estado && { estado: data.estado === 'activo' ? 'ACTIVO' : 'INACTIVO' }),
    }).catch((e) => console.warn('Error actualizando producto en backend:', e));
  };

  // --- FINANCIAL CALCULATION ENGINE ---
  const getDebtFinancials = (debtId: string): DebtFinancialSummary | null => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return null;

    const client = clients.find((c) => c.id === debt.clienteId);
    const product = products.find((p) => p.id === debt.productoId);

    // Sum valid non-cancelled payments for this debt
    const validPayments = payments.filter((p) => p.deudaId === debt.id && p.estadoRegistro !== 'anulado');
    const validPaymentsTotal = validPayments.reduce((sum, p) => sum + p.monto, 0);

    // Strict rule: Saldo pendiente = precio acordado - suma de pagos válidos
    const saldoPendiente = Math.max(0, debt.precioAcordado - validPaymentsTotal);

    // Verificar si existen pagos pendientes de cruce bancario (en comprobación)
    const hasPendingVerificationPayment = validPayments.some(
      (p) => p.estadoConciliacion === 'pendiente' || p.estadoConciliacion === 'revision_manual' || p.estadoConciliacion === 'con_diferencias'
    );

    let calculatedStatus: Debt['estado'] = debt.estado;
    if (debt.estado !== 'anulada') {
      if (debt.estado === 'en_comprobacion' || (hasPendingVerificationPayment && debt.estado !== 'pagada')) {
        calculatedStatus = 'en_comprobacion';
      } else if (saldoPendiente <= 0.001 || debt.estado === 'pagada') {
        calculatedStatus = 'pagada';
      } else if (validPaymentsTotal > 0) {
        calculatedStatus = 'parcial';
      } else {
        calculatedStatus = 'pendiente';
      }
    }

    return {
      debt,
      client,
      product,
      validPaymentsTotal,
      saldoPendiente,
      calculatedStatus,
    };
  };

  const getClientFinancials = (clientId: string): ClientFinancialSummary | null => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return null;

    const clientDebts = debts.filter((d) => d.clienteId === clientId && d.estado !== 'anulada');
    const clientPayments = payments.filter((p) => p.clienteId === clientId);
    const clientInvoices = invoices.filter((inv) => inv.clienteId === clientId);

    let totalPrecioNominal = 0;
    let totalPrecioAcordado = 0;
    let totalPagado = 0;
    let saldoPendienteTotal = 0;

    clientDebts.forEach((d) => {
      totalPrecioNominal += d.precioNominalAplicado;
      totalPrecioAcordado += d.precioAcordado;
      const financials = getDebtFinancials(d.id);
      if (financials) {
        totalPagado += financials.validPaymentsTotal;
        saldoPendienteTotal += financials.saldoPendiente;
      }
    });

    return {
      client,
      totalPrecioNominal,
      totalPrecioAcordado,
      totalPagado,
      saldoPendienteTotal,
      deudas: debts.filter((d) => d.clienteId === clientId),
      pagos: clientPayments,
      facturas: clientInvoices,
    };
  };

  // --- DEBT OPERATIONS ---
  const addDebt = async (data: {
    clienteId: string;
    productoId: string;
    fechaAdquisicion: string;
    fechaCompromisoPago?: string;
    diasMora?: number;
    precioNominalAplicado: number;
    precioAcordado: number;
    metodoPago?: PaymentMethod;
    plazoMeses?: number;
    diaCorte?: number;
    cuotas?: Array<{ numero: number; monto: number; fechaVencimiento: string; estado: 'pendiente' | 'pagada' | 'vencida' }>;
    observaciones?: string;
  }): Promise<Debt> => {
    const now = getNowString();
    let debtId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `deb-${Date.now().toString().slice(-4)}`;

    try {
      const created = await api.createDebt({
        clienteId: data.clienteId,
        productoId: data.productoId,
        fechaAdquisicion: new Date(data.fechaAdquisicion).toISOString(),
        precioNominalAplicado: data.precioNominalAplicado,
        precioAcordado: data.precioAcordado,
        metodoPago: data.metodoPago ? data.metodoPago.toUpperCase() : undefined,
        plazoMeses: data.plazoMeses,
        diaCorte: data.diaCorte,
        observaciones: data.observaciones,
      });
      if (created?.id) {
        debtId = created.id;
      }
    } catch (e) {
      console.warn('Error sincronizando deuda con backend PostgreSQL:', e);
    }

    const newDebt: Debt = {
      id: debtId,
      clienteId: data.clienteId,
      productoId: data.productoId,
      fechaAdquisicion: data.fechaAdquisicion,
      fechaCompromisoPago: data.fechaCompromisoPago,
      diasMora: data.diasMora || 0,
      precioNominalAplicado: data.precioNominalAplicado,
      precioAcordado: data.precioAcordado,
      saldoInicial: data.precioAcordado,
      metodoPago: data.metodoPago,
      plazoMeses: data.plazoMeses,
      diaCorte: data.diaCorte,
      cuotas: data.cuotas,
      observaciones: data.observaciones,
      estado: 'pendiente',
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };

    setDebts((prev) => [newDebt, ...prev.filter((d) => d.id !== debtId)]);

    const client = clients.find((c) => c.id === data.clienteId);
    const product = products.find((p) => p.id === data.productoId);

    logAudit(
      'deudas',
      'crear',
      'deuda',
      debtId,
      undefined,
      {
        cliente: client ? `${client.nombres} ${client.apellidos}` : data.clienteId,
        producto: product ? product.nombre : data.productoId,
        precioNominal: data.precioNominalAplicado,
        precioAcordado: data.precioAcordado,
      },
      'Asociación directa de producto adquirido registrada en PostgreSQL'
    );

    return newDebt;
  };

  const importDebtsBulk = (
    items: Array<{
      clienteId: string;
      productoId: string;
      fechaAdquisicion: string;
      precioNominal: number;
      precioAcordado: number;
      observaciones?: string;
    }>
  ): number => {
    const now = getNowString();
    const newDebts: Debt[] = items.map((item, idx) => ({
      id: `deb-imp-${Date.now().toString().slice(-4)}-${idx}`,
      clienteId: item.clienteId,
      productoId: item.productoId,
      fechaAdquisicion: item.fechaAdquisicion || now.slice(0, 10),
      precioNominalAplicado: item.precioNominal,
      precioAcordado: item.precioAcordado,
      saldoInicial: item.precioAcordado,
      observaciones: item.observaciones,
      estado: 'pendiente',
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    }));

    setDebts((prev) => [...newDebts, ...prev]);
    // Sincronizar deudas con PostgreSQL
    items.forEach((item) => {
      api.createDebt({
        clienteId: item.clienteId,
        productoId: item.productoId,
        fechaAdquisicion: item.fechaAdquisicion || now.slice(0, 10),
        precioNominalAplicado: item.precioNominal,
        precioAcordado: item.precioAcordado,
        observaciones: item.observaciones,
      }).catch((e) => console.warn('Error sincronizando deuda importada con PostgreSQL:', e));
    });
    logAudit(
      'deudas',
      'importar',
      'deuda',
      `lote-${Date.now()}`,
      undefined,
      { cantidadDeudas: newDebts.length },
      `Carga masiva de ${newDebts.length} deudas a PostgreSQL`,
      'exitoso',
      'importacion'
    );
    return newDebts.length;
  };

  // --- PAYMENT OPERATIONS ---
  const registerPayment = async (
    paymentData: {
      deudaId: string;
      clienteId: string;
      monto: number;
      fechaPago: string;
      metodo: Payment['metodo'];
      bancoOrigen?: string;
      numeroTransaccion?: string;
      referencia?: string;
      observaciones?: string;
    },
    voucherData?: {
      nombreArchivo: string;
      tipoArchivo?: string;
      archivoUrl?: string;
      datosExtraidos?: ExtractedData;
    },
    initialDebt?: Debt,
    file?: File
  ): Promise<Payment> => {
    // 1. Strict validation against debt balance
    let fin = getDebtFinancials(paymentData.deudaId);
    if (!fin && initialDebt && initialDebt.id === paymentData.deudaId) {
      fin = {
        debt: initialDebt,
        client: clients.find((c) => c.id === initialDebt.clienteId),
        product: products.find((p) => p.id === initialDebt.productoId),
        validPaymentsTotal: 0,
        saldoPendiente: initialDebt.precioAcordado,
        calculatedStatus: 'pendiente',
      };
    }
    if (!fin) {
      throw new Error('La deuda seleccionada no existe en el sistema.');
    }
    if (paymentData.monto <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0.');
    }
    if (paymentData.monto > fin.saldoPendiente + 0.001) {
      throw new Error(
        `Regla de negocio: El monto ingresado ($${paymentData.monto.toFixed(2)}) excede el saldo pendiente ($${fin.saldoPendiente.toFixed(2)}) de esta adquisición. Los pagos superiores al saldo no están permitidos.`
      );
    }

    let paymentId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now().toString().slice(-5)}`;
    const now = getNowString();
    let voucherId: string | undefined = undefined;
    let finalComprobanteUrl: string | undefined = voucherData?.archivoUrl;

    // Create Voucher record if provided
    if (voucherData) {
      voucherId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `vouch-${Date.now().toString().slice(-5)}`;
      const newVoucher: Voucher = {
        id: voucherId,
        tipo: 'comprobante_pago',
        nombreArchivo: voucherData.nombreArchivo,
        tipoArchivo: voucherData.tipoArchivo || 'image/png',
        fechaCarga: now,
        entidadRelacionadaTipo: 'pago',
        entidadRelacionadaId: paymentId,
        archivoUrl: voucherData.archivoUrl,
        archivoDemoUrl: voucherData.archivoUrl,
        datosExtraidos: voucherData.datosExtraidos,
        estadoAnalisis: voucherData.datosExtraidos ? 'analizado' : 'no_analizado',
        createdBy: currentUser.username,
      };
      setVouchers((prev) => [newVoucher, ...prev]);
    }

    try {
      const created = await api.createPayment(
        {
          deudaId: paymentData.deudaId,
          clienteId: paymentData.clienteId,
          monto: paymentData.monto,
          fechaPago: new Date(paymentData.fechaPago).toISOString(),
          metodo: paymentData.metodo.toUpperCase(),
          bancoOrigen: paymentData.bancoOrigen,
          numeroTransaccion: paymentData.numeroTransaccion,
          referencia: paymentData.referencia,
          observaciones: paymentData.observaciones,
        },
        file
      );

      if (created?.id) {
        paymentId = created.id;
      }
      if (created?.comprobanteUrl) {
        finalComprobanteUrl = created.comprobanteUrl;
        if (voucherId) {
          setVouchers((prev) =>
            prev.map((v) =>
              v.id === voucherId
                ? {
                    ...v,
                    entidadRelacionadaId: created.id,
                    archivoUrl: created.comprobanteUrl,
                    archivoDemoUrl: created.comprobanteUrl,
                  }
                : v
            )
          );
        }
      }
    } catch (e) {
      console.warn('Error sincronizando pago con backend PostgreSQL:', e);
    }

    const newPayment: Payment = {
      id: paymentId,
      deudaId: paymentData.deudaId,
      clienteId: paymentData.clienteId,
      monto: paymentData.monto,
      fechaPago: paymentData.fechaPago,
      metodo: paymentData.metodo,
      bancoOrigen: paymentData.bancoOrigen,
      numeroTransaccion: paymentData.numeroTransaccion,
      referencia: paymentData.referencia,
      comprobanteId: voucherId || finalComprobanteUrl,
      comprobanteUrl: finalComprobanteUrl,
      estadoRegistro: 'registrado',
      estadoConciliacion: 'pendiente', // Independent reconciliation state
      observaciones: paymentData.observaciones,
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };

    setPayments((prev) => [newPayment, ...prev.filter((p) => p.id !== paymentId)]);

    // Recalcular estado de la deuda:
    // Al registrar el pago con comprobante, pasa a estado 'en_comprobacion'
    // La deuda no se extingue formalmente hasta la confirmación y conciliación bancaria
    const newRemaining = fin.saldoPendiente - paymentData.monto;
    const newStatus: Debt['estado'] = 'en_comprobacion';
    setDebts((prev) =>
      prev.map((d) => (d.id === paymentData.deudaId ? { ...d, estado: newStatus, updatedAt: now, updatedBy: currentUser.username } : d))
    );

    logAudit(
      'pagos',
      'crear',
      'pago',
      paymentId,
      undefined,
      {
        deudaId: paymentData.deudaId,
        cliente: fin.client ? `${fin.client.nombres} ${fin.client.apellidos}` : paymentData.clienteId,
        monto: paymentData.monto,
        metodo: paymentData.metodo,
        numeroTransaccion: paymentData.numeroTransaccion,
        comprobanteId: voucherId,
        nuevoSaldoDeuda: newRemaining,
      },
      'Registro de pago con comprobante adjunto y actualización de saldo en PostgreSQL'
    );

    return newPayment;
  };

  const cancelPayment = (paymentId: string, motivo: string) => {
    if (!motivo || motivo.trim().length < 5) {
      throw new Error('Debe proporcionar un motivo detallado para anular este pago.');
    }

    const existingPayment = payments.find((p) => p.id === paymentId);
    if (!existingPayment) throw new Error('Pago no encontrado.');
    if (existingPayment.estadoRegistro === 'anulado') throw new Error('El pago ya se encuentra anulado.');

    const now = getNowString();
    const updatedPayment: Payment = {
      ...existingPayment,
      estadoRegistro: 'anulado',
      motivoAnulacion: motivo,
      fechaAnulacion: now,
      anuladoPor: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };

    setPayments((prev) => prev.map((p) => (p.id === paymentId ? updatedPayment : p)));

    // Revert bank reconciliation if it was reconciled
    const existingRec = reconciliations.find((r) => r.pagoId === paymentId && r.estado === 'conciliado');
    if (existingRec) {
      setReconciliations((prev) =>
        prev.map((r) => (r.id === existingRec.id ? { ...r, estado: 'anulado', observacion: `Anulado por anulación de pago: ${motivo}` } : r))
      );
      setBankMovements((prev) =>
        prev.map((bm) => (bm.id === existingRec.movimientoBancarioId ? { ...bm, estado: 'sin_asignar', pagoRelacionadoId: undefined } : bm))
      );
    }

    // Recalculate debt state
    const debt = debts.find((d) => d.id === existingPayment.deudaId);
    if (debt) {
      // Re-sum remaining valid payments
      const otherPayments = payments.filter((p) => p.deudaId === debt.id && p.id !== paymentId && p.estadoRegistro !== 'anulado');
      const validTotal = otherPayments.reduce((s, p) => s + p.monto, 0);
      const remaining = debt.precioAcordado - validTotal;
      const newStatus: Debt['estado'] = remaining <= 0.001 ? 'pagada' : validTotal > 0 ? 'parcial' : 'pendiente';

      setDebts((prev) =>
        prev.map((d) => (d.id === debt.id ? { ...d, estado: newStatus, updatedAt: now, updatedBy: currentUser.username } : d))
      );
    }

    logAudit(
      'pagos',
      'anular',
      'pago',
      paymentId,
      { estadoRegistro: existingPayment.estadoRegistro, monto: existingPayment.monto },
      { estadoRegistro: 'anulado', motivoAnulacion: motivo },
      motivo,
      'exitoso',
      'interfaz',
      currentUser.username
    );
  };

  // --- VOUCHERS ---
  const getVoucherById = (voucherId: string) => vouchers.find((v) => v.id === voucherId);
  const getVouchersForPayment = (paymentId: string) => vouchers.filter((v) => v.entidadRelacionadaId === paymentId);

  // --- RECONCILIATION ENGINE ---
  const runAutoReconciliation = () => {
    let autoReconciled = 0;
    let diffFound = 0;
    let manualPending = 0;
    const now = getNowString();

    const currentReconciledMovements = new Set(
      reconciliations.filter((r) => r.estado === 'conciliado').map((r) => r.movimientoBancarioId)
    );

    const pendingPayments = payments.filter(
      (p) => p.estadoRegistro !== 'anulado' && (p.estadoConciliacion === 'pendiente' || p.estadoConciliacion === 'no_encontrado')
    );

    const availableMovements = bankMovements.filter(
      (bm) => bm.estado === 'sin_asignar' && !currentReconciledMovements.has(bm.id)
    );

    const updatedPayments = [...payments];
    const updatedMovements = [...bankMovements];
    const newReconciliations: Reconciliation[] = [];

    // Helper to normalize strings for matching
    const cleanStr = (s?: string) => s?.trim().toUpperCase() || '';

    pendingPayments.forEach((payment) => {
      if (!payment.numeroTransaccion) {
        manualPending++;
        return;
      }

      const pTx = cleanStr(payment.numeroTransaccion);
      const pBank = cleanStr(payment.bancoOrigen);

      // Search match in available movements by: Entidad + N° Transacción
      const matchedMovement = availableMovements.find((bm) => {
        if (currentReconciledMovements.has(bm.id)) return false;
        const txMatches = cleanStr(bm.numeroTransaccion) === pTx;
        const bmBank = cleanStr(bm.banco);
        const bankMatches = !pBank || !bmBank || bmBank === pBank || bmBank.includes(pBank) || pBank.includes(bmBank);
        return txMatches && bankMatches;
      });

      if (matchedMovement) {
        // Strict check: Transaction exact AND Amount coherent
        if (Math.abs(matchedMovement.monto - payment.monto) < 0.01) {
          // Inequivocal match: Auto reconcile!
          autoReconciled++;
          currentReconciledMovements.add(matchedMovement.id);

          const recId = `rec-auto-${Date.now()}-${autoReconciled}`;
          newReconciliations.push({
            id: recId,
            pagoId: payment.id,
            movimientoBancarioId: matchedMovement.id,
            tipo: 'automatica',
            estado: 'conciliado',
            reglaCoincidencia: `Coincidencia unívoca de transacción (${matchedMovement.numeroTransaccion}) y monto idéntico ($${matchedMovement.monto.toFixed(2)})`,
            fechaConciliacion: now,
            conciliadoPor: 'sistema_auto',
            createdAt: now,
          });

          // Update payment state
          const pIdx = updatedPayments.findIndex((p) => p.id === payment.id);
          if (pIdx >= 0) {
            updatedPayments[pIdx] = {
              ...updatedPayments[pIdx],
              estadoConciliacion: 'conciliado_auto',
              updatedAt: now,
              updatedBy: 'sistema_auto',
            };
          }

          // Update movement state
          const mIdx = updatedMovements.findIndex((m) => m.id === matchedMovement.id);
          if (mIdx >= 0) {
            updatedMovements[mIdx] = {
              ...updatedMovements[mIdx],
              estado: 'conciliado',
              pagoRelacionadoId: payment.id,
            };
          }
        } else {
          // Transaction matched but amount differed: Difference flagged!
          diffFound++;
          const pIdx = updatedPayments.findIndex((p) => p.id === payment.id);
          if (pIdx >= 0) {
            updatedPayments[pIdx] = {
              ...updatedPayments[pIdx],
              estadoConciliacion: 'con_diferencias',
              observaciones: `${updatedPayments[pIdx].observaciones || ''} [Diferencia detectada: Pago $${payment.monto.toFixed(2)} vs Banco $${matchedMovement.monto.toFixed(2)}]`,
              updatedAt: now,
            };
          }
          const mIdx = updatedMovements.findIndex((m) => m.id === matchedMovement.id);
          if (mIdx >= 0) {
            updatedMovements[mIdx] = {
              ...updatedMovements[mIdx],
              estado: 'revision',
              pagoRelacionadoId: payment.id,
            };
          }
        }
      } else {
        // No movement with exact transaction
        manualPending++;
      }
    });

    if (newReconciliations.length > 0) {
      setReconciliations((prev) => [...newReconciliations, ...prev]);
      // Actualizar el estado de las deudas cruzadas: pasan a pagadas o amortizadas
      const reconciledPaymentIds = new Set(newReconciliations.map((r) => r.pagoId));
      setDebts((prevDebts) =>
        prevDebts.map((debt) => {
          const debtPayments = updatedPayments.filter((p) => p.deudaId === debt.id && p.estadoRegistro !== 'anulado');
          const touchesDebt = debtPayments.some((p) => reconciledPaymentIds.has(p.id));
          if (!touchesDebt) return debt;

          const totalRec = debtPayments
            .filter((p) => p.estadoConciliacion === 'conciliado_auto' || p.estadoConciliacion === 'conciliado_manual')
            .reduce((sum, p) => sum + p.monto, 0);
          const hasPending = debtPayments.some((p) => p.estadoConciliacion === 'pendiente');
          const isFullyPaid = debt.precioAcordado - totalRec <= 0.001;
          const newStatus: Debt['estado'] = isFullyPaid ? 'pagada' : hasPending ? 'en_comprobacion' : 'parcial';
          return { ...debt, estado: newStatus, updatedAt: now, updatedBy: 'sistema_auto' };
        })
      );
    }
    setPayments(updatedPayments);
    setBankMovements(updatedMovements);

    logAudit(
      'conciliacion',
      'conciliar',
      'lote_conciliacion',
      `ejecucion-${Date.now()}`,
      undefined,
      {
        conciliadosAutomaticos: autoReconciled,
        diferenciasDetectadas: diffFound,
        pendientesRevisionManual: manualPending,
      },
      `Ejecución de conciliación bancaria automática con regla unívoca`,
      'exitoso',
      'simulacion',
      'sistema_auto',
      'Regla estricta: Número de transacción exacto + Coherencia de monto'
    );

    return { autoReconciled, diffFound, manualPending };
  };

  const reconcileManually = (paymentId: string, bankMovementId: string, observacion?: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    const movement = bankMovements.find((bm) => bm.id === bankMovementId);

    if (!payment || !movement) {
      throw new Error('Pago o movimiento bancario no encontrado.');
    }
    if (movement.estado === 'conciliado') {
      throw new Error('El movimiento bancario ya está conciliado con otro pago.');
    }

    const now = getNowString();
    const newRecId = `rec-man-${Date.now()}`;
    const newRec: Reconciliation = {
      id: newRecId,
      pagoId: paymentId,
      movimientoBancarioId: bankMovementId,
      tipo: 'manual',
      estado: 'conciliado',
      reglaCoincidencia: 'Asociación manual validada por el usuario',
      observacion: observacion || 'Conciliado manualmente tras verificación documental.',
      fechaConciliacion: now,
      conciliadoPor: currentUser.username,
      createdAt: now,
    };

    setReconciliations((prev) => [newRec, ...prev]);

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, estadoConciliacion: 'conciliado_manual', updatedAt: now, updatedBy: currentUser.username } : p))
    );

    setBankMovements((prev) =>
      prev.map((bm) => (bm.id === bankMovementId ? { ...bm, estado: 'conciliado', pagoRelacionadoId: paymentId } : bm))
    );

    // Actualizar estado de la deuda al conciliar manualmente: se marca como pagada o amortizada
    setDebts((prevDebts) =>
      prevDebts.map((debt) => {
        if (debt.id !== payment.deudaId) return debt;
        const otherPayments = payments.filter((p) => p.deudaId === debt.id && p.id !== paymentId && p.estadoRegistro !== 'anulado');
        const totalRec =
          payment.monto +
          otherPayments
            .filter((p) => p.estadoConciliacion === 'conciliado_auto' || p.estadoConciliacion === 'conciliado_manual')
            .reduce((sum, p) => sum + p.monto, 0);
        const hasPending = otherPayments.some((p) => p.estadoConciliacion === 'pendiente');
        const isFullyPaid = debt.precioAcordado - totalRec <= 0.001;
        const newStatus: Debt['estado'] = isFullyPaid ? 'pagada' : hasPending ? 'en_comprobacion' : 'parcial';
        return { ...debt, estado: newStatus, updatedAt: now, updatedBy: currentUser.username };
      })
    );

    logAudit(
      'conciliacion',
      'conciliar',
      'conciliacion',
      newRecId,
      undefined,
      {
        pagoId: paymentId,
        movimientoId: bankMovementId,
        montoPago: payment.monto,
        montoBanco: movement.monto,
        observacion,
      },
      observacion || 'Conciliación manual confirmada con motivo registrado',
      'exitoso',
      'interfaz',
      currentUser.username
    );
  };

  const undoReconciliation = (reconciliationId: string, motivo: string) => {
    if (!motivo || motivo.trim().length < 5) {
      throw new Error('Debe proporcionar una justificación para deshacer esta conciliación.');
    }

    const rec = reconciliations.find((r) => r.id === reconciliationId);
    if (!rec) throw new Error('Registro de conciliación no encontrado.');

    const now = getNowString();
    // Do not delete history! Mark as reversed
    setReconciliations((prev) =>
      prev.map((r) => (r.id === reconciliationId ? { ...r, estado: 'anulado', observacion: `Deshecha: ${motivo}` } : r))
    );

    setPayments((prev) =>
      prev.map((p) => (p.id === rec.pagoId ? { ...p, estadoConciliacion: 'pendiente', updatedAt: now, updatedBy: currentUser.username } : p))
    );

    setBankMovements((prev) =>
      prev.map((bm) => (bm.id === rec.movimientoBancarioId ? { ...bm, estado: 'sin_asignar', pagoRelacionadoId: undefined } : bm))
    );

    logAudit(
      'conciliacion',
      'deshacer_conciliacion',
      'conciliacion',
      reconciliationId,
      { estado: 'conciliado' },
      { estado: 'anulado', motivoReversion: motivo },
      motivo,
      'exitoso',
      'interfaz',
      currentUser.username
    );
  };

  const importBankMovements = (
    movements: Array<Omit<BankMovement, 'id' | 'estado' | 'archivoImportacionId'>>
  ): { inserted: number; duplicates: number } => {
    const importId = `imp-${Date.now().toString().slice(-4)}`;
    const existingTx = new Set(
      bankMovements.map((bm) => `${bm.banco.trim().toLowerCase()}_${bm.numeroTransaccion.trim().toUpperCase()}`)
    );

    let inserted = 0;
    let duplicates = 0;
    const itemsToAdd: BankMovement[] = [];

    movements.forEach((m, idx) => {
      const key = `${m.banco.trim().toLowerCase()}_${m.numeroTransaccion.trim().toUpperCase()}`;
      if (existingTx.has(key)) {
        duplicates++;
      } else {
        existingTx.add(key);
        inserted++;
        itemsToAdd.push({
          ...m,
          id: `bm-${Date.now().toString().slice(-4)}-${idx}`,
          archivoImportacionId: importId,
          estado: 'sin_asignar',
        });
      }
    });

    if (itemsToAdd.length > 0) {
      setBankMovements((prev) => [...prev, ...itemsToAdd]);
    }

    logAudit(
      'conciliacion',
      'importar',
      'archivo_bancario',
      importId,
      undefined,
      { inserted, duplicates, total: movements.length },
      `Importación de extracto bancario: ${inserted} registros nuevos insertados, ${duplicates} duplicados ignorados`,
      'exitoso',
      'importacion'
    );

    return { inserted, duplicates };
  };

  // --- INVOICE OPERATIONS ---
  const registerInvoice = (data: {
    clienteId: string;
    deudaId?: string;
    numeroFactura: string;
    fechaFactura: string;
    monto?: number;
    nombreArchivo?: string;
    observaciones?: string;
  }): Invoice => {
    const newId = `inv-${Date.now().toString().slice(-4)}`;
    const now = getNowString();
    const newInvoice: Invoice = {
      id: newId,
      clienteId: data.clienteId,
      deudaId: data.deudaId,
      numeroFactura: data.numeroFactura,
      fechaFactura: data.fechaFactura,
      monto: data.monto,
      archivoId: `doc-${newId}`,
      nombreArchivo: data.nombreArchivo || `Factura_${data.numeroFactura.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      estadoDocumental: 'registrada',
      observaciones: data.observaciones,
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    const client = clients.find((c) => c.id === data.clienteId);
    logAudit(
      'facturas',
      'cargar_archivo',
      'factura',
      newId,
      undefined,
      {
        numeroFactura: data.numeroFactura,
        cliente: client ? `${client.nombres} ${client.apellidos}` : data.clienteId,
        archivo: newInvoice.nombreArchivo,
      },
      'Registro documental de factura física/externa con archivo adjunto (sin emisión electrónica SRI)'
    );

    return newInvoice;
  };

  const updateInvoice = (id: string, data: Partial<Invoice>) => {
    const existing = invoices.find((inv) => inv.id === id);
    if (!existing) return;
    const now = getNowString();
    const updated = { ...existing, ...data, updatedAt: now, updatedBy: currentUser.username };

    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
    logAudit('facturas', 'modificar', 'factura', id, existing, updated, 'Actualización de datos o sustitución de archivo de factura');
  };

  // --- USERS & PERMISSIONS ---
  const addUser = (data: Omit<DemoUser, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): DemoUser => {
    const newId = `usr-${Date.now().toString().slice(-4)}`;
    const now = getNowString();
    const newUser: DemoUser = {
      ...data,
      id: newId,
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };
    setUsers((prev) => [...prev, newUser]);

    // Sincronizar en PostgreSQL mediante el backend
    const backendRole = data.perfilBase === 'Administrador' ? 'ADMIN'
      : data.perfilBase === 'Supervisor' ? 'SUPERVISOR'
      : data.perfilBase === 'Auditor' ? 'AUDITOR' : 'COBRADOR';

    api.createUser({
      username: data.username,
      email: `${data.username}@clearminds.com`,
      nombre: data.nombre,
      cargo: data.cargo,
      rol: backendRole,
      permisos: data.permisos,
      estado: data.estado === 'activo' ? 'ACTIVO' : 'INACTIVO',
    }).then((created) => {
      if (created?.id) {
        setUsers((prev) => prev.map((u) => u.username === data.username ? { ...u, id: created.id } : u));
      }
    }).catch((err) => {
      console.warn('No se pudo sincronizar usuario con backend:', err);
    });

    logAudit('usuarios', 'crear', 'usuario', newId, undefined, {
      username: newUser.username,
      nombre: newUser.nombre,
      cargo: newUser.cargo,
      perfilBase: newUser.perfilBase,
    }, 'Creación de nuevo usuario');
    return newUser;
  };

  const updateUser = (id: string, data: Partial<DemoUser>) => {
    const existing = users.find((u) => u.id === id);
    if (!existing) return;
    const now = getNowString();
    const updated = { ...existing, ...data, updatedAt: now, updatedBy: currentUser.username };
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));

    if (id && id.length > 15) {
      const backendRole = data.perfilBase === 'Administrador' ? 'ADMIN'
        : data.perfilBase === 'Supervisor' ? 'SUPERVISOR'
        : data.perfilBase === 'Auditor' ? 'AUDITOR'
        : data.perfilBase ? 'COBRADOR' : undefined;

      api.updateUser(id, {
        nombre: data.nombre,
        cargo: data.cargo,
        rol: backendRole,
        estado: data.estado ? (data.estado === 'activo' ? 'ACTIVO' : 'INACTIVO') : undefined,
        permisos: data.permisos,
      }).catch((err) => {
        console.warn('No se pudo actualizar usuario en backend:', err);
      });
    }

    logAudit('usuarios', 'modificar', 'usuario', id, existing, updated, 'Modificación de perfil de usuario');
  };

  const updateUserPermissions = (userId: string, newPermissions: UserPermissions, motivo?: string) => {
    const existing = users.find((u) => u.id === userId);
    if (!existing) return;
    const now = getNowString();
    const updated = {
      ...existing,
      permisos: newPermissions,
      updatedAt: now,
      updatedBy: currentUser.username,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));

    if (userId && userId.length > 15) {
      api.updateUser(userId, { permisos: newPermissions }).catch((err) => {
        console.warn('No se pudo actualizar permisos en backend:', err);
      });
    }

    logAudit(
      'usuarios',
      'cambiar_permisos',
      'usuario',
      userId,
      { permisosPrevios: existing.permisos },
      { permisosNuevos: newPermissions },
      motivo || `Configuración personalizada de permisos para ${existing.nombre} (${existing.username})`,
      'exitoso',
      'interfaz',
      currentUser.username
    );
  };

  // --- CSV EXPORT UTILITY ---
  const exportToCSV = (filename: string, headers: string[], rows: (string | number | undefined | null)[][]) => {
    // Generate CSV content with UTF-8 BOM for clean Excel display
    const escapeCell = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCell).join(',');
    const bodyLines = rows.map((row) => row.map(escapeCell).join(','));
    const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename.replace(/\.csv$/, '')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAudit(
      'reportes',
      'modificar',
      'reporte_csv',
      filename,
      undefined,
      { archivo: filename, totalFilas: rows.length },
      `Exportación de reporte a archivo CSV (${rows.length} filas)`,
      'exitoso',
      'interfaz'
    );
  };

  const exportToPDF = (
    title: string,
    headers: string[],
    rows: (string | number | undefined | null)[][],
    subtitle?: string
  ) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilite las ventanas emergentes (pop-ups) en su navegador para generar el PDF.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const headerHtml = headers
      .map(
        (h) =>
          `<th style="padding: 8px 10px; background: #0f172a; color: white; border: 1px solid #334155; font-size: 10px; text-transform: uppercase; font-weight: bold;">${h}</th>`
      )
      .join('');

    const rowsHtml = rows
      .map((r, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        const cells = r
          .map(
            (c) =>
              `<td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 10px; color: #1e293b;">${
                c !== undefined && c !== null ? c : '-'
              }</td>`
          )
          .join('');
        return `<tr style="background: ${bg};">${cells}</tr>`;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} - CMC Cobranzas</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 16px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 14px; }
          .title { font-size: 16px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 3px; }
          .meta { text-align: right; font-size: 10px; color: #64748b; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          .footer { margin-top: 16px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${title}</div>
            <div class="subtitle">${subtitle || 'Reporte oficial generado por CMC Cobranzas'}</div>
          </div>
          <div class="meta">
            <div><strong>Clear Minds Cobranzas</strong></div>
            <div>Fecha: ${todayStr}</div>
            <div>Total: ${rows.length} registros</div>
          </div>
        </div>
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="footer">
          Documento confidencial generado para control interno - CMC Cobranzas
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    logAudit(
      'reportes',
      'modificar',
      'reporte_pdf',
      title,
      undefined,
      { reporte: title, totalFilas: rows.length },
      `Exportación de reporte a archivo PDF (${rows.length} filas)`,
      'exitoso',
      'interfaz'
    );
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        products,
        debts,
        payments,
        vouchers,
        bankMovements,
        reconciliations,
        invoices,
        users,
        auditLogs,
        currentUserId,
        currentUser,
        isNavPinned,
        setIsNavPinned,
        isAuthenticated,
        isLoadingAuth,
        login,
        logout,
        setCurrentUserId,
        resetToDemoData,
        hasPermission,
        logAudit,
        addClient,
        updateClient,
        toggleClientStatus,
        importClientsBulk,
        addProduct,
        updateProduct,
        addDebt,
        importDebtsBulk,
        getDebtFinancials,
        getClientFinancials,
        registerPayment,
        cancelPayment,
        getVoucherById,
        getVouchersForPayment,
        runAutoReconciliation,
        reconcileManually,
        undoReconciliation,
        importBankMovements,
        registerInvoice,
        updateInvoice,
        addUser,
        updateUser,
        updateUserPermissions,
        exportToCSV,
        exportToPDF,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
