import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Client,
  Product,
  Debt,
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
} from '../data/mockData';

const STORAGE_KEY = 'cobranzas_conciliacion_proto_v1';

export interface DebtFinancialSummary {
  debt: Debt;
  client?: Client;
  product?: Product;
  validPaymentsTotal: number;
  saldoPendiente: number;
  calculatedStatus: 'pendiente' | 'parcial' | 'pagada' | 'anulada';
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
  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  toggleClientStatus: (id: string) => void;
  importClientsBulk: (newClients: Array<Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>>) => { imported: number; duplicates: number };

  // Products
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;

  // Debts
  addDebt: (data: { clienteId: string; productoId: string; fechaAdquisicion: string; precioNominalAplicado: number; precioAcordado: number; metodoPago?: PaymentMethod; plazoMeses?: number; diaCorte?: number; cuotas?: Array<{ numero: number; monto: number; fechaVencimiento: string; estado: 'pendiente' | 'pagada' | 'vencida' }>; observaciones?: string }) => Debt;
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
      datosExtraidos?: ExtractedData;
    }
  ) => Payment;
  cancelPayment: (paymentId: string, motivo: string) => void;

  // Vouchers
  getVoucherById: (voucherId: string) => Voucher | undefined;
  getVouchersForPayment: (paymentId: string) => Voucher[];

  // Reconciliation
  runAutoReconciliation: () => { autoReconciled: number; diffFound: number; manualPending: number };
  reconcileManually: (paymentId: string, bankMovementId: string, observacion?: string) => void;
  undoReconciliation: (reconciliationId: string, motivo: string) => void;
  importBankMovements: (movements: Array<Omit<BankMovement, 'id' | 'estado' | 'archivoImportacionId'>>) => number;

  // Invoices
  registerInvoice: (data: { clienteId: string; deudaId?: string; numeroFactura: string; fechaFactura: string; monto?: number; nombreArchivo?: string; observaciones?: string }) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;

  // Users & Permissions
  addUser: (data: Omit<DemoUser, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => DemoUser;
  updateUser: (id: string, data: Partial<DemoUser>) => void;
  updateUserPermissions: (userId: string, permissions: UserPermissions, motivo?: string) => void;

  // Utility
  exportToCSV: (filename: string, headers: string[], rows: (string | number | undefined | null)[][]) => void;
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

  // Reset to initial demo data
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
      usuarioNombre: 'Administrador Principal',
      modulo: 'sistema',
      accion: 'restaurar_demo',
      entidadTipo: 'sistema',
      entidadId: 'demo-data-root',
      resultado: 'exitoso',
      motivo: 'Restauración confirmada del escenario inicial de demostración con relaciones coherentes.',
      origen: 'interfaz',
    };

    setAuditLogs([resetAuditLog, ...INITIAL_AUDIT_LOGS]);
  };

  // Permissions check
  const hasPermission = (module: ModuleName, action: keyof PermissionSet): boolean => {
    if (!currentUser || currentUser.estado === 'inactivo') return false;
    // Admin has verified full permissions
    if (currentUser.username === 'admin') {
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
  const addClient = (data: Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Client => {
    const newId = `cli-${Date.now().toString().slice(-4)}`;
    const now = getNowString();
    const newClient: Client = {
      ...data,
      id: newId,
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };
    setClients((prev) => [newClient, ...prev]);
    logAudit('clientes', 'crear', 'cliente', newId, undefined, {
      cedula: newClient.cedula,
      nombres: `${newClient.nombres} ${newClient.apellidos}`,
      telefono: newClient.telefono,
    }, 'Creación individual de cliente');
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    const existing = clients.find((c) => c.id === id);
    if (!existing) return;
    const now = getNowString();
    const updated = { ...existing, ...data, updatedAt: now, updatedBy: currentUser.username };

    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    logAudit('clientes', 'modificar', 'cliente', id, existing, updated, 'Actualización de datos de cliente');
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
      logAudit(
        'clientes',
        'importar',
        'cliente',
        `lote-${Date.now()}`,
        undefined,
        { importados: imported, duplicadosOmitidos: duplicates },
        `Importación masiva simulada de ${imported} clientes desde Excel/CSV`,
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
    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;
    const now = getNowString();
    const updated = { ...existing, ...data, updatedAt: now, updatedBy: currentUser.username };
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    logAudit('productos', 'modificar', 'producto', id, existing, updated, 'Modificación de producto');
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

    let calculatedStatus: Debt['estado'] = debt.estado;
    if (debt.estado !== 'anulada') {
      if (saldoPendiente <= 0.001) {
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
  const addDebt = (data: {
    clienteId: string;
    productoId: string;
    fechaAdquisicion: string;
    precioNominalAplicado: number;
    precioAcordado: number;
    metodoPago?: PaymentMethod;
    plazoMeses?: number;
    diaCorte?: number;
    cuotas?: Array<{ numero: number; monto: number; fechaVencimiento: string; estado: 'pendiente' | 'pagada' | 'vencida' }>;
    observaciones?: string;
  }): Debt => {
    const newId = `deb-${Date.now().toString().slice(-4)}`;
    const now = getNowString();
    const newDebt: Debt = {
      id: newId,
      clienteId: data.clienteId,
      productoId: data.productoId,
      fechaAdquisicion: data.fechaAdquisicion,
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

    setDebts((prev) => [newDebt, ...prev]);

    const client = clients.find((c) => c.id === data.clienteId);
    const product = products.find((p) => p.id === data.productoId);

    logAudit(
      'deudas',
      'crear',
      'deuda',
      newId,
      undefined,
      {
        cliente: client ? `${client.nombres} ${client.apellidos}` : data.clienteId,
        producto: product ? product.nombre : data.productoId,
        precioNominal: data.precioNominalAplicado,
        precioAcordado: data.precioAcordado,
      },
      'Asociación directa de producto adquirido (no genera factura contable automática)'
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
    logAudit(
      'deudas',
      'importar',
      'deuda',
      `lote-${Date.now()}`,
      undefined,
      { cantidadDeudas: newDebts.length },
      `Carga masiva de ${newDebts.length} deudas/adquisiciones desde Excel simulado`,
      'exitoso',
      'importacion'
    );
    return newDebts.length;
  };

  // --- PAYMENT OPERATIONS ---
  const registerPayment = (
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
      datosExtraidos?: ExtractedData;
    }
  ): Payment => {
    // 1. Strict validation against debt balance
    const fin = getDebtFinancials(paymentData.deudaId);
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

    const newPaymentId = `pay-${Date.now().toString().slice(-5)}`;
    const now = getNowString();
    let voucherId: string | undefined = undefined;

    // Create Voucher record if provided
    if (voucherData) {
      voucherId = `vouch-${Date.now().toString().slice(-5)}`;
      const newVoucher: Voucher = {
        id: voucherId,
        tipo: 'comprobante_pago',
        nombreArchivo: voucherData.nombreArchivo,
        tipoArchivo: voucherData.tipoArchivo || 'image/png',
        fechaCarga: now,
        entidadRelacionadaTipo: 'pago',
        entidadRelacionadaId: newPaymentId,
        archivoDemoUrl: `demo://vouchers/${voucherData.nombreArchivo}`,
        datosExtraidos: voucherData.datosExtraidos,
        estadoAnalisis: voucherData.datosExtraidos ? 'analizado' : 'no_analizado',
        createdBy: currentUser.username,
      };
      setVouchers((prev) => [newVoucher, ...prev]);
    }

    const newPayment: Payment = {
      id: newPaymentId,
      deudaId: paymentData.deudaId,
      clienteId: paymentData.clienteId,
      monto: paymentData.monto,
      fechaPago: paymentData.fechaPago,
      metodo: paymentData.metodo,
      bancoOrigen: paymentData.bancoOrigen,
      numeroTransaccion: paymentData.numeroTransaccion,
      referencia: paymentData.referencia,
      comprobanteId: voucherId,
      estadoRegistro: 'registrado',
      estadoConciliacion: 'pendiente', // Independent reconciliation state
      observaciones: paymentData.observaciones,
      createdAt: now,
      createdBy: currentUser.username,
      updatedAt: now,
      updatedBy: currentUser.username,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Recalculate debt status
    const newRemaining = fin.saldoPendiente - paymentData.monto;
    const newStatus: Debt['estado'] = newRemaining <= 0.001 ? 'pagada' : 'parcial';
    setDebts((prev) =>
      prev.map((d) => (d.id === paymentData.deudaId ? { ...d, estado: newStatus, updatedAt: now, updatedBy: currentUser.username } : d))
    );

    logAudit(
      'pagos',
      'crear',
      'pago',
      newPaymentId,
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
      'Registro de pago con comprobante adjunto y actualización de saldo'
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

      // Search exact transaction match in available movements
      const matchedMovement = availableMovements.find(
        (bm) => cleanStr(bm.numeroTransaccion) === pTx && !currentReconciledMovements.has(bm.id)
      );

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

  const importBankMovements = (movements: Array<Omit<BankMovement, 'id' | 'estado' | 'archivoImportacionId'>>): number => {
    const importId = `imp-${Date.now().toString().slice(-4)}`;
    const existingTx = new Set(bankMovements.map((bm) => bm.numeroTransaccion.trim().toUpperCase()));

    const newItems: BankMovement[] = movements.map((m, idx) => {
      const isDup = existingTx.has(m.numeroTransaccion.trim().toUpperCase());
      if (!isDup) existingTx.add(m.numeroTransaccion.trim().toUpperCase());
      return {
        ...m,
        id: `bm-${Date.now().toString().slice(-4)}-${idx}`,
        archivoImportacionId: importId,
        estado: isDup ? 'duplicado' : 'sin_asignar',
      };
    });

    setBankMovements((prev) => [...prev, ...newItems]);
    logAudit(
      'conciliacion',
      'importar',
      'archivo_bancario',
      importId,
      undefined,
      { totalMovimientos: newItems.length },
      `Importación de extracto bancario con ${newItems.length} registros`,
      'exitoso',
      'importacion'
    );
    return newItems.length;
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
    logAudit('usuarios', 'crear', 'usuario', newId, undefined, {
      username: newUser.username,
      nombre: newUser.nombre,
      cargo: newUser.cargo,
      perfilBase: newUser.perfilBase,
    }, 'Creación de nuevo usuario de demostración');
    return newUser;
  };

  const updateUser = (id: string, data: Partial<DemoUser>) => {
    const existing = users.find((u) => u.id === id);
    if (!existing) return;
    const now = getNowString();
    const updated = { ...existing, ...data, updatedAt: now, updatedBy: currentUser.username };
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
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
