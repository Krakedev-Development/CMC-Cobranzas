// Types for Cobranzas, Conciliación Bancaria y Trazabilidad

export type ClientStatus = 'activo' | 'inactivo';

export interface Client {
  id: string;
  cedula: string; // Obligatoria (ficticia en demo)
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  estado: ClientStatus;
  notas?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type ProductStatus = 'activo' | 'inactivo';

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precioNominal: number;
  estado: ProductStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type DebtStatus = 'pendiente' | 'parcial' | 'pagada' | 'anulada';

export interface Debt {
  id: string;
  clienteId: string;
  productoId: string;
  fechaAdquisicion: string;
  precioNominalAplicado: number;
  precioAcordado: number; // Valor final acordado
  saldoInicial: number;
  metodoPago?: PaymentMethod;
  plazoMeses?: number; // Número de meses a diferir (ej: 1, 3, 6, 9, 12)
  diaCorte?: number; // Día del mes para fecha límite de pago (ej: 5, 10, 15, 20, 25, 30)
  cuotas?: Array<{
    numero: number;
    monto: number;
    fechaVencimiento: string;
    estado: 'pendiente' | 'pagada' | 'vencida';
  }>;
  observaciones?: string;
  estado: DebtStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type PaymentMethod = 'transferencia' | 'efectivo' | 'tarjeta' | 'deposito' | 'otro';
export type PaymentRegisterStatus = 'registrado' | 'pendiente_revision' | 'anulado';
export type ReconciliationStatus =
  | 'pendiente'
  | 'conciliado_auto'
  | 'revision_manual'
  | 'conciliado_manual'
  | 'no_encontrado'
  | 'con_diferencias';

export interface Payment {
  id: string;
  deudaId: string;
  clienteId: string;
  monto: number;
  fechaPago: string;
  metodo: PaymentMethod;
  bancoOrigen?: string;
  numeroTransaccion?: string;
  referencia?: string;
  comprobanteId?: string;
  estadoRegistro: PaymentRegisterStatus;
  estadoConciliacion: ReconciliationStatus;
  observaciones?: string;
  motivoAnulacion?: string;
  fechaAnulacion?: string;
  anuladoPor?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type VoucherType = 'comprobante_pago' | 'factura' | 'otro';
export type AnalysisStatus = 'no_analizado' | 'analizado' | 'revision_requerida';

export interface ExtractedData {
  ordenante?: string;
  fecha?: string;
  monto?: number;
  numeroTransaccion?: string;
  banco?: string;
  referencia?: string;
  confianza: number; // 0 a 100
  camposDudosos?: string[];
}

export interface Voucher {
  id: string;
  tipo: VoucherType;
  nombreArchivo: string;
  tipoArchivo: string; // 'image/jpeg' | 'image/png' | 'application/pdf'
  fechaCarga: string;
  entidadRelacionadaTipo: 'pago' | 'factura' | 'cliente';
  entidadRelacionadaId: string;
  archivoDemoUrl?: string;
  datosExtraidos?: ExtractedData;
  estadoAnalisis: AnalysisStatus;
  createdBy: string;
}

export type BankMovementStatus = 'sin_asignar' | 'conciliado' | 'duplicado' | 'revision';

export interface BankMovement {
  id: string;
  fecha: string;
  monto: number;
  numeroTransaccion: string;
  referencia: string;
  ordenante: string;
  banco: string;
  archivoImportacionId: string;
  estado: BankMovementStatus;
  pagoRelacionadoId?: string;
}

export interface Reconciliation {
  id: string;
  pagoId: string;
  movimientoBancarioId: string;
  tipo: 'automatica' | 'manual';
  estado: 'conciliado' | 'anulado';
  reglaCoincidencia: string;
  observacion?: string;
  fechaConciliacion: string;
  conciliadoPor: string;
  createdAt: string;
}

export type InvoiceDocumentStatus = 'pendiente_registrar' | 'registrada';

export interface Invoice {
  id: string;
  clienteId: string;
  deudaId?: string;
  numeroFactura: string;
  fechaFactura: string;
  monto?: number;
  archivoId?: string;
  nombreArchivo?: string;
  estadoDocumental: InvoiceDocumentStatus;
  observaciones?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PermissionSet {
  ver: boolean;
  crear: boolean;
  modificar: boolean;
  eliminar: boolean;
  aprobar: boolean; // Para conciliaciones, anulaciones
  exportar: boolean;
}

export type ModuleName =
  | 'dashboard'
  | 'clientes'
  | 'productos'
  | 'deudas'
  | 'pagos'
  | 'conciliacion'
  | 'facturas'
  | 'reportes'
  | 'usuarios'
  | 'auditoria';

export type UserPermissions = Record<ModuleName, PermissionSet>;

export interface DemoUser {
  id: string;
  username: string;
  nombre: string;
  cargo: string;
  estado: 'activo' | 'inactivo';
  perfilBase?: string;
  permisos: UserPermissions;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type AuditAction =
  | 'crear'
  | 'modificar'
  | 'anular'
  | 'aprobar'
  | 'importar'
  | 'conciliar'
  | 'deshacer_conciliacion'
  | 'cargar_archivo'
  | 'sustituir_archivo'
  | 'cambiar_permisos'
  | 'restaurar_demo'
  | 'rechazado';

export interface AuditLog {
  id: string;
  fechaHora: string;
  usuarioId: string;
  usuarioNombre: string;
  modulo: ModuleName | string;
  accion: AuditAction;
  entidadTipo: string;
  entidadId: string;
  resultado: 'exitoso' | 'rechazado' | 'fallido';
  valoresAnteriores?: Record<string, any>;
  valoresNuevos?: Record<string, any>;
  motivo?: string;
  aprobadorId?: string;
  reglaEjecutada?: string;
  origen: 'interfaz' | 'importacion' | 'simulacion';
}
