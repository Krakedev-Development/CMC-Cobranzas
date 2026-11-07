import React, { useState, useMemo, useRef } from 'react';
import {
  Scale,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Eye,
  FileSpreadsheet,
  X,
  CreditCard,
  Building,
  User,
  Check,
  Receipt,
  FileText,
  RefreshCw,
  Filter,
  HelpCircle,
  Link,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BankMovement, Payment, Reconciliation, Debt, Client, Product } from '../types';

export const CONFIGURED_ENTITIES = [
  'Banco Pichincha',
  'Banco Guayaquil',
  'Banco del Pacífico',
  'PayPal',
  'PayPhone',
] as const;

export type ConfiguredEntity = typeof CONFIGURED_ENTITIES[number];

interface PreviewMovementItem {
  fecha: string;
  monto: number;
  numeroTransaccion: string;
  referencia: string;
  ordenante: string;
  banco: string;
}

export const BankReconciliationView: React.FC = () => {
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
    exportToCSV,
    exportToPDF,
    hasPermission,
  } = useApp();

  const canApprove = hasPermission('conciliacion', 'aprobar');
  const canModify = hasPermission('conciliacion', 'modificar');
  const canExport = hasPermission('conciliacion', 'exportar');

  // Active view tab:
  // 'semaforo' = Vista integral semáforo de conciliación
  // 'extracto' = Extracto bancario completo
  const [activeTab, setActiveTab] = useState<'semaforo' | 'extracto'>('semaforo');

  // Traffic light filter: 'all' | 'verde' | 'ambar' | 'rojo'
  const [trafficFilter, setTrafficFilter] = useState<'all' | 'verde' | 'ambar' | 'rojo'>('all');

  // Entity selector filter
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('all');

  // Text search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination for main table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Notifications
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // ----------------------------------------------------
  // UPLOAD & PREVIEW MODAL STATE
  // ----------------------------------------------------
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadEntity, setUploadEntity] = useState<ConfiguredEntity>('Banco Pichincha');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewMovementItem[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ----------------------------------------------------
  // MANUAL RECONCILIATION MODAL STATE (ORPHAN MOVEMENTS)
  // ----------------------------------------------------
  const [orphanMovementToLink, setOrphanMovementToLink] = useState<BankMovement | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [selectedClientForLink, setSelectedClientForLink] = useState<Client | null>(null);
  const [selectedDebtIdForLink, setSelectedDebtIdForLink] = useState<string>('');
  const [linkObservation, setLinkObservation] = useState('');
  const [manualLinkError, setManualLinkError] = useState('');
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  // ----------------------------------------------------
  // TRAFFIC LIGHT ITEM MAPPING
  // Verde: BankMovement conciliated with payment
  // Ambar: Voucher / Payment registered in comprobación without bank movement
  // Rojo: Orphan bank movement without student voucher
  // ----------------------------------------------------
  interface TrafficLightItem {
    id: string;
    trafficType: 'verde' | 'ambar' | 'rojo';
    fecha: string;
    entidad: string;
    numeroTransaccion: string;
    monto: number;
    descripcion: string;
    alumnoNombre?: string;
    alumnoCedula?: string;
    programaNombre?: string;
    deudaId?: string;
    pagoId?: string;
    bancoMovement?: BankMovement;
    paymentItem?: Payment;
  }

  const trafficLightList = useMemo<TrafficLightItem[]>(() => {
    const list: TrafficLightItem[] = [];

    // 1. VERDES: Conciliados (Movimientos bancarios con estado 'conciliado' o conciliaciones activas)
    const reconciledMovementIds = new Set(
      reconciliations.filter((r) => r.estado === 'conciliado').map((r) => r.movimientoBancarioId)
    );

    bankMovements.forEach((bm) => {
      const isReconciled = bm.estado === 'conciliado' || reconciledMovementIds.has(bm.id);
      if (isReconciled) {
        const rec = reconciliations.find((r) => r.movimientoBancarioId === bm.id && r.estado === 'conciliado');
        const payment = payments.find((p) => p.id === bm.pagoRelacionadoId || p.id === rec?.pagoId);
        const client = payment ? clients.find((c) => c.id === payment.clienteId) : undefined;
        const debt = payment ? debts.find((d) => d.id === payment.deudaId) : undefined;
        const product = debt ? products.find((pr) => pr.id === debt.productoId) : undefined;

        list.push({
          id: `verde-${bm.id}`,
          trafficType: 'verde',
          fecha: bm.fecha,
          entidad: bm.banco,
          numeroTransaccion: bm.numeroTransaccion,
          monto: bm.monto,
          descripcion: bm.referencia || bm.ordenante,
          alumnoNombre: client ? `${client.nombres} ${client.apellidos}` : bm.ordenante,
          alumnoCedula: client?.cedula,
          programaNombre: product?.nombre,
          deudaId: debt?.id,
          pagoId: payment?.id,
          bancoMovement: bm,
          paymentItem: payment,
        });
      }
    });

    // 2. ÁMBAR: Vouchers en comprobación sin registro bancario
    // Pagos registrados con estado de conciliación 'pendiente' o 'revision_manual'
    payments.forEach((p) => {
      if (p.estadoRegistro === 'anulado') return;
      const isPending =
        p.estadoConciliacion === 'pendiente' ||
        p.estadoConciliacion === 'revision_manual' ||
        p.estadoConciliacion === 'no_encontrado';

      if (isPending) {
        const client = clients.find((c) => c.id === p.clienteId);
        const debt = debts.find((d) => d.id === p.deudaId);
        const product = debt ? products.find((pr) => pr.id === debt.productoId) : undefined;

        list.push({
          id: `ambar-${p.id}`,
          trafficType: 'ambar',
          fecha: p.fechaPago,
          entidad: p.bancoOrigen || 'Entidad no especificada',
          numeroTransaccion: p.numeroTransaccion || 'Sin transacción',
          monto: p.monto,
          descripcion: p.referencia || p.observaciones || 'Voucher en comprobación pendiente de extracto bancario',
          alumnoNombre: client ? `${client.nombres} ${client.apellidos}` : 'Alumno no registrado',
          alumnoCedula: client?.cedula,
          programaNombre: product?.nombre,
          deudaId: debt?.id,
          pagoId: p.id,
          paymentItem: p,
        });
      }
    });

    // 3. ROJOS: Transacciones bancarias huérfanas (dinero en banco sin comprobante de alumno)
    bankMovements.forEach((bm) => {
      const isReconciled = bm.estado === 'conciliado' || reconciledMovementIds.has(bm.id);
      if (!isReconciled && bm.estado !== 'duplicado') {
        list.push({
          id: `rojo-${bm.id}`,
          trafficType: 'rojo',
          fecha: bm.fecha,
          entidad: bm.banco,
          numeroTransaccion: bm.numeroTransaccion,
          monto: bm.monto,
          descripcion: bm.referencia ? `${bm.referencia} - ${bm.ordenante}` : bm.ordenante,
          alumnoNombre: undefined, // Huérfano
          alumnoCedula: undefined,
          programaNombre: undefined,
          bancoMovement: bm,
        });
      }
    });

    // Ordenar por fecha descendente
    return list.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [bankMovements, reconciliations, payments, clients, debts, products]);

  // Counts for traffic lights
  const trafficCounts = useMemo(() => {
    const verde = trafficLightList.filter((i) => i.trafficType === 'verde').length;
    const ambar = trafficLightList.filter((i) => i.trafficType === 'ambar').length;
    const rojo = trafficLightList.filter((i) => i.trafficType === 'rojo').length;
    return { verde, ambar, rojo, total: trafficLightList.length };
  }, [trafficLightList]);

  // Filtered traffic items
  const filteredTrafficItems = useMemo(() => {
    return trafficLightList.filter((item) => {
      // Traffic filter
      if (trafficFilter !== 'all' && item.trafficType !== trafficFilter) {
        return false;
      }

      // Entity filter
      if (selectedEntityFilter !== 'all' && item.entidad !== selectedEntityFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTx = item.numeroTransaccion.toLowerCase().includes(q);
        const matchesDesc = item.descripcion.toLowerCase().includes(q);
        const matchesEntity = item.entidad.toLowerCase().includes(q);
        const matchesAlumno = item.alumnoNombre?.toLowerCase().includes(q) || false;
        const matchesCedula = item.alumnoCedula?.includes(q) || false;
        const matchesProg = item.programaNombre?.toLowerCase().includes(q) || false;

        if (!matchesTx && !matchesDesc && !matchesEntity && !matchesAlumno && !matchesCedula && !matchesProg) {
          return false;
        }
      }

      return true;
    });
  }, [trafficLightList, trafficFilter, selectedEntityFilter, searchQuery]);

  // Pagination for traffic items
  const totalPages = Math.ceil(filteredTrafficItems.length / pageSize) || 1;
  const paginatedTrafficItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrafficItems.slice(start, start + pageSize);
  }, [filteredTrafficItems, currentPage, pageSize]);

  // ----------------------------------------------------
  // MOTOR DE MATCHING AUTOMÁTICO
  // ----------------------------------------------------
  const handleRunAutoReconciliation = () => {
    if (!canApprove) {
      alert('No cuenta con permisos para ejecutar la conciliación bancaria.');
      return;
    }

    const result = runAutoReconciliation();
    setNotificationMsg({
      text: `Conciliación ejecutada: ${result.autoReconciled} registros conciliados automáticamente por Entidad + N° Transacción + Monto. ${result.diffFound} con diferencias y ${result.manualPending} pendientes de comprobación.`,
      type: result.autoReconciled > 0 ? 'success' : 'info',
    });
    setTimeout(() => setNotificationMsg(null), 8000);
  };

  // ----------------------------------------------------
  // EXTRACT FILE PARSING & INSTANT PREVIEW
  // ----------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploadError('');
    setPreviewRows([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        if (!text) {
          setUploadError('El archivo seleccionado está vacío.');
          return;
        }

        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length === 0) {
          setUploadError('El archivo no contiene filas válidas.');
          return;
        }

        // Determine if first row is header
        let startIndex = 0;
        const firstLine = lines[0].toLowerCase();
        if (
          firstLine.includes('fecha') ||
          firstLine.includes('transaccion') ||
          firstLine.includes('monto') ||
          firstLine.includes('referencia') ||
          firstLine.includes('ordenante')
        ) {
          startIndex = 1;
        }

        const parsed: PreviewMovementItem[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
          if (parts.length >= 2) {
            // Expected columns: fecha, monto, numeroTransaccion, referencia, ordenante
            const rawFecha = parts[0] || new Date().toISOString().slice(0, 10);
            const rawMonto = Math.abs(parseFloat(parts[1] || '0')) || 0;
            const rawTx = parts[2] || `TX-${Date.now().toString().slice(-5)}-${i}`;
            const rawRef = parts[3] || 'Movimiento de extracto';
            const rawOrd = parts[4] || 'Acreditación identificada en extracto';

            parsed.push({
              fecha: rawFecha,
              monto: rawMonto,
              numeroTransaccion: rawTx,
              referencia: rawRef,
              ordenante: rawOrd,
              banco: uploadEntity,
            });
          }
        }

        if (parsed.length === 0) {
          setUploadError('No se pudieron extraer filas con el formato esperado (Fecha, Monto, N° Transacción, Referencia, Ordenante).');
        } else {
          setPreviewRows(parsed);
        }
      } catch (err: any) {
        setUploadError(`Error al procesar el archivo: ${err.message || 'Formato no soportado'}`);
      }
    };

    reader.readAsText(file);
  };

  // Confirm import with deduplication
  const handleConfirmImport = () => {
    if (previewRows.length === 0) {
      setUploadError('No hay registros para importar.');
      return;
    }

    // Call importBankMovements which performs deduplication and returns counts
    const result = importBankMovements(previewRows);

    setIsUploadModalOpen(false);
    setSelectedFileName('');
    setPreviewRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setNotificationMsg({
      text: `${result.inserted} registros nuevos insertados, ${result.duplicates} duplicados ignorados en extracto de ${uploadEntity}. Las conciliaciones previas se mantuvieron intactas.`,
      type: result.inserted > 0 ? 'success' : 'warning',
    });
    setTimeout(() => setNotificationMsg(null), 8000);
  };

  // ----------------------------------------------------
  // CONCILIACIÓN MANUAL (FILAS ROJAS)
  // ----------------------------------------------------
  const handleOpenManualLink = (movement: BankMovement) => {
    setOrphanMovementToLink(movement);
    setClientSearchQuery('');
    setSelectedClientForLink(null);
    setSelectedDebtIdForLink('');
    setLinkObservation(`Conciliación manual de transferencia huérfana ${movement.numeroTransaccion} (${movement.banco})`);
    setManualLinkError('');

    // Pre-check if movement ordenante matches any existing client
    const ord = movement.ordenante.toLowerCase();
    const candidate = clients.find(
      (c) =>
        ord.includes(c.apellidos.toLowerCase()) ||
        ord.includes(c.nombres.toLowerCase()) ||
        ord.includes(c.cedula)
    );
    if (candidate) {
      setSelectedClientForLink(candidate);
      const clientDebts = debts.filter((d) => d.clienteId === candidate.id && d.estado !== 'anulada');
      if (clientDebts.length > 0) {
        setSelectedDebtIdForLink(clientDebts[0].id);
      }
    }
  };

  // Client search results for manual link
  const clientSearchResults = useMemo(() => {
    if (!clientSearchQuery.trim()) return [];
    const q = clientSearchQuery.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.nombres.toLowerCase().includes(q) ||
        c.apellidos.toLowerCase().includes(q) ||
        c.cedula.includes(q) ||
        c.correo.toLowerCase().includes(q)
    );
  }, [clients, clientSearchQuery]);

  // Debts of the currently selected client
  const clientDebtsForLink = useMemo(() => {
    if (!selectedClientForLink) return [];
    return debts.filter((d) => d.clienteId === selectedClientForLink.id && d.estado !== 'anulada');
  }, [selectedClientForLink, debts]);

  // Confirm manual link
  const handleConfirmManualLink = async () => {
    if (!orphanMovementToLink || !selectedClientForLink || !selectedDebtIdForLink) {
      setManualLinkError('Debe seleccionar el alumno y la deuda o rubro a conciliar.');
      return;
    }

    const targetDebt = debts.find((d) => d.id === selectedDebtIdForLink);
    if (!targetDebt) {
      setManualLinkError('Deuda no encontrada.');
      return;
    }

    try {
      setIsSubmittingLink(true);
      setManualLinkError('');

      // 1. Create and register payment with exact bank movement details
      const payment = await registerPayment({
        deudaId: targetDebt.id,
        clienteId: targetDebt.clienteId,
        monto: orphanMovementToLink.monto,
        fechaPago: orphanMovementToLink.fecha,
        metodo: 'transferencia',
        bancoOrigen: orphanMovementToLink.banco,
        numeroTransaccion: orphanMovementToLink.numeroTransaccion,
        referencia: orphanMovementToLink.referencia,
        observaciones: linkObservation || 'Conciliación manual de transferencia huérfana',
      });

      // 2. Reconcile newly created payment with orphan movement
      reconcileManually(
        payment.id,
        orphanMovementToLink.id,
        linkObservation || `Enlace y liquidación manual contra rubro ${targetDebt.id}`
      );

      setNotificationMsg({
        text: `Transacción ${orphanMovementToLink.numeroTransaccion} conciliada exitosamente. Pasó a estado Verde y la deuda del alumno fue amortizada/liquidada.`,
        type: 'success',
      });
      setTimeout(() => setNotificationMsg(null), 8000);

      setOrphanMovementToLink(null);
    } catch (err: any) {
      setManualLinkError(err.message || 'Error al procesar la conciliación manual.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  // ----------------------------------------------------
  // EXPORT TO CSV
  // ----------------------------------------------------
  const handleExportCSV = () => {
    if (!canExport) return;

    const headers = [
      'Estado Semáforo',
      'Fecha',
      'Entidad / Banco',
      'N° Transacción',
      'Monto ($)',
      'Alumno Asociado',
      'Cédula',
      'Programa Académico',
      'Descripción / Referencia',
    ];

    const rows = filteredTrafficItems.map((item) => [
      item.trafficType === 'verde'
        ? 'Conciliado (Verde)'
        : item.trafficType === 'ambar'
        ? 'En Comprobación (Ámbar)'
        : 'Huérfana Sin Alumno (Rojo)',
      item.fecha,
      item.entidad,
      item.numeroTransaccion,
      item.monto.toFixed(2),
      item.alumnoNombre || 'Sin alumno asignado',
      item.alumnoCedula || '-',
      item.programaNombre || '-',
      item.descripcion,
    ]);

    exportToCSV(`Conciliacion_Bancaria_Semaforo_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleExportPDF = () => {
    if (!canExport) return;

    const headers = [
      'Semáforo',
      'Fecha',
      'Entidad',
      'N° Transacción',
      'Monto ($)',
      'Alumno',
      'Cédula',
      'Programa',
      'Concepto',
    ];

    const rows = filteredTrafficItems.map((item) => [
      item.trafficType === 'verde'
        ? 'Conciliado'
        : item.trafficType === 'ambar'
        ? 'En Comprobación'
        : 'Huérfana',
      item.fecha,
      item.entidad,
      item.numeroTransaccion,
      item.monto.toFixed(2),
      item.alumnoNombre || 'Sin alumno',
      item.alumnoCedula || '-',
      item.programaNombre || '-',
      item.descripcion,
    ]);

    exportToPDF(
      'Reporte de Conciliación Bancaria Multi-Entidad',
      headers,
      rows,
      'Control de matching bancario, semáforo tricolor y movimientos de extracto'
    );
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* HEADER & MAIN ACTION BUTTONS */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Conciliación Bancaria Multi-Entidad
            </h1>
            <p className="text-xs text-slate-500">
              Matching automático por Entidad, N° Transacción y Monto con semáforo tricolor de verificación
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Ejecutar Conciliación Automática */}
          {canApprove && (
            <button
              onClick={handleRunAutoReconciliation}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Cruce automático por Entidad + N° Transacción + Monto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ejecutar Conciliación</span>
            </button>
          )}

          {/* Botón Cargar Extracto Bancario */}
          {canModify && (
            <button
              onClick={() => {
                setSelectedFileName('');
                setPreviewRows([]);
                setUploadError('');
                setIsUploadModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar Extracto</span>
            </button>
          )}

          {/* Botones de Exportación a Excel y PDF */}
          {canExport && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Exportar conciliación a Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Exportar o imprimir conciliación en PDF"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner de notificación */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            notificationMsg.type === 'success'
              ? 'bg-teal-50 text-teal-900 border-teal-200'
              : notificationMsg.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-sky-50 text-sky-900 border-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-700" />
            <span>{notificationMsg.text}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="p-1 hover:bg-black/5 rounded text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3 SUMMARY CARDS - SEMÁFORO VISUAL */}
      {/* Verde (#0F766E), Ámbar (#D97706), Rojo (#DC2626) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* VERDE: Conciliado */}
        <div
          onClick={() => setTrafficFilter(trafficFilter === 'verde' ? 'all' : 'verde')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            trafficFilter === 'verde'
              ? 'ring-2 ring-[#0F766E] bg-teal-50/70 border-[#0F766E]'
              : 'bg-white border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0F766E] inline-block" />
              <span className="text-xs font-bold text-[#0F766E]">Conciliados</span>
            </div>
            <span className="text-[11px] bg-teal-50 text-[#0F766E] border border-teal-200 px-2 py-0.5 rounded-md font-bold">
              Verde (#0F766E)
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#0F766E]">{trafficCounts.verde}</span>
            <span className="text-[11px] text-slate-500">Confirmados en banco</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dinero acreditado y conciliado con comprobante del alumno
          </p>
        </div>

        {/* ÁMBAR: En Comprobación */}
        <div
          onClick={() => setTrafficFilter(trafficFilter === 'ambar' ? 'all' : 'ambar')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            trafficFilter === 'ambar'
              ? 'ring-2 ring-[#D97706] bg-amber-50/70 border-[#D97706]'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D97706] inline-block" />
              <span className="text-xs font-bold text-[#D97706]">En Comprobación</span>
            </div>
            <span className="text-[11px] bg-amber-50 text-[#D97706] border border-amber-200 px-2 py-0.5 rounded-md font-bold">
              Ámbar (#D97706)
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#D97706]">{trafficCounts.ambar}</span>
            <span className="text-[11px] text-slate-500">Pendientes en banco</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Voucher subido por el alumno, pendiente de cruce bancario
          </p>
        </div>

        {/* ROJO: Huérfanas */}
        <div
          onClick={() => setTrafficFilter(trafficFilter === 'rojo' ? 'all' : 'rojo')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            trafficFilter === 'rojo'
              ? 'ring-2 ring-[#DC2626] bg-rose-50/70 border-[#DC2626]'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#DC2626] inline-block" />
              <span className="text-xs font-bold text-[#DC2626]">Transacciones Huérfanas</span>
            </div>
            <span className="text-[11px] bg-rose-50 text-[#DC2626] border border-rose-200 px-2 py-0.5 rounded-md font-bold">
              Rojo (#DC2626)
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#DC2626]">{trafficCounts.rojo}</span>
            <span className="text-[11px] text-slate-500">Sin comprobante</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dinero acreditado en banco sin alumno ni voucher asociado
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER CONTROLS BAR */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Entity Selector (Pichincha, Guayaquil, Pacífico, PayPal, PayPhone) */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Entidad:
          </span>
          <button
            onClick={() => setSelectedEntityFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedEntityFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {CONFIGURED_ENTITIES.map((ent) => (
            <button
              key={ent}
              onClick={() => setSelectedEntityFilter(ent)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedEntityFilter === ent
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ent}
            </button>
          ))}
        </div>

        {/* Traffic Light Filter Pills & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Traffic selector pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setTrafficFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                trafficFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Todos ({trafficCounts.total})
            </button>
            <button
              onClick={() => setTrafficFilter('verde')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                trafficFilter === 'verde' ? 'bg-[#0F766E] text-white shadow-2xs' : 'text-[#0F766E]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
              Verde
            </button>
            <button
              onClick={() => setTrafficFilter('ambar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                trafficFilter === 'ambar' ? 'bg-[#D97706] text-white shadow-2xs' : 'text-[#D97706]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              Ámbar
            </button>
            <button
              onClick={() => setTrafficFilter('rojo')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                trafficFilter === 'rojo' ? 'bg-[#DC2626] text-white shadow-2xs' : 'text-[#DC2626]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              Rojo
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar transacción, alumno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MAIN DATA TABLE: SEMÁFORO VISUAL */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              <tr>
                <th className="py-3 px-4 w-32">Estado Semáforo</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Entidad Bancaria</th>
                <th className="py-3 px-4">N° Transacción</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4">Alumno / Identificación</th>
                <th className="py-3 px-4">Programa Académico</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedTrafficItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Scale className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="font-semibold text-slate-700">
                        No se encontraron registros con los filtros seleccionados
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Ajuste la entidad o el semáforo para visualizar movimientos
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTrafficItems.map((item) => {
                  const isVerde = item.trafficType === 'verde';
                  const isAmbar = item.trafficType === 'ambar';
                  const isRojo = item.trafficType === 'rojo';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isRojo
                          ? 'bg-rose-50/25 hover:bg-rose-50/50'
                          : isAmbar
                          ? 'bg-amber-50/20 hover:bg-amber-50/40'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Estado Semáforo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isVerde && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: '#0F766E' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Conciliado
                          </span>
                        )}
                        {isAmbar && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: '#D97706' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            En Comprobación
                          </span>
                        )}
                        {isRojo && (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: '#DC2626' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Huérfana
                          </span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {item.fecha}
                      </td>

                      {/* Entidad Bancaria */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                        {item.entidad}
                      </td>

                      {/* N° Transacción */}
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-slate-800 whitespace-nowrap">
                        {item.numeroTransaccion}
                      </td>

                      {/* Monto */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        ${item.monto.toFixed(2)}
                      </td>

                      {/* Alumno / Identificación */}
                      <td className="py-3 px-4">
                        {item.alumnoNombre ? (
                          <div>
                            <div className="font-bold text-slate-900">{item.alumnoNombre}</div>
                            {item.alumnoCedula && (
                              <div className="text-[11px] text-slate-500">CI: {item.alumnoCedula}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-rose-700 font-medium italic text-[11px]">
                            Sin alumno asignado (Acreditación bancaria directa)
                          </div>
                        )}
                      </td>

                      {/* Programa Académico */}
                      <td className="py-3 px-4">
                        {item.programaNombre ? (
                          <span className="font-medium text-slate-800">{item.programaNombre}</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isRojo && item.bancoMovement && canModify && (
                          <button
                            type="button"
                            onClick={() => handleOpenManualLink(item.bancoMovement!)}
                            className="px-3 py-1.5 bg-[#DC2626] hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                            title="Conciliar manualmente esta transacción con un alumno"
                          >
                            <Link className="w-3.5 h-3.5" />
                            <span>Conciliar Alumno</span>
                          </button>
                        )}

                        {isVerde && (
                          <span className="text-[11px] font-bold text-[#0F766E] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Auditado
                          </span>
                        )}

                        {isAmbar && (
                          <span className="text-[11px] font-medium text-[#D97706] inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Esperando banco
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

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Mostrando {paginatedTrafficItems.length} de {filteredTrafficItems.length} transacciones
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-2 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: CARGA DE EXTRACTO CON PREVISUALIZACIÓN INMEDIATA */}
      {/* ---------------------------------------------------- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Cargar Extracto Bancario Multi-Entidad
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Formato Excel (.xlsx, .csv) o TXT con previsualización en grid y control de deduplicación
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Selector de Entidad */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Entidad Financiera del Extracto *
                </label>
                <select
                  value={uploadEntity}
                  onChange={(e) => {
                    setUploadEntity(e.target.value as ConfiguredEntity);
                    if (previewRows.length > 0) {
                      setPreviewRows((prev) =>
                        prev.map((r) => ({ ...r, banco: e.target.value as ConfiguredEntity }))
                      );
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                >
                  {CONFIGURED_ENTITIES.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Archivo */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Seleccionar Archivo (.xlsx, .csv, .txt) *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="bank-statement-upload"
                  />
                  <label
                    htmlFor="bank-statement-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-8 h-8 text-sky-500" />
                    <div>
                      <span className="font-bold text-sky-600 hover:text-sky-700">
                        Haga clic para subir extracto
                      </span>{' '}
                      o arrastre su archivo aquí
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Columnas: Fecha, Monto, N° Transacción, Referencia, Ordenante
                    </span>
                  </label>
                </div>

                {selectedFileName && (
                  <div className="mt-2 p-2.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900 font-medium">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="truncate">{selectedFileName}</span>
                    </div>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                      {previewRows.length} filas detectadas
                    </span>
                  </div>
                )}
              </div>

              {/* PREVISUALIZACIÓN INMEDIATA EN GRID */}
              {previewRows.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-sky-600" />
                      Previsualización Inmediata del Extracto ({previewRows.length} registros)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Revise los datos antes de confirmar
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px] text-slate-700">
                      <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">N° Transacción</th>
                          <th className="py-2 px-3">Ordenante / Concepto</th>
                          <th className="py-2 px-3 text-right">Monto</th>
                          <th className="py-2 px-3">Entidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {previewRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-mono">{r.fecha}</td>
                            <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                              {r.numeroTransaccion}
                            </td>
                            <td className="py-1.5 px-3 truncate max-w-[200px]">{r.ordenante}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                              ${r.monto.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-3">{r.banco}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Control de deduplicación activo: las transacciones que ya existan en el sistema se omitirán automáticamente sin afectar conciliaciones existentes.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={previewRows.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors shadow-xs"
              >
                Confirmar e Insertar Extracto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CONCILIACIÓN MANUAL DE TRANSACCIÓN HUÉRFANA */}
      {/* ---------------------------------------------------- */}
      {orphanMovementToLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shadow-xs">
                  <Link className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Conciliación Manual: Enlazar Transacción con Alumno
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Asigne el dinero acreditado a la cuenta por cobrar de un alumno
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrphanMovementToLink(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {manualLinkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{manualLinkError}</span>
                </div>
              )}

              {/* Ficha de la transacción huérfana (Rojo) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Datos de la Transacción Bancaria
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-400">Entidad:</span>
                    <strong className="text-slate-800">{orphanMovementToLink.banco}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">N° Transacción:</span>
                    <strong className="text-slate-800 font-mono">
                      {orphanMovementToLink.numeroTransaccion}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Fecha:</span>
                    <strong className="text-slate-800">{orphanMovementToLink.fecha}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Monto Acreditado:</span>
                    <strong className="text-base text-[#0F766E] font-black">
                      ${orphanMovementToLink.monto.toFixed(2)}
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Detalle / Ordenante:</span> {orphanMovementToLink.ordenante}
                </div>
              </div>

              {/* Buscador de Alumno */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Buscar Alumno en el Sistema *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o cédula..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Resultados de búsqueda */}
                {clientSearchResults.length > 0 && !selectedClientForLink && (
                  <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white shadow-xs">
                    {clientSearchResults.map((cl) => (
                      <div
                        key={cl.id}
                        onClick={() => {
                          setSelectedClientForLink(cl);
                          setClientSearchQuery('');
                          const clDebts = debts.filter((d) => d.clienteId === cl.id && d.estado !== 'anulada');
                          if (clDebts.length > 0) setSelectedDebtIdForLink(clDebts[0].id);
                        }}
                        className="p-2.5 hover:bg-sky-50/60 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {cl.nombres} {cl.apellidos}
                          </span>
                          <span className="text-[10px] text-slate-500">CI: {cl.cedula} | {cl.correo}</span>
                        </div>
                        <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-semibold">
                          Seleccionar
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alumno seleccionado */}
                {selectedClientForLink && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                        Alumno Seleccionado
                      </span>
                      <strong className="text-slate-900 text-xs">
                        {selectedClientForLink.nombres} {selectedClientForLink.apellidos}
                      </strong>
                      <span className="text-[11px] text-slate-600 ml-2">
                        CI: {selectedClientForLink.cedula}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientForLink(null);
                        setSelectedDebtIdForLink('');
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Selector de Deuda / Rubro del Alumno */}
              {selectedClientForLink && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. Seleccionar Deuda o Rubro a Liquidar *
                  </label>
                  {clientDebtsForLink.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      Este alumno no tiene deudas registradas activas.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientDebtsForLink.map((d) => {
                        const product = products.find((pr) => pr.id === d.productoId);
                        const fin = getDebtFinancials(d.id);
                        const saldo = fin ? fin.saldoPendiente : d.precioAcordado;
                        const isSelected = selectedDebtIdForLink === d.id;

                        return (
                          <div
                            key={d.id}
                            onClick={() => setSelectedDebtIdForLink(d.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 bg-teal-50/30'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-900">
                                {product?.nombre || 'Programa educativo'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Adquisición: {d.fechaAdquisicion} | Precio Acordado: ${d.precioAcordado.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] text-slate-400">Saldo Pendiente:</span>
                              <span className="font-bold text-rose-700 text-sm">
                                ${saldo.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Observación */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observaciones de la Conciliación Manual
                </label>
                <input
                  type="text"
                  value={linkObservation}
                  onChange={(e) => setLinkObservation(e.target.value)}
                  placeholder="Ej: Enlace manual de transferencia confirmado por comprobante físico..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => setOrphanMovementToLink(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedClientForLink || !selectedDebtIdForLink || isSubmittingLink}
                onClick={handleConfirmManualLink}
                className="px-5 py-2 bg-[#0F766E] hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Enlace y Liquidar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

