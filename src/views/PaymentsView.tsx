import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Payment, Client, Debt, Voucher, ExtractedData } from '../types';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Eye,
  Ban,
  FileText,
  DollarSign,
  Scan,
  Sparkles,
  ShieldAlert,
  Banknote,
  ArrowLeftRight,
  X,
  Landmark,
} from 'lucide-react';

import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';
import { DatePicker } from '../components/common/DatePicker';

interface PaymentsViewProps {
  onViewVoucher: (payment: Payment) => void;
  preselectedClientId?: string | null;
  preselectedDebtId?: string | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onViewVoucher,
  preselectedClientId,
  preselectedDebtId,
}) => {
  const {
    payments,
    clients,
    debts,
    products,
    registerPayment,
    cancelPayment,
    getDebtFinancials,
    hasPermission,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [reconciliationFilter, setReconciliationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Register Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(
    Boolean(preselectedClientId || preselectedDebtId)
  );

  // Form state
  const [formClientId, setFormClientId] = useState(preselectedClientId || '');
  const [formDebtId, setFormDebtId] = useState(preselectedDebtId || '');
  const [formMonto, setFormMonto] = useState<string>('');
  const [formFecha, setFormFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formMetodo, setFormMetodo] = useState<Payment['metodo']>('transferencia');
  const [formBanco, setFormBanco] = useState<string>('Banco Pichincha');
  const [formTransaccion, setFormTransaccion] = useState<string>('');
  const [formReferencia, setFormReferencia] = useState<string>('');
  const [formObservaciones, setFormObservaciones] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // OCR simulation state
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrStepText, setOcrStepText] = useState<string>('');
  const [ocrExtractedData, setOcrExtractedData] = useState<ExtractedData | null>(null);

  // Cancel Payment Modal state
  const [paymentToCancel, setPaymentToCancel] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string>('');

  const canCreate = hasPermission('pagos', 'crear');
  const canApprove = hasPermission('pagos', 'aprobar');

  // Debts available for selected client
  const clientDebts = useMemo(() => {
    if (!formClientId) return [];
    return debts.filter((d) => d.clienteId === formClientId && d.estado !== 'anulada');
  }, [formClientId, debts]);

  // Selected debt financial info for real-time validation display
  const selectedDebtFinancials = useMemo(() => {
    if (!formDebtId) return null;
    return getDebtFinancials(formDebtId);
  }, [formDebtId, getDebtFinancials, debts, payments]);

  // Pagination state (15, 20, 25)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const client = clients.find((c) => c.id === payment.clienteId);
      const matchesSearch =
        client?.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client?.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.numeroTransaccion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.bancoOrigen?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRec =
        reconciliationFilter === 'all' || payment.estadoConciliacion === reconciliationFilter;
      const matchesStatus =
        statusFilter === 'all' || payment.estadoRegistro === statusFilter;
      const matchesMethod =
        methodFilter === 'all' || payment.metodo === methodFilter;

      return matchesSearch && matchesRec && matchesStatus && matchesMethod;
    });
  }, [payments, clients, searchQuery, reconciliationFilter, statusFilter, methodFilter]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, currentPage, pageSize]);


  // OCR Demo Simulator Handler
  const handleSimulateOCR = () => {
    setIsOcrScanning(true);
    setOcrStepText('Cargando archivo de comprobante demo...');

    setTimeout(() => {
      setOcrStepText('Analizando diseño y extrayendo campos clave (Simulación)...');
    }, 600);

    setTimeout(() => {
      const client = clients.find((c) => c.id === formClientId);
      const clientName = client ? `${client.nombres} ${client.apellidos}`.toUpperCase() : 'CARLOS MENDOZA VITERI';
      const maxMonto = selectedDebtFinancials?.saldoPendiente || 100;
      const generatedAmount = Math.min(maxMonto, maxMonto > 150 ? 150 : maxMonto);
      const randomTx = `TX-${Math.floor(100000 + Math.random() * 900000)}`;

      const extracted: ExtractedData = {
        banco: formBanco || 'Banco Pichincha',
        numeroTransaccion: randomTx,
        monto: generatedAmount,
        fecha: new Date().toISOString().slice(0, 10),
        ordenante: clientName,
        referencia: `Matrícula educación ${client?.apellidos || 'Mendoza'}`,
        confianza: 96,
        camposDudosos: [],
      };

      setOcrExtractedData(extracted);
      setFormTransaccion(extracted.numeroTransaccion || '');
      setFormMonto(extracted.monto?.toString() || '');
      setFormReferencia(extracted.referencia || '');
      setFormFecha(extracted.fecha || '');
      setAttachedFileName(`Comprobante_Pago_${randomTx}.png`);
      setIsOcrScanning(false);
      setOcrStepText('');
    }, 1300);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formDebtId || !formClientId) {
      setFormError('Debe seleccionar cliente y programa/deuda.');
      return;
    }

    const montoNum = parseFloat(formMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setFormError('El monto debe ser un número válido mayor a 0.');
      return;
    }

    if (selectedDebtFinancials && montoNum > selectedDebtFinancials.saldoPendiente + 0.001) {
      setFormError(
        `Regla de negocio: El monto ingresado ($${montoNum.toFixed(2)}) supera el saldo pendiente ($${selectedDebtFinancials.saldoPendiente.toFixed(2)}) de esta adquisición.`
      );
      return;
    }

    try {
      registerPayment(
        {
          deudaId: formDebtId,
          clienteId: formClientId,
          monto: montoNum,
          fechaPago: formFecha,
          metodo: formMetodo,
          bancoOrigen: formBanco,
          numeroTransaccion: formTransaccion.trim() || undefined,
          referencia: formReferencia.trim() || undefined,
          observaciones: formObservaciones.trim() || undefined,
        },
        attachedFileName
          ? {
              nombreArchivo: attachedFileName,
              tipoArchivo: 'image/png',
              datosExtraidos: ocrExtractedData || undefined,
            }
          : undefined
      );

      setIsRegisterModalOpen(false);
      setFormClientId('');
      setFormDebtId('');
      setFormMonto('');
      setFormTransaccion('');
      setFormReferencia('');
      setFormObservaciones('');
      setAttachedFileName('');
      setOcrExtractedData(null);
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar pago');
    }
  };

  const handleConfirmCancelPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCancelError('');

    if (!paymentToCancel) return;
    if (!cancelReason || cancelReason.trim().length < 5) {
      setCancelError('Debe ingresar un motivo detallado de anulación (mínimo 5 caracteres).');
      return;
    }

    try {
      cancelPayment(paymentToCancel.id, cancelReason.trim());
      setPaymentToCancel(null);
      setCancelReason('');
    } catch (err: any) {
      setCancelError(err.message || 'Error al anular pago');
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule Notification Bar */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
        <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Regla de Cobranzas (RF-03):</strong> Cada pago se aplica a una deuda/producto específico
          y recalcula el saldo en tiempo real (<code>Saldo = Precio Acordado − Pagos válidos</code>).
          Los pagos mayores al saldo están bloqueados. Registrar un pago no equivale a conciliarlo.
        </div>
      </div>

      {/* Top Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, transacción o banco..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters and New Payment Button */}
        {/* Reconciliation & Status Custom Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            options={[
              { value: 'all', label: 'Todos los Métodos' },
              { value: 'transferencia', label: 'Transferencia' },
              { value: 'efectivo', label: 'Efectivo' },
              { value: 'tarjeta', label: 'Tarjeta' },
              { value: 'deposito', label: 'Depósito' },
            ]}
            value={methodFilter}
            onChange={(val) => {
              setMethodFilter(val);
              setCurrentPage(1);
            }}
            className="w-44"
          />

          <CustomSelect
            options={[
              { value: 'all', label: 'Toda Conciliación' },
              { value: 'conciliado_auto', label: 'Conciliado Automático' },
              { value: 'conciliado_manual', label: 'Conciliado Manual' },
              { value: 'pendiente', label: 'Pendiente de Conciliar' },
              { value: 'con_diferencias', label: 'Con Diferencias' },
              { value: 'revision_manual', label: 'Revisión Manual' },
              { value: 'no_encontrado', label: 'No Encontrado en Banco' },
            ]}
            value={reconciliationFilter}
            onChange={(val) => {
              setReconciliationFilter(val);
              setCurrentPage(1);
            }}
            className="w-48"
          />

          <CustomSelect
            options={[
              { value: 'all', label: 'Todos los Registros' },
              { value: 'registrado', label: 'Registrados Válidos' },
              { value: 'anulado', label: 'Anulados' },
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            className="w-44"
          />


          {canCreate && (
            <button
              onClick={() => {
                setFormClientId('');
                setFormDebtId('');
                setFormMonto('');
                setFormTransaccion('');
                setFormReferencia('');
                setFormObservaciones('');
                setAttachedFileName('');
                setOcrExtractedData(null);
                setFormError('');
                setIsRegisterModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Pago (Flujo B)</span>
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <span className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredPayments.length}</strong> pagos registrados
          </span>
          <span className="text-[11px] text-slate-400">
            Los pagos anulados no restan saldo a las deudas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ID / Fecha</th>
                <th className="py-3 px-4">Alumno / Cliente</th>
                <th className="py-3 px-4">Monto ($)</th>
                <th className="py-3 px-4">Método / Banco</th>
                <th className="py-3 px-4">No. Transacción</th>
                <th className="py-3 px-4">Estado Registro</th>
                <th className="py-3 px-4">Conciliación</th>
                <th className="py-3 px-4 text-right">Comprobante / Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayments.map((p) => {
                const client = clients.find((c) => c.id === p.clienteId);
                const debt = debts.find((d) => d.id === p.deudaId);
                const prod = products.find((pr) => pr.id === debt?.productoId);

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      p.estadoRegistro === 'anulado' ? 'bg-rose-50/30 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{p.fechaPago}</span>
                      <span className="font-mono text-[11px] text-slate-400">{p.id}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">
                        {client ? `${client.nombres} ${client.apellidos}` : p.clienteId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {prod?.nombre || 'Deuda ' + p.deudaId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums text-sm whitespace-nowrap">
                      ${p.monto.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {p.metodo === 'transferencia' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowLeftRight className="w-3 h-3" />
                            Transferencia
                          </span>
                        )}
                        {p.metodo === 'efectivo' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Banknote className="w-3 h-3" />
                            Efectivo
                          </span>
                        )}
                        {p.metodo === 'tarjeta' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <CreditCard className="w-3 h-3" />
                            Tarjeta
                          </span>
                        )}
                        {p.metodo === 'deposito' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Landmark className="w-3 h-3" />
                            Depósito
                          </span>
                        )}
                        {p.metodo !== 'transferencia' && p.metodo !== 'efectivo' && p.metodo !== 'tarjeta' && p.metodo !== 'deposito' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                            {p.metodo}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">{p.bancoOrigen || 'S/D'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {p.numeroTransaccion || <span className="text-slate-400">Sin TX</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.estadoRegistro === 'registrado' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          Válido
                        </span>
                      ) : (
                        <div>
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-200 block w-max">
                            Anulado
                          </span>
                          {p.motivoAnulacion && (
                            <span className="text-[10px] text-rose-600 block max-w-xs truncate mt-0.5">
                              {p.motivoAnulacion}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.estadoConciliacion === 'conciliado_auto' && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          Conciliado Auto
                        </span>
                      )}
                      {p.estadoConciliacion === 'conciliado_manual' && (
                        <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-indigo-200">
                          Conciliado Manual
                        </span>
                      )}
                      {p.estadoConciliacion === 'pendiente' && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                          Pendiente
                        </span>
                      )}
                      {p.estadoConciliacion === 'con_diferencias' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-200">
                          Diferencia en Banco
                        </span>
                      )}
                      {p.estadoConciliacion === 'no_encontrado' && (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          No Encontrado
                        </span>
                      )}
                      {p.estadoConciliacion === 'revision_manual' && (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                          Revisión Manual
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.comprobanteId ? (
                          <button
                            onClick={() => onViewVoucher(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                            title="Abrir comprobante específico asociado"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Comprobante</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin archivo</span>
                        )}

                        {canApprove && p.estadoRegistro !== 'anulado' && (
                          <button
                            onClick={() => {
                              setPaymentToCancel(p);
                              setCancelReason('');
                              setCancelError('');
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Anular pago con motivo y conservar auditoría"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination (15, 20, 25) */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          pageSizeOptions={[15, 20, 25]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          className="rounded-b-2xl"
        />
      </div>

      {/* --- MODAL: REGISTRAR PAGO CON OCR SIMULADO (FLUJO B) --- */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Flujo B: Registrar Pago con Comprobante y OCR Simulado
                </h2>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRegisterSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Selection of Client and Debt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    1. Seleccionar Alumno / Cliente *
                  </label>
                  <select
                    required
                    value={formClientId}
                    onChange={(e) => {
                      setFormClientId(e.target.value);
                      setFormDebtId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Seleccionar Alumno --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombres} {c.apellidos} ({c.cedula})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. Seleccionar Deuda / Programa *
                  </label>
                  <select
                    required
                    value={formDebtId}
                    onChange={(e) => setFormDebtId(e.target.value)}
                    disabled={!formClientId}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">-- Seleccionar Programa Adquirido --</option>
                    {clientDebts.map((d) => {
                      const prod = products.find((pr) => pr.id === d.productoId);
                      const fin = getDebtFinancials(d.id);
                      return (
                        <option key={d.id} value={d.id}>
                          {prod?.nombre} (Saldo: ${(fin?.saldoPendiente || 0).toFixed(2)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Real-Time Debt Balance Card (RF-03 requirement) */}
              {selectedDebtFinancials && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Deuda Inicial Acordada</span>
                    <span className="text-sm font-bold text-slate-800 tabular-nums">
                      ${selectedDebtFinancials.debt.precioAcordado.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pagos Válidos Acumulados</span>
                    <span className="text-sm font-bold text-emerald-700 tabular-nums">
                      ${selectedDebtFinancials.validPaymentsTotal.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-700 font-semibold block">
                      Saldo Pendiente Máximo
                    </span>
                    <span className="text-base font-bold text-indigo-900 tabular-nums">
                      ${selectedDebtFinancials.saldoPendiente.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2: OCR Scanner Simulation Box (RF-04) */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Scan className="w-4 h-4 text-indigo-600" />
                    Adjuntar Comprobante y Escanear con OCR Simulado
                  </span>
                  <span className="text-[10px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded font-medium">
                    Simulación demostrativa (sin conexión AWS)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSimulateOCR}
                    disabled={isOcrScanning || !formClientId}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isOcrScanning ? 'Analizando...' : 'Escanear Comprobante Demo'}</span>
                  </button>

                  <div className="text-[11px] text-slate-500 flex-1">
                    {isOcrScanning ? (
                      <span className="text-indigo-600 font-semibold animate-pulse">
                        {ocrStepText}
                      </span>
                    ) : attachedFileName ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Archivo escaneado:{' '}
                        <strong>{attachedFileName}</strong>
                      </span>
                    ) : (
                      <span>
                        Carga un comprobante de muestra para autocompletar automáticamente los campos bancarios.
                      </span>
                    )}
                  </div>
                </div>

                {ocrExtractedData && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between">
                    <span>
                      ✓ Datos leídos con <strong>{ocrExtractedData.confianza}%</strong> de confianza.
                      Revisa y edita los campos antes de guardar.
                    </span>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monto a Pagar ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ej: 100.00"
                    value={formMonto}
                    onChange={(e) => setFormMonto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {selectedDebtFinancials && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Máximo permitido para esta deuda: ${selectedDebtFinancials.saldoPendiente.toFixed(2)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Pago *</label>
                  <DatePicker
                    required
                    value={formFecha}
                    onChange={(val) => setFormFecha(val)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Método de Pago *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormMetodo('transferencia');
                      setFormBanco('Banco Pichincha');
                      if (!formTransaccion || formTransaccion.startsWith('REC-') || formTransaccion.startsWith('AUTH-')) {
                        setFormTransaccion(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formMetodo === 'transferencia'
                        ? 'bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    <span>Transferencia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMetodo('efectivo');
                      setFormBanco('Caja Principal');
                      if (!formTransaccion || formTransaccion.startsWith('TX-') || formTransaccion.startsWith('AUTH-')) {
                        setFormTransaccion(`REC-${Math.floor(10000 + Math.random() * 90000)}`);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formMetodo === 'efectivo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMetodo('tarjeta');
                      setFormBanco('Visa (Datafast)');
                      if (!formTransaccion || formTransaccion.startsWith('TX-') || formTransaccion.startsWith('REC-')) {
                        setFormTransaccion(`AUTH-${Math.floor(100000 + Math.random() * 900000)}`);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formMetodo === 'tarjeta'
                        ? 'bg-purple-50 text-purple-700 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMetodo('deposito');
                      setFormBanco('Banco Pichincha');
                      if (!formTransaccion || formTransaccion.startsWith('TX-') || formTransaccion.startsWith('REC-') || formTransaccion.startsWith('AUTH-')) {
                        setFormTransaccion(`DEP-${Math.floor(100000 + Math.random() * 900000)}`);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      formMetodo === 'deposito'
                        ? 'bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-amber-600" />
                    <span>Depósito</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {formMetodo === 'efectivo'
                      ? 'Caja / Punto de Cobro'
                      : formMetodo === 'tarjeta'
                      ? 'Red / Terminal'
                      : 'Banco Origen / Entidad'}
                  </label>
                  {formMetodo === 'efectivo' ? (
                    <select
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Caja Principal (Campus Matriz)">Caja Principal (Campus Matriz)</option>
                      <option value="Caja Ventanilla 1">Caja Ventanilla 1</option>
                      <option value="Caja Campus Norte">Caja Campus Norte</option>
                      <option value="Caja Campus Sur">Caja Campus Sur</option>
                    </select>
                  ) : formMetodo === 'tarjeta' ? (
                    <select
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Visa (Datafast)">Visa (Datafast)</option>
                      <option value="Mastercard (Datafast)">Mastercard (Datafast)</option>
                      <option value="Visa (Medianet)">Visa (Medianet)</option>
                      <option value="Mastercard (Medianet)">Mastercard (Medianet)</option>
                      <option value="Diners Club">Diners Club</option>
                      <option value="American Express">American Express</option>
                      <option value="Tarjeta Débito (Datafast)">Tarjeta Débito (Datafast)</option>
                    </select>
                  ) : (
                    <select
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Banco Pichincha">Banco Pichincha</option>
                      <option value="Banco Guayaquil">Banco Guayaquil</option>
                      <option value="Produbanco">Produbanco</option>
                      <option value="Banco Internacional">Banco Internacional</option>
                      <option value="Banco del Pacífico">Banco del Pacífico</option>
                      <option value="Cooperativa JEP">Cooperativa JEP</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {formMetodo === 'efectivo'
                      ? 'N° Recibo de Caja'
                      : formMetodo === 'tarjeta'
                      ? 'N° Autorización / Lote'
                      : 'N° Transacción / Comprobante'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      formMetodo === 'efectivo'
                        ? 'Ej: REC-00421'
                        : formMetodo === 'tarjeta'
                        ? 'Ej: AUTH-882190'
                        : 'Ej: TX-984721'
                    }
                    value={formTransaccion}
                    onChange={(e) => setFormTransaccion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Referencia / Detalle</label>
                <input
                  type="text"
                  placeholder="Detalle según comprobante..."
                  value={formReferencia}
                  onChange={(e) => setFormReferencia(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de recepción..."
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Confirmar Pago y Actualizar Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ANULACIÓN DE PAGO CON MOTIVO OBLIGATORIO --- */}
      {paymentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900">Anular Pago Registrado</h2>
              </div>
              <button
                onClick={() => setPaymentToCancel(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancelPayment} className="p-5 space-y-3.5 text-xs">
              {cancelError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <p className="text-slate-600">
                Está a punto de anular el pago <strong>{paymentToCancel.id}</strong> por un valor de{' '}
                <strong className="text-slate-900">${paymentToCancel.monto.toFixed(2)}</strong>.
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                <strong>Efectos de la anulación:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>El saldo de la deuda se incrementará de nuevo por ${paymentToCancel.monto.toFixed(2)}.</li>
                  <li>Si estaba conciliado con un banco, la conciliación se revertirá.</li>
                  <li>El registro no se borrará: se conservará con su motivo en Auditoría.</li>
                </ul>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo obligatorio de anulación *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Indique con claridad la justificación (ej: comprobante duplicado, transferencia rechazada por el banco origen)..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentToCancel(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
