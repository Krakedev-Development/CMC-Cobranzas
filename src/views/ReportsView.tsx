import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  FileSpreadsheet,
  Calendar,
  Users,
  CreditCard,
  Scale,
  Receipt,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Building,
  Clock,
  FileCheck,
  X,
  RotateCcw,
} from 'lucide-react';
import { DatePicker } from '../components/common/DatePicker';
import { renderBankBadge } from './BankReconciliationView';

type ReportType =
  | 'cartera'
  | 'pagos'
  | 'diferencias'
  | 'sin_coincidencia'
  | 'facturas';

const getInitials = (fullName: string) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AL';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const renderDebtStatusBadge = (estado: string, diasMora: number = 0, saldo: number = 0) => {
  if (saldo > 0 && diasMora > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-50 text-rose-800 border-rose-200 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        En mora ({diasMora}d)
      </span>
    );
  }

  const norm = (estado || '').toLowerCase().replace(/_/g, ' ');
  let colorStyles = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotStyles = 'bg-slate-400';

  if (norm.includes('pagada') || norm.includes('al dia') || norm.includes('liquidada')) {
    colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotStyles = 'bg-emerald-500';
  } else if (norm.includes('parcial') || norm.includes('en proceso')) {
    colorStyles = 'bg-sky-50 text-sky-800 border-sky-200';
    dotStyles = 'bg-sky-500';
  } else if (norm.includes('comprobacion')) {
    colorStyles = 'bg-purple-50 text-purple-800 border-purple-200';
    dotStyles = 'bg-purple-500';
  } else if (norm.includes('pendiente')) {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotStyles = 'bg-amber-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorStyles} shadow-2xs capitalize`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} shrink-0`} />
      {norm}
    </span>
  );
};

const renderConciliationStatusBadge = (estado: string) => {
  const norm = (estado || '').toLowerCase().replace(/_/g, ' ');
  let colorStyles = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotStyles = 'bg-slate-400';

  if (norm.includes('conciliado')) {
    colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotStyles = 'bg-emerald-500';
  } else if (norm.includes('diferencia')) {
    colorStyles = 'bg-rose-50 text-rose-800 border-rose-200';
    dotStyles = 'bg-rose-500';
  } else if (norm.includes('manual') || norm.includes('revision')) {
    colorStyles = 'bg-blue-50 text-blue-800 border-blue-200';
    dotStyles = 'bg-blue-500';
  } else if (norm.includes('no encontrado')) {
    colorStyles = 'bg-slate-100 text-slate-700 border-slate-300';
    dotStyles = 'bg-slate-500';
  } else {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotStyles = 'bg-amber-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorStyles} shadow-2xs capitalize`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} shrink-0`} />
      {norm}
    </span>
  );
};

