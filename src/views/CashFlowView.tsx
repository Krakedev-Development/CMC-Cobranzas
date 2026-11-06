import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  Mail,
  Phone,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Debt, Payment, Client, Product } from '../types';

interface CashFlowViewProps {
  onRegisterPaymentForDebt?: (debtId: string, clientId: string) => void;
}

interface OverdueStudentItem {
  debtId: string;
  clientId: string;
  clientName: string;
  clientCedula: string;
  clientPhone: string;
  clientEmail: string;
  productName: string;
  promisedDate: string;
  daysLate: number;
  expectedAmount: number;
  pendingBalance: number;
  debtStatus: string;
  weekIndex: number; // 1, 2, 3, 4
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ onRegisterPaymentForDebt }) => {
  const { debts, payments, clients, products, exportToCSV, hasPermission, getDebtFinancials } = useApp();
  const canExport = hasPermission('flujo_efectivo', 'exportar');

  // Selected period state (Year and Month)
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed (0 = Jan, 10 = Nov)

  // Filters for the overdue students table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleResetCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // Calculate days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Format month string: 'YYYY-MM'
  const selectedPeriodKey = useMemo(() => {
    const mm = String(selectedMonth + 1).padStart(2, '0');
    return `${selectedYear}-${mm}`;
  }, [selectedYear, selectedMonth]);

  // Helper: map a day of the month (1..31) to week index 1..4
  const getWeekIndexForDay = (day: number): number => {
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };

  // Helper: check if a date string 'YYYY-MM-DD' falls within the selected month
  const isDateInSelectedMonth = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    return dateStr.startsWith(selectedPeriodKey);
  };

  // Helper: calculate days late from a given date string compared to today
  const calculateDaysLate = (dateStr: string): number => {
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date(today.toISOString().slice(0, 10) + 'T00:00:00');
    const diffTime = now.getTime() - target.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // ----------------------------------------------------
  // CASH FLOW AGGREGATION ENGINE (PROYECTADO VS EJECUTADO)
  // ----------------------------------------------------
  const cashFlowData = useMemo(() => {
    // Initialize 4 weekly buckets
    const weeks = [
      { week: 1, label: 'Semana 1', range: `Día 1 - 7`, proyectado: 0, ejecutado: 0 },
      { week: 2, label: 'Semana 2', range: `Día 8 - 14`, proyectado: 0, ejecutado: 0 },
      { week: 3, label: 'Semana 3', range: `Día 15 - 21`, proyectado: 0, ejecutado: 0 },
      { week: 4, label: 'Semana 4+', range: `Día 22 - ${daysInMonth}`, proyectado: 0, ejecutado: 0 },
    ];

    // 1. Compute Proyectado (Expected Collections)
    debts.forEach((debt) => {
      // If the debt has installments (cuotas)
      if (debt.cuotas && debt.cuotas.length > 0) {
        debt.cuotas.forEach((cuota) => {
          if (isDateInSelectedMonth(cuota.fechaVencimiento)) {
            const day = parseInt(cuota.fechaVencimiento.slice(8, 10), 10);
            const wIdx = getWeekIndexForDay(day);
            weeks[wIdx - 1].proyectado += Number(cuota.monto || 0);
          }
        });
      } else {
        // Single payment debt: use fechaCompromisoPago or fechaAdquisicion
        const refDate = debt.fechaCompromisoPago || debt.fechaAdquisicion;
        if (isDateInSelectedMonth(refDate)) {
          const day = parseInt(refDate.slice(8, 10), 10);
          const wIdx = getWeekIndexForDay(day);
          weeks[wIdx - 1].proyectado += Number(debt.precioAcordado || 0);
        }
      }
    });

    // 2. Compute Ejecutado (Actual Collections)
    payments.forEach((payment) => {
      if (payment.estadoRegistro === 'anulado') return;
      if (isDateInSelectedMonth(payment.fechaPago)) {
        const day = parseInt(payment.fechaPago.slice(8, 10), 10);
        const wIdx = getWeekIndexForDay(day);
        weeks[wIdx - 1].ejecutado += Number(payment.monto || 0);
      }
    });

    // Monthly totals
    const totalProyectado = weeks.reduce((sum, w) => sum + w.proyectado, 0);
    const totalEjecutado = weeks.reduce((sum, w) => sum + w.ejecutado, 0);
    const totalGap = totalProyectado - totalEjecutado;
    const efficiency = totalProyectado > 0 ? (totalEjecutado / totalProyectado) * 100 : 0;

    return {
      weeks,
      totalProyectado,
      totalEjecutado,
      totalGap,
      efficiency,
    };
  }, [debts, payments, selectedPeriodKey, daysInMonth]);

  // ----------------------------------------------------
  // LISTA DE ALUMNOS CON COMPROMISO INCUMPLIDO
  // ----------------------------------------------------
  const overdueStudents = useMemo(() => {
    const list: OverdueStudentItem[] = [];

    debts.forEach((debt) => {
      const financials = getDebtFinancials(debt.id);
      const saldoPendiente = financials ? financials.saldoPendiente : Math.max(0, debt.precioAcordado);

      // Must have pending balance and not be cancelled or fully paid
      if (saldoPendiente <= 0.01 || debt.estado === 'pagada' || debt.estado === 'anulada') {
        return;
      }

      const client = clients.find((c) => c.id === debt.clienteId);
      const product = products.find((p) => p.id === debt.productoId);

      // Check installments with overdue dates in selected month
      let foundInInstallments = false;
      if (debt.cuotas && debt.cuotas.length > 0) {
        debt.cuotas.forEach((cuota) => {
          if (
            isDateInSelectedMonth(cuota.fechaVencimiento) &&
            cuota.estado !== 'pagada'
          ) {
            const day = parseInt(cuota.fechaVencimiento.slice(8, 10), 10);
            const wIdx = getWeekIndexForDay(day);
            const daysLate = calculateDaysLate(cuota.fechaVencimiento);

            list.push({
              debtId: debt.id,
              clientId: debt.clienteId,
              clientName: client ? `${client.nombres} ${client.apellidos}` : 'Cliente no registrado',
              clientCedula: client?.cedula || '-',
              clientPhone: client?.telefono || '-',
              clientEmail: client?.correo || '-',
              productName: product?.nombre || 'Programa académico',
              promisedDate: cuota.fechaVencimiento,
              daysLate,
              expectedAmount: Number(cuota.monto || 0),
              pendingBalance: saldoPendiente,
              debtStatus: debt.estado,
              weekIndex: wIdx,
            });
            foundInInstallments = true;
          }
        });
      }

      // If no installments were matched, check direct commitment date
      if (!foundInInstallments) {
        const refDate = debt.fechaCompromisoPago || debt.fechaAdquisicion;
        if (isDateInSelectedMonth(refDate)) {
          const day = parseInt(refDate.slice(8, 10), 10);
          const wIdx = getWeekIndexForDay(day);
          const daysLate = calculateDaysLate(refDate);

          list.push({
            debtId: debt.id,
            clientId: debt.clienteId,
            clientName: client ? `${client.nombres} ${client.apellidos}` : 'Cliente no registrado',
            clientCedula: client?.cedula || '-',
            clientPhone: client?.telefono || '-',
            clientEmail: client?.correo || '-',
            productName: product?.nombre || 'Programa académico',
            promisedDate: refDate,
            daysLate,
            expectedAmount: Number(saldoPendiente || debt.precioAcordado),
            pendingBalance: saldoPendiente,
            debtStatus: debt.estado,
            weekIndex: wIdx,
          });
        }
      }
    });

    // Sort by days late descending
    return list.sort((a, b) => b.daysLate - a.daysLate);
  }, [debts, clients, products, selectedPeriodKey, today]);

  // Filtered overdue students based on search and week filter
  const filteredOverdueStudents = useMemo(() => {
    return overdueStudents.filter((item) => {
      const matchesWeek =
        selectedWeekFilter === 'all' || item.weekIndex === selectedWeekFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.clientName.toLowerCase().includes(q) ||
        item.clientCedula.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.clientPhone.toLowerCase().includes(q) ||
        item.clientEmail.toLowerCase().includes(q);

      return matchesWeek && matchesSearch;
    });
  }, [overdueStudents, selectedWeekFilter, searchQuery]);

  // Export cash flow and overdue commitments to CSV
  const handleExportOverdueCSV = () => {
    if (!canExport) return;

    const headers = [
      'Alumno',
      'Cédula',
      'Teléfono',
      'Correo',
      'Programa',
      'Fecha Compromiso',
      'Días Mora',
      'Monto Esperado ($)',
      'Saldo Pendiente ($)',
      'Semana',
      'Estado Deuda',
    ];

    const rows = filteredOverdueStudents.map((item) => [
      item.clientName,
      item.clientCedula,
      item.clientPhone,
      item.clientEmail,
      item.productName,
      item.promisedDate,
      item.daysLate,
      item.expectedAmount.toFixed(2),
      item.pendingBalance.toFixed(2),
      `Semana ${item.weekIndex}`,
      item.debtStatus,
    ]);

    exportToCSV(`Flujo_Efectivo_Incumplidos_${selectedPeriodKey}`, headers, rows);
  };

  const handleExportCashFlowSummaryCSV = () => {
    if (!canExport) return;

    const headers = [
      'Período / Semana',
      'Rango Fechas',
      'Cobro Proyectado ($)',
      'Cobro Ejecutado ($)',
      'Brecha / Gap ($)',
      'Eficiencia (%)',
    ];

    const rows = cashFlowData.weeks.map((w) => {
      const gap = w.proyectado - w.ejecutado;
      const eff = w.proyectado > 0 ? ((w.ejecutado / w.proyectado) * 100).toFixed(1) : '100.0';
      return [
        w.label,
        w.range,
        w.proyectado.toFixed(2),
        w.ejecutado.toFixed(2),
        gap.toFixed(2),
        `${eff}%`,
      ];
    });

    // Add monthly total row
    const totalEff =
      cashFlowData.totalProyectado > 0
        ? ((cashFlowData.totalEjecutado / cashFlowData.totalProyectado) * 100).toFixed(1)
        : '100.0';

    rows.push([
      `TOTAL ${monthNames[selectedMonth].toUpperCase()} ${selectedYear}`,
      `Mes Completo (1-${daysInMonth})`,
      cashFlowData.totalProyectado.toFixed(2),
      cashFlowData.totalEjecutado.toFixed(2),
      cashFlowData.totalGap.toFixed(2),
      `${totalEff}%`,
    ]);

    exportToCSV(`Resumen_Flujo_Efectivo_${selectedPeriodKey}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* TOP CONTROLS & MONTH SELECTOR BAR */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Flujo de Efectivo: Proyectado vs. Ejecutado
            </h1>
            <p className="text-xs text-slate-500">
              Monitoreo semanal de recaudación, análisis de brechas y seguimiento de compromisos
            </p>
          </div>
        </div>

        {/* Period Selector & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-2 font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {monthNames[selectedMonth]} {selectedYear}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleResetCurrentMonth}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Mes Actual
          </button>

          {canExport && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCashFlowSummaryCSV}
                title="Descargar matriz semanal en CSV"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Resumen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4 SUMMARY METRIC CARDS */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Proyectado */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cobro Proyectado</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ${cashFlowData.totalProyectado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Esperado para {monthNames[selectedMonth]}
            </p>
          </div>
        </div>

        {/* Ejecutado */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Cobro Real Ejecutado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              ${cashFlowData.totalEjecutado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              Efectivamente acreditado en banco
            </p>
          </div>
        </div>

        {/* Brecha / Gap */}
        <div
          className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between ${
            cashFlowData.totalGap > 0
              ? 'bg-amber-50/40 border-amber-200'
              : 'bg-emerald-50/30 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold ${
                cashFlowData.totalGap > 0 ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              Brecha de Recaudación (Gap)
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                cashFlowData.totalGap > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {cashFlowData.totalGap > 0 ? (
                <ArrowDownRight className="w-4 h-4" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-2xl font-black tracking-tight ${
                cashFlowData.totalGap > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              ${Math.abs(cashFlowData.totalGap).toLocaleString('es-EC', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <p
              className={`text-[11px] mt-0.5 ${
                cashFlowData.totalGap > 0 ? 'text-amber-700/80' : 'text-emerald-700/80'
              }`}
            >
              {cashFlowData.totalGap > 0
                ? 'Monto pendiente por recaudar'
                : 'Meta mensual alcanzada'}
            </p>
          </div>
        </div>

        {/* Tasa de Cumplimiento */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Eficiencia de Recaudación</span>
            <span className="text-xs font-bold text-sky-600">
              {cashFlowData.efficiency.toFixed(1)}%
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  cashFlowData.efficiency >= 100
                    ? 'bg-emerald-500'
                    : cashFlowData.efficiency >= 70
                    ? 'bg-sky-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(cashFlowData.efficiency, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {cashFlowData.efficiency >= 100
                ? '100% de la cuota programada cobrada'
                : `${(100 - cashFlowData.efficiency).toFixed(1)}% pendiente de cobertura`}
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* DESGLOSE SEMANAL (SEMANA 1 A SEMANA 4+) */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Desglose Semanal de Recaudación ({monthNames[selectedMonth]} {selectedYear})
            </h2>
            <p className="text-xs text-slate-500">
              Comparativa semanal de plazos programados vs. cobros efectivos acreditados
            </p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-semibold">
            4 Semanas Calendario
          </span>
        </div>

        {/* 4 Weekly Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cashFlowData.weeks.map((week) => {
            const gap = week.proyectado - week.ejecutado;
            const weekEff =
              week.proyectado > 0 ? (week.ejecutado / week.proyectado) * 100 : week.ejecutado > 0 ? 100 : 0;
            const isSelected = selectedWeekFilter === week.week;

            return (
              <div
                key={week.week}
                onClick={() =>
                  setSelectedWeekFilter((prev) => (prev === week.week ? 'all' : week.week))
                }
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{week.label}</span>
                    <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-medium">
                      {week.range}
                    </span>
                  </div>

                  {/* Proyectado & Ejecutado */}
                  <div className="space-y-1.5 text-xs mt-3">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Proyectado:</span>
                      <span className="font-semibold text-slate-800">
                        ${week.proyectado.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Ejecutado:</span>
                      <span className="font-bold text-emerald-700">
                        ${week.ejecutado.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                      <span>Brecha (Gap):</span>
                      <span
                        className={`font-bold ${
                          gap > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {gap > 0 ? `-$${gap.toFixed(2)}` : 'Cubierto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Cumplimiento</span>
                    <span className="font-bold text-slate-700">{weekEff.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        weekEff >= 100
                          ? 'bg-emerald-500'
                          : weekEff >= 70
                          ? 'bg-sky-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(weekEff, 100)}%` }}
                    />
                  </div>
                  <span className="block text-[10px] text-center text-slate-400 mt-2 font-medium">
                    {isSelected ? 'Filtro activo (clic para ver todas)' : 'Clic para filtrar alumnos'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Bar Comparison */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-3">
            Comparativa Visual de Cobro por Semana
          </h3>
          <div className="space-y-3">
            {cashFlowData.weeks.map((week) => {
              const maxVal = Math.max(
                ...cashFlowData.weeks.map((w) => Math.max(w.proyectado, w.ejecutado, 1))
              );
              const proyWidth = (week.proyectado / maxVal) * 100;
              const ejecWidth = (week.ejecutado / maxVal) * 100;

              return (
                <div key={week.week} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold text-slate-800">{week.label} ({week.range})</span>
                    <span className="text-[11px]">
                      Proy: <strong className="text-sky-700">${week.proyectado.toFixed(2)}</strong> | Ejec: <strong className="text-emerald-700">${week.ejecutado.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {/* Proyectado Bar */}
                    <div className="w-full bg-slate-100 rounded-md h-3 overflow-hidden flex items-center">
                      <div
                        className="bg-sky-400 h-3 rounded-md transition-all duration-300"
                        style={{ width: `${Math.max(proyWidth, 2)}%` }}
                        title={`Proyectado: $${week.proyectado.toFixed(2)}`}
                      />
                    </div>
                    {/* Ejecutado Bar */}
                    <div className="w-full bg-slate-100 rounded-md h-3 overflow-hidden flex items-center">
                      <div
                        className="bg-emerald-500 h-3 rounded-md transition-all duration-300"
                        style={{ width: `${Math.max(ejecWidth, 2)}%` }}
                        title={`Ejecutado: $${week.ejecutado.toFixed(2)}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
              <span>Cobro Proyectado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>Cobro Real Ejecutado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TABLA: ALUMNOS CON COMPROMISO INCUMPLIDO */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Alumnos con Compromiso Incumplido (Brecha de Cobranza)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {filteredOverdueStudents.length} pendientes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Alumnos con fecha pactada o cuota vencida en el período seleccionado con saldo pendiente
            </p>
          </div>

          {canExport && filteredOverdueStudents.length > 0 && (
            <button
              onClick={handleExportOverdueCSV}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Incumplidos CSV</span>
            </button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Week Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedWeekFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedWeekFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas las semanas
            </button>
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeekFilter(w)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedWeekFilter === w
                    ? 'bg-sky-500 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semana {w}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por alumno, cédula o programa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              <tr>
                <th className="py-3 px-4">Alumno / Identificación</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Programa Académico</th>
                <th className="py-3 px-4">Fecha Prometida</th>
                <th className="py-3 px-4">Días Mora</th>
                <th className="py-3 px-4 text-right">Monto Esperado</th>
                <th className="py-3 px-4 text-right">Saldo Deuda</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOverdueStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      <span className="font-semibold text-slate-700">
                        No se registran compromisos incumplidos en este período o filtro
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Todos los alumnos programados están al día o han cancelado su cuota
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOverdueStudents.map((item, index) => (
                  <tr key={`${item.debtId}-${item.promisedDate}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                    {/* Alumno */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.clientName}</div>
                      <div className="text-[11px] text-slate-500">CI: {item.clientCedula}</div>
                    </td>

                    {/* Contacto */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.clientPhone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate max-w-[150px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.clientEmail}</span>
                      </div>
                    </td>

                    {/* Programa */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{item.productName}</span>
                    </td>

                    {/* Fecha Prometida */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {item.promisedDate}
                    </td>

                    {/* Días Mora */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.daysLate > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {item.daysLate} días de mora
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Plazo vigente
                        </span>
                      )}
                    </td>

                    {/* Monto Esperado */}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      ${item.expectedAmount.toFixed(2)}
                    </td>

                    {/* Saldo Deuda */}
                    <td className="py-3 px-4 text-right font-semibold text-rose-700 whitespace-nowrap">
                      ${item.pendingBalance.toFixed(2)}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {onRegisterPaymentForDebt && (
                          <button
                            type="button"
                            onClick={() => onRegisterPaymentForDebt(item.debtId, item.clientId)}
                            title="Registrar cobro para este alumno"
                            className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Cobrar</span>
                          </button>
                        )}

                        {item.clientPhone && item.clientPhone !== '-' && (
                          <a
                            href={`https://wa.me/${item.clientPhone.replace(/\D/g, '')}?text=Estimado(a)%20${encodeURIComponent(
                              item.clientName
                            )},%20le%20saludamos%20de%20CMC%20Cobranzas%20para%20recordarle%20su%20compromiso%20de%20pago%20pendiente.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                            title="Contactar vía WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

