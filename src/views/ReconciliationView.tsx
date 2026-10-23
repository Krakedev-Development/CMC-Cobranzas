import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Payment, BankMovement, Reconciliation, Debt, Client, Product } from '../types';
import {
  Scale,
  Sparkles,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Search,
  Eye,
  FileSpreadsheet,
  X,
  ShieldAlert,
  HelpCircle,
  Link,
  Unlink,
  CreditCard,
  Building,
  User,
  Check,
  Receipt,
  Layers,
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';

export const ReconciliationView: React.FC = () => {
  const {
    payments,
    bankMovements,
    reconciliations,
    clients,
    debts,
    products,
    getDebtFinancials,
    registerPayment,
    runAutoReconciliation,
    reconcileManually,
    undoReconciliation,
    importBankMovements,
    hasPermission,
    logAudit,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'manual' | 'banco'>('manual');

  // --- MANUAL RECONCILIATION TABLE STATE (TABLA DE TRANSFERENCIAS BANCARIAS) ---
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [bankStatusFilter, setBankStatusFilter] = useState('sin_asignar');
  const [bankNameFilter, setBankNameFilter] = useState('all');
  const [manualCurrentPage, setManualCurrentPage] = useState(1);
  const [manualPageSize, setManualPageSize] = useState(15);

  // --- EXTRACTO BANCARIO TABLA STATE ---
  const [statementSearchQuery, setStatementSearchQuery] = useState('');
  const [statementBankFilter, setStatementBankFilter] = useState('all');
  const [statementStatusFilter, setStatementStatusFilter] = useState('all');
  const [statementCurrentPage, setStatementCurrentPage] = useState(1);
  const [statementPageSize, setStatementPageSize] = useState(15);

  // Upload bank statement modal state & notifications
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const [uploadBankName, setUploadBankName] = useState('Banco Pichincha');
  const [selectedFileName, setSelectedFileName] = useState('');

  // Modal to Link a Transfer to a Rubro/Debt or Payment
  const [movementToLink, setMovementToLink] = useState<BankMovement | null>(null);
  const [linkTargetType, setLinkTargetType] = useState<'rubro' | 'pago'>('rubro');
  const [rubroSearchText, setRubroSearchText] = useState('');
  const [selectedDebtIdToLink, setSelectedDebtIdToLink] = useState<string | null>(null);
  const [selectedPaymentIdToLink, setSelectedPaymentIdToLink] = useState<string | null>(null);
  const [linkObservation, setLinkObservation] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccessMsg, setLinkSuccessMsg] = useState('');

  // Undo reconciliation modal
  const [undoRecItem, setUndoRecItem] = useState<Reconciliation | null>(null);
  const [undoReason, setUndoReason] = useState('');
  const [undoError, setUndoError] = useState('');

  // Template and import modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const canApprove = hasPermission('conciliacion', 'aprobar');
  const canModify = hasPermission('conciliacion', 'modificar');

  // Categorized counts
  const autoReconciledPayments = payments.filter((p) => p.estadoConciliacion === 'conciliado_auto');
  const manualReconciledPayments = payments.filter((p) => p.estadoConciliacion === 'conciliado_manual');
  const pendingPayments = payments.filter(
    (p) => p.estadoRegistro !== 'anulado' && (p.estadoConciliacion === 'pendiente' || p.estadoConciliacion === 'revision_manual')
  );
  const differencePayments = payments.filter((p) => p.estadoConciliacion === 'con_diferencias');
  const unassignedMovements = bankMovements.filter((m) => m.estado === 'sin_asignar');

  // Filtered bank transfers for manual reconciliation table
  const filteredTransfers = useMemo(() => {
    return bankMovements.filter((m) => {
      const matchSearch =
        m.numeroTransaccion.toLowerCase().includes(transferSearchQuery.toLowerCase()) ||
        m.ordenante.toLowerCase().includes(transferSearchQuery.toLowerCase()) ||
        m.referencia.toLowerCase().includes(transferSearchQuery.toLowerCase()) ||
        m.banco.toLowerCase().includes(transferSearchQuery.toLowerCase());

      const matchStatus = bankStatusFilter === 'all' || m.estado === bankStatusFilter;
      const matchBank = bankNameFilter === 'all' || m.banco === bankNameFilter;

      return matchSearch && matchStatus && matchBank;
    });
  }, [bankMovements, transferSearchQuery, bankStatusFilter, bankNameFilter]);

  const manualTotalPages = Math.ceil(filteredTransfers.length / manualPageSize) || 1;
  const paginatedTransfers = useMemo(() => {
    const startIndex = (manualCurrentPage - 1) * manualPageSize;
    return filteredTransfers.slice(startIndex, startIndex + manualPageSize);
  }, [filteredTransfers, manualCurrentPage, manualPageSize]);

  // Filtered bank movements for the full "Extracto Bancario" tab
  const filteredStatement = useMemo(() => {
    return bankMovements.filter((m) => {
      const matchSearch =
        !statementSearchQuery.trim() ||
        m.numeroTransaccion.toLowerCase().includes(statementSearchQuery.toLowerCase()) ||
        m.ordenante.toLowerCase().includes(statementSearchQuery.toLowerCase()) ||
        m.referencia.toLowerCase().includes(statementSearchQuery.toLowerCase()) ||
        m.banco.toLowerCase().includes(statementSearchQuery.toLowerCase());

      const matchBank = statementBankFilter === 'all' || m.banco === statementBankFilter;
      const matchStatus = statementStatusFilter === 'all' || m.estado === statementStatusFilter;

      return matchSearch && matchBank && matchStatus;
    });
  }, [bankMovements, statementSearchQuery, statementBankFilter, statementStatusFilter]);

  const statementTotalPages = Math.ceil(filteredStatement.length / statementPageSize) || 1;
  const paginatedStatement = useMemo(() => {
    const start = (statementCurrentPage - 1) * statementPageSize;
    return filteredStatement.slice(start, start + statementPageSize);
  }, [filteredStatement, statementCurrentPage, statementPageSize]);

  // Unique banks for filter
  const uniqueBanks = useMemo(() => {
    return Array.from(new Set(bankMovements.map((m) => m.banco)));
  }, [bankMovements]);

  // When opening linking modal for a transfer
  const handleOpenLinkModal = (movement: BankMovement) => {
    setMovementToLink(movement);
    setRubroSearchText('');
    setSelectedDebtIdToLink(null);
    setSelectedPaymentIdToLink(null);
    setLinkObservation(`Conciliación y enlace manual de transferencia ${movement.numeroTransaccion} (${movement.banco})`);
    setLinkError('');
    setLinkSuccessMsg('');

    // Pre-detection: check if there's an exact debt or payment candidate matching ordenante or amount
    const ord = movement.ordenante.toLowerCase();
    const matchingClient = clients.find(
      (c) =>
        ord.includes(c.apellidos.toLowerCase()) ||
        ord.includes(c.nombres.toLowerCase()) ||
        ord.includes(c.cedula)
    );

    if (matchingClient) {
      const clientDebts = debts.filter((d) => d.clienteId === matchingClient.id && d.estado !== 'anulada');
      if (clientDebts.length > 0) {
        setSelectedDebtIdToLink(clientDebts[0].id);
        setLinkTargetType('rubro');
        return;
      }
    }

    // Check matching pending payment by transaction or amount
    const matchingPay = payments.find(
      (p) =>
        p.estadoConciliacion !== 'conciliado_auto' &&
        p.estadoConciliacion !== 'conciliado_manual' &&
        p.estadoRegistro !== 'anulado' &&
        (p.numeroTransaccion === movement.numeroTransaccion || Math.abs(p.monto - movement.monto) < 0.01)
    );

    if (matchingPay) {
      setSelectedPaymentIdToLink(matchingPay.id);
      setLinkTargetType('pago');
    } else {
      setLinkTargetType('rubro');
    }
  };

  // Filtered debts / rubros for the link modal
  const candidateDebts = useMemo(() => {
    const query = rubroSearchText.toLowerCase().trim();
    return debts
      .filter((d) => d.estado !== 'anulada')
      .filter((d) => {
        if (!query) return true;
        const client = clients.find((c) => c.id === d.clienteId);
        const product = products.find((p) => p.id === d.productoId);
        return (
          client?.nombres.toLowerCase().includes(query) ||
          client?.apellidos.toLowerCase().includes(query) ||
          client?.cedula.includes(query) ||
          product?.nombre.toLowerCase().includes(query)
        );
      });
  }, [debts, clients, products, rubroSearchText]);

  // Filtered payments for the link modal
  const candidatePayments = useMemo(() => {
    const query = rubroSearchText.toLowerCase().trim();
    return payments
      .filter((p) => p.estadoRegistro !== 'anulado' && !p.estadoConciliacion.includes('conciliado'))
      .filter((p) => {
        if (!query) return true;
        const client = clients.find((c) => c.id === p.clienteId);
        return (
          client?.nombres.toLowerCase().includes(query) ||
          client?.apellidos.toLowerCase().includes(query) ||
          p.numeroTransaccion?.toLowerCase().includes(query)
        );
      });
  }, [payments, clients, rubroSearchText]);

  // Execute manual link
  const handleConfirmLink = () => {
    setLinkError('');
    if (!movementToLink) return;

    if (linkTargetType === 'rubro') {
      if (!selectedDebtIdToLink) {
        setLinkError('Debe seleccionar el rubro o deuda educativa al que se relaciona la transferencia.');
        return;
      }

      const targetDebt = debts.find((d) => d.id === selectedDebtIdToLink);
      if (!targetDebt) {
        setLinkError('Deuda no encontrada.');
        return;
      }

      try {
        // 1. Create and register the payment for this debt using the transfer's exact details
        const payment = registerPayment(
          {
            deudaId: targetDebt.id,
            clienteId: targetDebt.clienteId,
            monto: movementToLink.monto,
            fechaPago: movementToLink.fecha,
            metodo: 'transferencia',
            bancoOrigen: movementToLink.banco,
            numeroTransaccion: movementToLink.numeroTransaccion,
            referencia: movementToLink.referencia,
            observaciones: linkObservation || `Enlace manual de transferencia bancaria`,
          }
        );

        // 2. Reconcile the newly created payment with the bank movement
        reconcileManually(
          payment.id,
          movementToLink.id,
          linkObservation || `Enlazado y liquidado contra rubro de programa educativo ${targetDebt.id}`
        );

        setLinkSuccessMsg(`✓ Transferencia ${movementToLink.numeroTransaccion} enlazada exitosamente con el rubro del alumno.`);
        setTimeout(() => {
          setMovementToLink(null);
          setLinkSuccessMsg('');
        }, 1100);
      } catch (err: any) {
        setLinkError(err.message || 'Error al procesar el enlace.');
      }
    } else {
      // Link to an existing payment
      if (!selectedPaymentIdToLink) {
        setLinkError('Debe seleccionar el pago registrado a conciliar.');
        return;
      }

      try {
        reconcileManually(selectedPaymentIdToLink, movementToLink.id, linkObservation);
        setLinkSuccessMsg(`✓ Transferencia ${movementToLink.numeroTransaccion} conciliada con el pago registrado.`);
        setTimeout(() => {
          setMovementToLink(null);
          setLinkSuccessMsg('');
        }, 1100);
      } catch (err: any) {
        setLinkError(err.message || 'Error al conciliar.');
      }
    }
  };


  const handleConfirmUndo = (e: React.FormEvent) => {
    e.preventDefault();
    setUndoError('');

    if (!undoRecItem) return;
    if (!undoReason || undoReason.trim().length < 5) {
      setUndoError('Debe ingresar un motivo para deshacer la conciliación.');
      return;
    }

    try {
      undoReconciliation(undoRecItem.id, undoReason.trim());
      setUndoRecItem(null);
      setUndoReason('');
    } catch (err: any) {
      setUndoError(err.message || 'Error al deshacer conciliación');
    }
  };

  const handleLoadSampleBankFile = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newItems = [
      {
        fecha: new Date().toISOString().slice(0, 10),
        monto: 300,
        numeroTransaccion: `TX-${randomSuffix}-01`,
        referencia: 'TRANSF PACIFICO PAGO CUOTA SOFIA PAREDES',
        ordenante: 'SOFIA ANDREA PAREDES CARDENAS',
        banco: uploadBankName,
      },
      {
        fecha: new Date().toISOString().slice(0, 10),
        monto: 150,
        numeroTransaccion: `TX-${randomSuffix}-02`,
        referencia: 'DEPOSITO CAJERO AUTOMATICO VENTANILLA NORTE',
        ordenante: 'MATEO SEBASTIAN CEVALLOS ROMERO',
        banco: uploadBankName,
      },
      {
        fecha: new Date().toISOString().slice(0, 10),
        monto: 85,
        numeroTransaccion: `TX-${randomSuffix}-03`,
        referencia: 'TRANSFERENCIA BANCA VIRTUAL PAGO MATRICULA',
        ordenante: 'DEPOSITANTE POR IDENTIFICAR',
        banco: uploadBankName,
      },
    ];

    importBankMovements(newItems);
    setIsImportModalOpen(false);
    setActiveTab('manual');
    setBankStatusFilter('sin_asignar');
    setImportNotification(
      `✓ Extracto de ${uploadBankName} procesado exitosamente (${newItems.length} movimientos). Las transferencias no conciliadas se muestran a continuación en Conciliación Manual listas para enlazar a rubros.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-200/70 rounded-2xl border border-slate-300/60 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Link className="w-4 h-4 text-indigo-600" />
            <span>Conciliación Manual (No Conciliadas)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {unassignedMovements.length} por conciliar
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banco')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'banco'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Building className="w-4 h-4 text-slate-600" />
            <span>Extracto Bancario Completo ({bankMovements.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2">
          <button
            onClick={() => {
              setSelectedFileName('');
              setIsImportModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>+ Subir Archivo de Extracto</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONCILIACIÓN MANUAL - TABLA DE TRANSFERENCIAS Y ENLACE A RUBRO    */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          {/* Notification when bank file is uploaded */}
          {importNotification && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{importNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportNotification(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Informative Rule Note */}
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Conciliación Manual de Transferencias:</strong> A continuación se muestran los movimientos del extracto bancario
              que <strong>no pudieron ser conciliados automáticamente</strong>.
              Haz clic en cualquier fila o en <strong>&quot;Enlazar a Rubro&quot;</strong> para asociar la transferencia al rubro (cuota de programa/deuda) del alumno correspondiente.
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por No. transacción, ordenante o referencia..."
                value={transferSearchQuery}
                onChange={(e) => {
                  setTransferSearchQuery(e.target.value);
                  setManualCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'sin_asignar', label: 'Sin Asignar (Pendientes)' },
                  { value: 'revision', label: 'En Revisión / Dudosos' },
                  { value: 'conciliado', label: 'Conciliados' },
                ]}
                value={bankStatusFilter}
                onChange={(val) => {
                  setBankStatusFilter(val);
                  setManualCurrentPage(1);
                }}
                className="w-48"
              />

              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los bancos' },
                  ...uniqueBanks.map((b) => ({ value: b, label: b })),
                ]}
                value={bankNameFilter}
                onChange={(val) => {
                  setBankNameFilter(val);
                  setManualCurrentPage(1);
                }}
                className="w-44"
              />
            </div>
          </div>

          {/* Transfers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando <strong>{paginatedTransfers.length}</strong> de <strong>{filteredTransfers.length}</strong> transferencias bancarias
              </span>
              <span className="text-[11px] text-slate-400">
                Haz clic en una fila para enlazarla con el rubro del alumno
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Fecha Transferencia</th>
                    <th className="py-3 px-4">Banco</th>
                    <th className="py-3 px-4">No. Transacción</th>
                    <th className="py-3 px-4">Ordenante (Quién pagó)</th>
                    <th className="py-3 px-4">Referencia Bancaria</th>
                    <th className="py-3 px-4">Monto ($ USD)</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción de Enlace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No se encontraron transferencias con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransfers.map((m) => {
                      const isConciliado = m.estado === 'conciliado';
                      return (
                        <tr
                          key={m.id}
                          onClick={() => !isConciliado && handleOpenLinkModal(m)}
                          className={`transition-colors ${
                            isConciliado
                              ? 'bg-slate-50/40 text-slate-500'
                              : 'hover:bg-indigo-50/40 cursor-pointer'
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                            {m.fecha}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
                            {m.banco}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                            {m.numeroTransaccion}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900">
                            {m.ordenante}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={m.referencia}>
                            {m.referencia}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-extrabold text-sm text-indigo-700">
                            ${m.monto.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isConciliado
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : m.estado === 'revision'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {isConciliado ? 'Conciliado' : m.estado === 'revision' ? 'En Revisión' : 'Sin Asignar'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {!isConciliado ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenLinkModal(m);
                                }}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                              >
                                <Link className="w-3.5 h-3.5" />
                                <span>Enlazar a Rubro</span>
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-semibold text-xs inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Enlazado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Custom Pagination (15, 20, 25) */}
            <Pagination
              currentPage={manualCurrentPage}
              totalPages={manualTotalPages}
              totalItems={filteredTransfers.length}
              pageSize={manualPageSize}
              pageSizeOptions={[15, 20, 25]}
              onPageChange={setManualCurrentPage}
              onPageSizeChange={setManualPageSize}
              className="rounded-b-2xl"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ENLAZAR TRANSFERENCIA BANCARIA CON RUBRO / ALUMNO                 */}
      {/* ========================================================================= */}
      {movementToLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                <div>
                  <h2 className="text-sm font-bold">
                    Enlazar Transferencia Bancaria con Rubro Educativo
                  </h2>
                  <span className="text-[11px] text-white/80">
                    Asocia el crédito bancario para saldar la deuda o conciliar el pago
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMovementToLink(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {linkSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{linkSuccessMsg}</span>
                </div>
              )}

              {linkError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              {/* Tarjeta de Información de la Transferencia Bancaria */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Datos de la Transferencia Bancaria Seleccionada
                </span>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Ordenante (Titular que transfirió):</span>
                    <span className="text-sm font-bold text-slate-900">{movementToLink.ordenante}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Banco y Transacción:</span>
                    <span className="font-semibold text-slate-800">{movementToLink.banco}</span> ·{' '}
                    <span className="font-mono font-bold text-indigo-900">{movementToLink.numeroTransaccion}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Fecha y Referencia:</span>
                    <span className="text-slate-700">{movementToLink.fecha}</span> ·{' '}
                    <span className="text-slate-500 italic">{movementToLink.referencia}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Monto Transferido:</span>
                    <span className="text-lg font-extrabold font-mono text-emerald-700">
                      ${movementToLink.monto.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector del Destino: Rubro / Deuda o Pago Registrado */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setLinkTargetType('rubro')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                    linkTargetType === 'rubro'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Enlazar a Rubro / Deuda de Alumno</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLinkTargetType('pago')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                    linkTargetType === 'pago'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Enlazar a Pago Existente Pendiente</span>
                </button>
              </div>

              {/* Buscador de Alumno / Rubro */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    linkTargetType === 'rubro'
                      ? 'Buscar alumno por nombre, cédula o programa educativo...'
                      : 'Buscar pago por alumno o No. transacción...'
                  }
                  value={rubroSearchText}
                  onChange={(e) => setRubroSearchText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* LISTA DE RUBROS / DEUDAS */}
              {linkTargetType === 'rubro' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {candidateDebts.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic">
                      No se encontraron deudas o rubros que coincidan con la búsqueda.
                    </div>
                  ) : (
                    candidateDebts.map((d) => {
                      const client = clients.find((c) => c.id === d.clienteId);
                      const product = products.find((p) => p.id === d.productoId);
                      const fin = getDebtFinancials(d.id);
                      const isSelected = selectedDebtIdToLink === d.id;

                      // Smart recommendation detection:
                      const isNameMatch =
                        movementToLink.ordenante.toLowerCase().includes(client?.apellidos.toLowerCase() || '___') ||
                        movementToLink.ordenante.toLowerCase().includes(client?.nombres.toLowerCase() || '___');
                      const isAmountMatch = Math.abs((fin?.saldoPendiente || d.precioAcordado) - movementToLink.monto) < 0.01;

                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDebtIdToLink(d.id)}
                          className={`p-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 font-bold text-indigo-950 ring-1 ring-inset ring-indigo-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {client ? `${client.nombres} ${client.apellidos}` : d.clienteId}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                C.I: {client?.cedula}
                              </span>
                              {(isNameMatch || isAmountMatch) && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  Sugerencia Coincidente
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              Rubro: <strong>{product?.nombre || d.productoId}</strong> · Precio Acordado: ${d.precioAcordado.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Saldo Pendiente</span>
                              <span className="font-mono font-bold text-amber-700">
                                ${(fin?.saldoPendiente || 0).toFixed(2)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDebtIdToLink(d.id);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isSelected ? 'Seleccionado' : 'Elegir Rubro'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* LISTA DE PAGOS PENDIENTES */}
              {linkTargetType === 'pago' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {candidatePayments.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic">
                      No hay pagos pendientes de conciliar con ese criterio.
                    </div>
                  ) : (
                    candidatePayments.map((p) => {
                      const client = clients.find((c) => c.id === p.clienteId);
                      const isSelected = selectedPaymentIdToLink === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPaymentIdToLink(p.id)}
                          className={`p-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 font-bold text-indigo-950 ring-1 ring-inset ring-indigo-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {client ? `${client.nombres} ${client.apellidos}` : p.clienteId}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              TX: {p.numeroTransaccion || 'S/N'} · Fecha: {p.fechaPago}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-700">
                              ${p.monto.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isSelected ? 'Seleccionado' : 'Elegir'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Observación / Justificación */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Justificación / Observación de la Asociación (para auditoría)
                </label>
                <input
                  type="text"
                  value={linkObservation}
                  onChange={(e) => setLinkObservation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Botón de Confirmación */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Al confirmar, la transferencia bancaria queda conciliada y el saldo del rubro recalculado.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementToLink(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLink}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Enlace a Rubro y Conciliación</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXTRACTO BANCARIO COMPLETO (LISTADO GENERAL CON DETALLE Y ENLACES) */}
      {/* ========================================================================= */}
      {activeTab === 'banco' && (
        <div className="space-y-4">
          {/* Extract Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-medium block">Total Líneas de Extracto</span>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {bankMovements.length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Movimientos bancarios registrados</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                <Building className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-medium block">Transferencias Conciliadas</span>
                <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {bankMovements.filter((m) => m.estado === 'conciliado').length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Asociadas a pagos o rubros</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-medium block">Sin Asignar (Pendientes)</span>
                <span className="text-2xl font-bold text-amber-700 tabular-nums">
                  {bankMovements.filter((m) => m.estado === 'sin_asignar').length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Disponibles en Conciliación Manual</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Statement Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por No. transacción, ordenante o referencia..."
                value={statementSearchQuery}
                onChange={(e) => {
                  setStatementSearchQuery(e.target.value);
                  setStatementCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'conciliado', label: 'Conciliadas' },
                  { value: 'sin_asignar', label: 'Sin Asignar (Pendientes)' },
                  { value: 'revision', label: 'En Revisión' },
                ]}
                value={statementStatusFilter}
                onChange={(val) => {
                  setStatementStatusFilter(val);
                  setStatementCurrentPage(1);
                }}
                className="w-48"
              />

              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los bancos' },
                  ...uniqueBanks.map((b) => ({ value: b, label: b })),
                ]}
                value={statementBankFilter}
                onChange={(val) => {
                  setStatementBankFilter(val);
                  setStatementCurrentPage(1);
                }}
                className="w-44"
              />
            </div>
          </div>

          {/* Full Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <span className="text-xs text-slate-700 font-bold">
                Movimientos del Extracto Bancario ({filteredStatement.length} de {bankMovements.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Pichincha, Pacífico, Guayaquil, Produbanco
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/30">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Banco</th>
                    <th className="py-3 px-4">No. Transacción</th>
                    <th className="py-3 px-4">Ordenante / Depositante</th>
                    <th className="py-3 px-4">Concepto / Referencia</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Conciliación / Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStatement.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No se encontraron movimientos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedStatement.map((bm) => {
                      const rec = reconciliations.find(
                        (r) => r.movimientoBancarioId === bm.id && r.estado === 'conciliado'
                      );
                      const payment = rec ? payments.find((p) => p.id === rec.pagoId) : null;
                      const client = payment ? clients.find((c) => c.id === payment.clienteId) : null;
                      const debt = payment ? debts.find((d) => d.id === payment.deudaId) : null;
                      const product = debt ? products.find((pr) => pr.id === debt.productoId) : null;

                      return (
                        <tr key={bm.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{bm.fecha}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-700">{bm.banco}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {bm.numeroTransaccion}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                            {bm.ordenante}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={bm.referencia}>
                            {bm.referencia}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 tabular-nums text-right whitespace-nowrap">
                            ${bm.monto.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {bm.estado === 'conciliado' && (
                              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                Conciliado
                              </span>
                            )}
                            {bm.estado === 'sin_asignar' && (
                              <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                Sin Asignar
                              </span>
                            )}
                            {bm.estado === 'revision' && (
                              <span className="text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-purple-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                En Revisión
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {bm.estado === 'conciliado' ? (
                              <div className="inline-flex flex-col items-end">
                                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  {client ? `${client.nombres.split(' ')[0]} ${client.apellidos.split(' ')[0]}` : 'Pago vinculado'}
                                </span>
                                {product && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={product.nombre}>
                                    {product.nombre}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenLinkModal(bm)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                title="Enlazar esta transferencia al rubro del alumno en Conciliación Manual"
                              >
                                <Link className="w-3 h-3" />
                                <span>Enlazar a Rubro</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Statement */}
            <Pagination
              currentPage={statementCurrentPage}
              totalPages={statementTotalPages}
              totalItems={filteredStatement.length}
              pageSize={statementPageSize}
              pageSizeOptions={[15, 20, 25]}
              onPageChange={setStatementCurrentPage}
              onPageSizeChange={setStatementPageSize}
              className="rounded-b-2xl"
            />
          </div>
        </div>
      )}

      {/* --- MODAL: DESHACER CONCILIACIÓN CON MOTIVO DE AUDITORÍA (RF-05) --- */}
      {undoRecItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900">Deshacer Conciliación Bancaria</h2>
              </div>
              <button
                onClick={() => setUndoRecItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmUndo} className="p-5 space-y-4 text-xs">
              {undoError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{undoError}</span>
                </div>
              )}

              <p className="text-slate-600">
                Al revertir esta conciliación, el pago regresará al estado de pendiente y el movimiento bancario volverá a estar sin asignar.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo obligatorio de reversión *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explique el motivo por el cual se deshace la conciliación..."
                  value={undoReason}
                  onChange={(e) => setUndoReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUndoRecItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Confirmar Reversión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: SUBIR / IMPORTAR EXTRACTO BANCARIO --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <h2 className="text-sm font-bold">Subir Archivo de Extracto Bancario</h2>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Institución Financiera / Banco Emisor *
                </label>
                <CustomSelect
                  options={[
                    { value: 'Banco Pichincha', label: 'Banco Pichincha' },
                    { value: 'Banco del Pacífico', label: 'Banco del Pacífico' },
                    { value: 'Banco Guayaquil', label: 'Banco Guayaquil' },
                    { value: 'Produbanco', label: 'Produbanco (Grupo Promerica)' },
                    { value: 'Banco Bolivariano', label: 'Banco Bolivariano' },
                  ]}
                  value={uploadBankName}
                  onChange={setUploadBankName}
                  className="w-full"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Seleccionar Archivo (Excel / CSV / TXT) *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50/50 cursor-pointer">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800">
                    {selectedFileName || 'Haz clic para seleccionar o arrastra el archivo aquí'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formatos soportados: .xlsx, .xls, .csv, .txt, .ofx (hasta 25 MB)
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFileName(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                    id="bank-file-input"
                  />
                  <label
                    htmlFor="bank-file-input"
                    className="mt-3 inline-block px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Examinar mi equipo...
                  </label>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong>Nota del flujo:</strong> Los movimientos que se procesen y que <strong>no se logren conciliar automáticamente</strong> se listarán de inmediato en la pestaña <strong>&quot;Conciliación Manual&quot;</strong> para que puedas enlazarlos al rubro del alumno.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLoadSampleBankFile}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
                title="Cargar automáticamente un extracto de prueba para validar el flujo"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Cargar Extracto Demo (Muestra)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleBankFile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  Procesar y Cargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