export const ReportsView: React.FC = () => {
  const {
    clients,
    products,
    debts,
    payments,
    bankMovements,
    invoices,
    getDebtFinancials,
    exportToCSV,
    hasPermission,
  } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('cartera');

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const canExport = hasPermission('reportes', 'exportar');

  const hasActiveFilters = Boolean(searchQuery.trim() || filterDateFrom || filterDateTo);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Compute reports datasets
  // 1. Cartera por cliente y producto
  const carteraRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return debts
      .filter((d) => d.estado !== 'anulada')
      .map((debt) => {
        const client = clients.find((c) => c.id === debt.clienteId);
        const product = products.find((p) => p.id === debt.productoId);
        const fin = getDebtFinancials(debt.id);

        return {
          id: debt.id,
          cliente: client ? `${client.nombres} ${client.apellidos}` : debt.clienteId,
          cedula: client?.cedula || '',
          telefono: client?.telefono || '',
          producto: product?.nombre || debt.productoId,
          fecha: debt.fechaAdquisicion,
          diasMora: debt.diasMora || 0,
          precioNominal: debt.precioNominalAplicado,
          precioAcordado: debt.precioAcordado,
          pagado: fin?.validPaymentsTotal || 0,
          saldo: fin?.saldoPendiente || 0,
          estado: fin?.calculatedStatus || debt.estado,
        };
      })
      .filter((row) => {
        const matchesQuery =
          !q ||
          row.cliente.toLowerCase().includes(q) ||
          row.cedula.toLowerCase().includes(q) ||
          row.producto.toLowerCase().includes(q);
        const matchesFrom = !filterDateFrom || row.fecha >= filterDateFrom;
        const matchesTo = !filterDateTo || row.fecha <= filterDateTo;
        return matchesQuery && matchesFrom && matchesTo;
      });
  }, [debts, clients, products, getDebtFinancials, searchQuery, filterDateFrom, filterDateTo]);

  // 2. Historial de Pagos
  const pagosRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return payments
      .filter((p) => p.estadoRegistro !== 'anulado')
      .map((p) => {
        const client = clients.find((c) => c.id === p.clienteId);
        const debt = debts.find((d) => d.id === p.deudaId);
        const prod = products.find((pr) => pr.id === debt?.productoId);

        return {
          id: p.id,
          fecha: p.fechaPago,
          cliente: client ? `${client.nombres} ${client.apellidos}` : p.clienteId,
          cedula: client?.cedula || '',
          producto: prod?.nombre || '',
          monto: p.monto,
          metodo: p.metodo,
          banco: p.bancoOrigen || '',
          tx: p.numeroTransaccion || 'Sin TX',
          estadoConciliacion: p.estadoConciliacion,
        };
      })
      .filter((row) => {
        const matchesQuery =
          !q ||
          row.cliente.toLowerCase().includes(q) ||
          row.cedula.toLowerCase().includes(q) ||
          row.producto.toLowerCase().includes(q) ||
          row.tx.toLowerCase().includes(q) ||
          row.banco.toLowerCase().includes(q);
        const matchesFrom = !filterDateFrom || row.fecha >= filterDateFrom;
        const matchesTo = !filterDateTo || row.fecha <= filterDateTo;
        return matchesQuery && matchesFrom && matchesTo;
      });
  }, [payments, clients, debts, products, searchQuery, filterDateFrom, filterDateTo]);

  // 3. Pagos con Diferencias
  const diferenciasRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return payments
      .filter((p) => p.estadoConciliacion === 'con_diferencias')
      .map((p) => {
        const client = clients.find((c) => c.id === p.clienteId);
        const bm = bankMovements.find(
          (m) => m.pagoRelacionadoId === p.id || m.numeroTransaccion === p.numeroTransaccion
        );
        return {
          pagoId: p.id,
          fecha: p.fechaPago,
          cliente: client ? `${client.nombres} ${client.apellidos}` : p.clienteId,
          cedula: client?.cedula || '',
          tx: p.numeroTransaccion || '',
          montoPago: p.monto,
          montoBanco: bm?.monto || 0,
          diferencia: p.monto - (bm?.monto || 0),
          banco: p.bancoOrigen || bm?.banco || '',
          observaciones: p.observaciones || 'Diferencia detectada en conciliación',
        };
      })
      .filter((row) => {
        const matchesQuery =
          !q ||
          row.cliente.toLowerCase().includes(q) ||
          row.cedula.toLowerCase().includes(q) ||
          row.tx.toLowerCase().includes(q) ||
          row.banco.toLowerCase().includes(q);
        const matchesFrom = !filterDateFrom || row.fecha >= filterDateFrom;
        const matchesTo = !filterDateTo || row.fecha <= filterDateTo;
        return matchesQuery && matchesFrom && matchesTo;
      });
  }, [payments, clients, bankMovements, searchQuery, filterDateFrom, filterDateTo]);

  // 4. Movimientos Bancarios sin coincidencia
  const sinCoincidenciaRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bankMovements
      .filter((m) => m.estado === 'sin_asignar')
      .map((m) => ({
        id: m.id,
        fecha: m.fecha,
        banco: m.banco,
        tx: m.numeroTransaccion,
        ordenante: m.ordenante,
        referencia: m.referencia,
        monto: m.monto,
      }))
      .filter((row) => {
        const matchesQuery =
          !q ||
          row.banco.toLowerCase().includes(q) ||
          row.tx.toLowerCase().includes(q) ||
          row.ordenante.toLowerCase().includes(q) ||
          (row.referencia && row.referencia.toLowerCase().includes(q));
        const matchesFrom = !filterDateFrom || row.fecha >= filterDateFrom;
        const matchesTo = !filterDateTo || row.fecha <= filterDateTo;
        return matchesQuery && matchesFrom && matchesTo;
      });
  }, [bankMovements, searchQuery, filterDateFrom, filterDateTo]);

  // 5. Facturas Registradas
  const facturasRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices
      .map((inv) => {
        const client = clients.find((c) => c.id === inv.clienteId);
        return {
          numero: inv.numeroFactura,
          fecha: inv.fechaFactura,
          cliente: client ? `${client.nombres} ${client.apellidos}` : inv.clienteId,
          cedula: client?.cedula || '',
          monto: inv.monto || 0,
          archivo: inv.nombreArchivo || '',
          estado: inv.estadoDocumental,
        };
      })
      .filter((row) => {
        const matchesQuery =
          !q ||
          row.cliente.toLowerCase().includes(q) ||
          row.cedula.toLowerCase().includes(q) ||
          row.numero.toLowerCase().includes(q);
        const matchesFrom = !filterDateFrom || row.fecha >= filterDateFrom;
        const matchesTo = !filterDateTo || row.fecha <= filterDateTo;
        return matchesQuery && matchesFrom && matchesTo;
      });
  }, [invoices, clients, searchQuery, filterDateFrom, filterDateTo]);

  // Executive KPI summary metrics dynamically computed for active report
  const kpiData = useMemo(() => {
    if (activeReport === 'cartera') {
      const totalAcordado = carteraRows.reduce((acc, r) => acc + (r.precioAcordado || 0), 0);
      const totalPagado = carteraRows.reduce((acc, r) => acc + (r.pagado || 0), 0);
      const totalSaldo = carteraRows.reduce((acc, r) => acc + (r.saldo || 0), 0);
      const tasaCobranza = totalAcordado > 0 ? (totalPagado / totalAcordado) * 100 : 0;
      const moraCount = carteraRows.filter((r) => r.saldo > 0 && r.diasMora > 0).length;

      return [
        {
          label: 'Cartera Total Acordada',
          value: `$${totalAcordado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: `${carteraRows.length} contratos formativos vigentes`,
          color: 'sky',
          accentClass: 'before:bg-sky-500',
          textClass: 'text-sky-700',
          bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Wallet,
        },
        {
          label: 'Total Recaudado Efectivo',
          value: `$${totalPagado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: `${tasaCobranza.toFixed(1)}% tasa de cobranza efectiva`,
          color: 'emerald',
          accentClass: 'before:bg-emerald-500',
          textClass: 'text-emerald-700',
          bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        },
        {
          label: 'Saldo Pendiente de Cobro',
          value: `$${totalSaldo.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: `${carteraRows.filter((r) => r.saldo > 0).length} contratos con saldo por cobrar`,
          color: 'amber',
          accentClass: 'before:bg-amber-500',
          textClass: 'text-amber-700',
          bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        },
        {
          label: 'Cuentas en Mora Crítica',
          value: `${moraCount} ${moraCount === 1 ? 'cuenta' : 'cuentas'}`,
          subtext: `${moraCount > 0 ? 'Requiere seguimiento extrajudicial' : 'Sin alertas de mora crítica'}`,
          color: 'rose',
          accentClass: 'before:bg-rose-500',
          textClass: 'text-rose-700',
          bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
        },
      ];
    } else if (activeReport === 'pagos') {
      const totalMonto = pagosRows.reduce((acc, r) => acc + (r.monto || 0), 0);
      const conciliados = pagosRows.filter((r) => r.estadoConciliacion.startsWith('conciliado')).length;
      const tasaConciliacion = pagosRows.length > 0 ? (conciliados / pagosRows.length) * 100 : 0;
      const conDiferencia = pagosRows.filter((r) => r.estadoConciliacion === 'con_diferencias').length;
      const ticketPromedio = pagosRows.length > 0 ? totalMonto / pagosRows.length : 0;

      return [
        {
          label: 'Monto Total Recaudado',
          value: `$${totalMonto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: `${pagosRows.length} comprobantes registrados`,
          color: 'emerald',
          accentClass: 'before:bg-emerald-500',
          textClass: 'text-emerald-700',
          bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: DollarSign,
        },
        {
          label: 'Pagos Conciliados',
          value: `${conciliados}`,
          subtext: `${tasaConciliacion.toFixed(1)}% validados con entidad bancaria`,
          color: 'sky',
          accentClass: 'before:bg-sky-500',
          textClass: 'text-sky-700',
          bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: CheckCircle2,
        },
        {
          label: 'Pagos con Discrepancia',
          value: `${conDiferencia}`,
          subtext: `${conDiferencia > 0 ? 'Diferencias respecto al banco' : 'Sin diferencias detectadas'}`,
          color: 'rose',
          accentClass: 'before:bg-rose-500',
          textClass: 'text-rose-700',
          bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
        },
        {
          label: 'Ticket Promedio de Pago',
          value: `$${ticketPromedio.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: 'Promedio por cuota o abono',
          color: 'blue',
          accentClass: 'before:bg-blue-600',
          textClass: 'text-blue-700',
          bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: TrendingUp,
        },
      ];
    } else if (activeReport === 'diferencias') {
      const montoPago = diferenciasRows.reduce((acc, r) => acc + (r.montoPago || 0), 0);
      const montoBanco = diferenciasRows.reduce((acc, r) => acc + (r.montoBanco || 0), 0);
      const difNeta = diferenciasRows.reduce((acc, r) => acc + (r.diferencia || 0), 0);

      return [
        {
          label: 'Transacciones con Diferencia',
          value: `${diferenciasRows.length}`,
          subtext: 'Casos observados en conciliación',
          color: 'rose',
          accentClass: 'before:bg-rose-500',
          textClass: 'text-rose-700',
          bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
        },
        {
          label: 'Monto Registrado en Sistema',
          value: `$${montoPago.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: 'Total según comprobante declarado',
          color: 'sky',
          accentClass: 'before:bg-sky-500',
          textClass: 'text-sky-700',
          bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: FileSpreadsheet,
        },
        {
          label: 'Monto Extracto Bancario',
          value: `$${montoBanco.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: 'Total acreditado efectivamente',
          color: 'blue',
          accentClass: 'before:bg-blue-600',
          textClass: 'text-blue-700',
          bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Building,
        },
        {
          label: 'Diferencia Neta a Regularizar',
          value: `$${Math.abs(difNeta).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: difNeta >= 0 ? 'Faltante en extracto bancario' : 'Excedente en extracto bancario',
          color: 'amber',
          accentClass: 'before:bg-amber-500',
          textClass: 'text-amber-700',
          bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Scale,
        },
      ];
    } else if (activeReport === 'sin_coincidencia') {
      const totalMonto = sinCoincidenciaRows.reduce((acc, r) => acc + (r.monto || 0), 0);
      const distinctBanks = new Set(sinCoincidenciaRows.map((r) => r.banco).filter(Boolean)).size;

      return [
        {
          label: 'Movimientos sin Asignar',
          value: `${sinCoincidenciaRows.length}`,
          subtext: 'Abonos en cuenta sin vincular',
          color: 'amber',
          accentClass: 'before:bg-amber-500',
          textClass: 'text-amber-700',
          bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        },
        {
          label: 'Monto Total en Custodia',
          value: `$${totalMonto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: 'Fondos pendientes de imputar',
          color: 'amber',
          accentClass: 'before:bg-amber-500',
          textClass: 'text-amber-700',
          bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: DollarSign,
        },
        {
          label: 'Entidades Bancarias',
          value: `${distinctBanks}`,
          subtext: 'Cuentas receptoras con partidas',
          color: 'sky',
          accentClass: 'before:bg-sky-500',
          textClass: 'text-sky-700',
          bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Building,
        },
        {
          label: 'Acción Requerida',
          value: 'Asignación',
          subtext: 'Vincular en Conciliación Bancaria',
          color: 'blue',
          accentClass: 'before:bg-blue-600',
          textClass: 'text-blue-700',
          bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: CheckCircle2,
        },
      ];
    } else {
      // facturas
      const totalMonto = facturasRows.reduce((acc, r) => acc + (r.monto || 0), 0);
      const conPdf = facturasRows.filter((r) => !!r.archivo && r.archivo !== 'Sin archivo').length;
      const sinPdf = facturasRows.length - conPdf;

      return [
        {
          label: 'Monto Total Facturado',
          value: `$${totalMonto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          subtext: `Suma total de comprobantes fiscales`,
          color: 'emerald',
          accentClass: 'before:bg-emerald-500',
          textClass: 'text-emerald-700',
          bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: DollarSign,
        },
        {
          label: 'Facturas Registradas',
          value: `${facturasRows.length}`,
          subtext: 'Documentos cargados en el sistema',
          color: 'sky',
          accentClass: 'before:bg-sky-500',
          textClass: 'text-sky-700',
          bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Receipt,
        },
        {
          label: 'Con Archivo PDF Adjunto',
          value: `${conPdf}`,
          subtext: `${facturasRows.length > 0 ? ((conPdf / facturasRows.length) * 100).toFixed(0) : 0}% con respaldo documental`,
          color: 'emerald',
          accentClass: 'before:bg-emerald-500',
          textClass: 'text-emerald-700',
          bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: FileCheck,
        },
        {
          label: 'Pendientes de Carga PDF',
          value: `${sinPdf}`,
          subtext: `${sinPdf > 0 ? 'Requieren adjuntar documento' : 'Archivo documental completo'}`,
          color: 'amber',
          accentClass: 'before:bg-amber-500',
          textClass: 'text-amber-700',
          bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        },
      ];
    }
  }, [activeReport, carteraRows, pagosRows, diferenciasRows, sinCoincidenciaRows, facturasRows]);

  // Handle Real Functional CSV Export
  const handleExportCSV = () => {
    if (!canExport) return;

    if (activeReport === 'cartera') {
      const headers = ['ID Deuda', 'Cliente', 'Cédula', 'Teléfono', 'Programa', 'Fecha', 'P. Nominal', 'P. Acordado', 'Pagado', 'Saldo Pendiente', 'Estado'];
      const rows = carteraRows.map((r) => [
        r.id,
        r.cliente,
        r.cedula,
        r.telefono,
        r.producto,
        r.fecha,
        r.precioNominal,
        r.precioAcordado,
        r.pagado,
        r.saldo,
        r.estado,
      ]);
      exportToCSV('Reporte_Cartera_Por_Cliente', headers, rows);
    } else if (activeReport === 'pagos') {
      const headers = ['ID Pago', 'Fecha', 'Cliente', 'Cédula', 'Programa', 'Monto', 'Método', 'Banco', 'No. Transacción', 'Conciliación'];
      const rows = pagosRows.map((r) => [
        r.id,
        r.fecha,
        r.cliente,
        r.cedula,
        r.producto,
        r.monto,
        r.metodo,
        r.banco,
        r.tx,
        r.estadoConciliacion,
      ]);
      exportToCSV('Reporte_Historial_Pagos', headers, rows);
    } else if (activeReport === 'diferencias') {
      const headers = ['ID Pago', 'Fecha', 'Cliente', 'No. Transacción', 'Monto Pago', 'Monto Banco', 'Diferencia', 'Banco', 'Observaciones'];
      const rows = diferenciasRows.map((r) => [
        r.pagoId,
        r.fecha,
        r.cliente,
        r.tx,
        r.montoPago,
        r.montoBanco,
        r.diferencia,
        r.banco,
        r.observaciones,
      ]);
      exportToCSV('Reporte_Pagos_Con_Diferencias', headers, rows);
    } else if (activeReport === 'sin_coincidencia') {
      const headers = ['ID Movimiento', 'Fecha', 'Banco', 'No. Transacción', 'Ordenante', 'Referencia', 'Monto'];
      const rows = sinCoincidenciaRows.map((r) => [
        r.id,
        r.fecha,
        r.banco,
        r.tx,
        r.ordenante,
        r.referencia,
        r.monto,
      ]);
      exportToCSV('Reporte_Movimientos_Bancarios_Sin_Coincidencia', headers, rows);
    } else if (activeReport === 'facturas') {
      const headers = ['No. Factura', 'Fecha', 'Cliente', 'Cédula', 'Monto', 'Archivo', 'Estado'];
      const rows = facturasRows.map((r) => [
        r.numero,
        r.fecha,
        r.cliente,
        r.cedula,
        r.monto,
        r.archivo,
        r.estado,
      ]);
      exportToCSV('Reporte_Facturas_Registradas', headers, rows);
    }
  };

  const REPORT_TABS: { id: ReportType; label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cartera', label: 'Cartera por Cliente', count: carteraRows.length, icon: Users },
    { id: 'pagos', label: 'Historial de Pagos', count: pagosRows.length, icon: CreditCard },
    { id: 'diferencias', label: 'Pagos con Diferencias', count: diferenciasRows.length, icon: AlertTriangle },
    { id: 'sin_coincidencia', label: 'Movimientos sin Asignar', count: sinCoincidenciaRows.length, icon: Scale },
    { id: 'facturas', label: 'Facturas Registradas', count: facturasRows.length, icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Executive KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-1 ${kpi.accentClass}`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-8 h-8 rounded-xl border shadow-2xs flex items-center justify-center shrink-0 ${kpi.bgBadge}`}>
                  <IconComp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className={`text-2xl lg:text-3xl font-black font-mono tracking-tight tabular-nums ${kpi.textClass}`}>
                  {kpi.value}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl text-xs font-medium border border-slate-200/80">
        {REPORT_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Export Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por alumno, cédula o referencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Desde:</span>
            <DatePicker
              value={filterDateFrom}
              onChange={(val) => setFilterDateFrom(val)}
              placeholder="dd/mm/aaaa"
              className="w-32 border-0 bg-transparent py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Hasta:</span>
            <DatePicker
              value={filterDateTo}
              onChange={(val) => setFilterDateTo(val)}
              placeholder="dd/mm/aaaa"
              className="w-32 border-0 bg-transparent py-1 text-xs"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors font-medium text-xs"
              title="Limpiar todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Real Export Button */}
        {canExport && (
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 self-start lg:self-auto shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Reporte a CSV</span>
          </button>
        )}
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* REPORT 1: CARTERA */}
        {activeReport === 'cartera' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/75">
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">Programa Académico</th>
                  <th className="py-3 px-4 text-right">P. Nominal</th>
                  <th className="py-3 px-4 text-right">P. Acordado</th>
                  <th className="py-3 px-4 text-right">Total Pagado</th>
                  <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carteraRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No se encontraron cuentas de cartera</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ajuste o limpie los filtros para visualizar registros</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  carteraRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 text-xs font-bold flex items-center justify-center shrink-0 border border-sky-200 shadow-2xs">
                            {getInitials(r.cliente)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{r.cliente}</div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {r.cedula || 'Sin cédula'}
                              {r.telefono ? ` · ${r.telefono}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium text-[11px]">
                          {r.producto}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 line-through font-mono tabular-nums text-xs">
                        ${r.precioNominal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums text-xs">
                        ${r.precioAcordado.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums text-xs">
                        ${r.pagado.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-xs">
                        {r.saldo > 0 ? (
                          <span className="text-amber-700">${r.saldo.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-700">$0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderDebtStatusBadge(r.estado, r.diasMora, r.saldo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 2: PAGOS */}
        {activeReport === 'pagos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/75">
                  <th className="py-3 px-4">Fecha / ID</th>
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">Programa</th>
                  <th className="py-3 px-4 text-right">Monto Recaudado</th>
                  <th className="py-3 px-4">Entidad / Método</th>
                  <th className="py-3 px-4">No. Transacción</th>
                  <th className="py-3 px-4 text-center">Conciliación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagosRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No se encontraron pagos registrados</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ajuste los criterios de búsqueda o rango de fechas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagosRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 block">{r.fecha}</span>
                        <span className="font-mono text-[10px] text-slate-400">{r.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 text-xs font-bold flex items-center justify-center shrink-0 border border-sky-200 shadow-2xs">
                            {getInitials(r.cliente)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{r.cliente}</div>
                            {r.cedula && <div className="font-mono text-[10px] text-slate-400">{r.cedula}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium text-[11px]">
                          {r.producto || 'Formación CMC'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 tabular-nums text-xs">
                        ${r.monto.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {renderBankBadge(r.banco)}
                          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                            {r.metodo}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {r.tx}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderConciliationStatusBadge(r.estadoConciliacion)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 3: DIFERENCIAS */}
        {activeReport === 'diferencias' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/75">
                  <th className="py-3 px-4">Fecha / Pago</th>
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">No. Transacción</th>
                  <th className="py-3 px-4 text-right">Monto Sistema</th>
                  <th className="py-3 px-4 text-right">Monto Banco</th>
                  <th className="py-3 px-4 text-right">Diferencia</th>
                  <th className="py-3 px-4">Entidad Bancaria</th>
                  <th className="py-3 px-4">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diferenciasRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-slate-700">Sin diferencias detectadas</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Todos los pagos con conciliación coinciden con los extractos bancarios</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  diferenciasRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 block">{r.fecha}</span>
                        <span className="font-mono text-[10px] text-slate-400">{r.pagoId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 text-xs font-bold flex items-center justify-center shrink-0 border border-sky-200 shadow-2xs">
                            {getInitials(r.cliente)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{r.cliente}</div>
                            {r.cedula && <div className="font-mono text-[10px] text-slate-400">{r.cedula}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.tx}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums text-xs">
                        ${r.montoPago.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums text-xs">
                        ${r.montoBanco.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-700 tabular-nums text-xs">
                        ${r.diferencia.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-4">
                        {renderBankBadge(r.banco)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={r.observaciones}>
                        {r.observaciones}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 4: MOVIMIENTOS SIN COINCIDENCIA */}
        {activeReport === 'sin_coincidencia' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/75">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Entidad Bancaria</th>
                  <th className="py-3 px-4">No. Transacción</th>
                  <th className="py-3 px-4">Ordenante Detectado</th>
                  <th className="py-3 px-4">Referencia / Concepto</th>
                  <th className="py-3 px-4 text-right">Monto Custodia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sinCoincidenciaRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="font-semibold text-slate-700">Sin movimientos bancarios pendientes</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Todos los extractos bancarios han sido vinculados a sus respectivos pagos</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sinCoincidenciaRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">{r.fecha}</td>
                      <td className="py-3 px-4">
                        {renderBankBadge(r.banco)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.tx}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.ordenante}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-[240px] truncate" title={r.referencia}>
                        {r.referencia || 'Sin referencia bancaria'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 tabular-nums text-xs">
                        ${r.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 5: FACTURAS */}
        {activeReport === 'facturas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/75">
                  <th className="py-3 px-4">No. Factura</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">Cédula / RUC</th>
                  <th className="py-3 px-4 text-right">Monto Facturado</th>
                  <th className="py-3 px-4">Comprobante Digital</th>
                  <th className="py-3 px-4 text-center">Estado Documental</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturasRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No se encontraron facturas registradas</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ajuste los filtros o registre nuevos comprobantes en el módulo de facturas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  facturasRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {r.numero}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{r.fecha}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 text-xs font-bold flex items-center justify-center shrink-0 border border-sky-200 shadow-2xs">
                            {getInitials(r.cliente)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{r.cliente}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{r.cedula || 'Consumidor Final'}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 tabular-nums text-xs">
                        ${r.monto.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {r.archivo && r.archivo !== 'Sin archivo' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[11px] font-semibold max-w-[180px] truncate" title={r.archivo}>
                            <FileCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span className="truncate">{r.archivo}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Sin archivo</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            r.estado === 'registrada'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.estado === 'registrada' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {r.estado === 'registrada' ? 'Registrada' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
