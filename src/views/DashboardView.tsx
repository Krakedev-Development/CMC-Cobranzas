import React from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Scale,
  FileQuestion,
  CreditCard,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  Users,
  CheckCircle2,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { ModuleName, Payment } from '../types';
import { renderBankBadge } from './BankReconciliationView';

interface DashboardViewProps {
  onNavigate: (module: ModuleName) => void;
  onViewVoucher: (payment: Payment) => void;
  onOpenValidationModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onViewVoucher,
}) => {
  const {
    debts,
    payments,
    bankMovements,
    invoices,
    products,
    clients,
    getDebtFinancials,
  } = useApp();

  // Financial calculations
  let totalCarteraPendiente = 0;
  let totalRecaudado = 0;
  let totalNominal = 0;

  debts.forEach((debt) => {
    if (debt.estado !== 'anulada') {
      totalNominal += debt.precioNominalAplicado;
      const fin = getDebtFinancials(debt.id);
      if (fin) {
        totalRecaudado += fin.validPaymentsTotal;
        totalCarteraPendiente += fin.saldoPendiente;
      }
    }
  });

  const pendingPaymentsCount = payments.filter(
    (p) => p.estadoRegistro !== 'anulado' && p.estadoConciliacion === 'pendiente'
  ).length;

  const differencePaymentsCount = payments.filter(
    (p) => p.estadoRegistro !== 'anulado' && p.estadoConciliacion === 'con_diferencias'
  ).length;

  const unassignedMovementsCount = bankMovements.filter((m) => m.estado === 'sin_asignar').length;

  const pendingInvoicesCount = invoices.filter((i) => i.estadoDocumental === 'pendiente_registrar').length;

  const recentPayments = [...payments]
    .filter((p) => p.estadoRegistro !== 'anulado')
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Institutional Clear Minds Welcome Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 p-2 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/assets/clear-minds-isotipo-transparent.png"
              alt="Clear Minds"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                Sistema Integral de Cobranzas
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Clear Minds Consultores</span>
              <span className="text-xs text-slate-300 hidden sm:inline">·</span>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline">
                Lunes, 16 de noviembre de 2026
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Control de Cartera Educativa, Recaudación y Trazabilidad
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión unificada de pagos, conciliación bancaria automatizada y emisión de comprobantes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={() => onNavigate('flujo_efectivo')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <span>Flujo de Caja</span>
          </button>
          <button
            onClick={() => onNavigate('deudas')}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>Gestionar Cuentas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Cartera Pendiente */}
        <div className="relative overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-amber-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cartera Pendiente</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900 tabular-nums">
              ${totalCarteraPendiente.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              De ${(totalRecaudado + totalCarteraPendiente).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} acordados
            </p>
          </div>
        </div>

        {/* KPI 2: Total Recaudado */}
        <div className="relative overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-emerald-500">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Recaudado</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-700 tabular-nums">
              ${totalRecaudado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((totalRecaudado / (totalRecaudado + totalCarteraPendiente || 1)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Pagos por Conciliar */}
        <div
          onClick={() => onNavigate('conciliacion')}
          className="relative overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-sky-300 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-sky-500"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Por Conciliar</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900 tabular-nums flex items-baseline gap-1.5">
              <span>{pendingPaymentsCount}</span>
              <span className="text-xs font-medium text-slate-500">vouchers</span>
            </div>
            {differencePaymentsCount > 0 && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {differencePaymentsCount} con diferencia detectada
              </p>
            )}
            {differencePaymentsCount === 0 && (
              <p className="text-[11px] text-slate-500 mt-1">Listos para cruce automático</p>
            )}
          </div>
        </div>

        {/* KPI 4: Movimientos Bancarios sin Asignar */}
        <div
          onClick={() => onNavigate('conciliacion')}
          className="relative overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-blue-600"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Banco sin Asignar</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-blue-700 tabular-nums flex items-baseline gap-1.5">
              <span>{unassignedMovementsCount}</span>
              <span className="text-xs font-medium text-slate-500">huérfanos</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Extractos pendientes de alumno</p>
          </div>
        </div>

        {/* KPI 5: Facturas Pendientes */}
        <div
          onClick={() => onNavigate('facturas')}
          className="relative overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Facturas Pendientes</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-slate-800 tabular-nums flex items-baseline gap-1.5">
              <span>{pendingInvoicesCount}</span>
              <span className="text-xs font-medium text-slate-500">por registrar</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Registro documental físico</p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('pagos')}
          className="p-3.5 bg-white border border-slate-200 hover:border-sky-400 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              Registrar Pago
            </span>
            <span className="text-[11px] text-slate-500">Comprobantes y abonos</span>
          </div>
          <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('conciliacion')}
          className="p-3.5 bg-white border border-slate-200 hover:border-sky-400 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              Conciliación Bancaria
            </span>
            <span className="text-[11px] text-slate-500">Cruce automático & manual</span>
          </div>
          <Scale className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('deudas')}
          className="p-3.5 bg-white border border-slate-200 hover:border-sky-400 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              Importar Deudas
            </span>
            <span className="text-[11px] text-slate-500">Excel masivo de alumnos</span>
          </div>
          <Receipt className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('auditoria')}
          className="p-3.5 bg-white border border-slate-200 hover:border-sky-400 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              Ver Auditoría
            </span>
            <span className="text-[11px] text-slate-500">Trazabilidad inmutable</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
        </button>
      </div>

      {/* Product Breakdown & Pending Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recaudación por Producto */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Recaudación por Programa</h2>
            <p className="text-xs text-slate-500 mb-4">Estado de cartera según programas educativos</p>

            <div className="space-y-4">
              {products.map((prod) => {
                const prodDebts = debts.filter((d) => d.productoId === prod.id && d.estado !== 'anulada');
                let prodRecaudado = 0;
                let prodAcordado = 0;
                prodDebts.forEach((d) => {
                  prodAcordado += d.precioAcordado;
                  const f = getDebtFinancials(d.id);
                  if (f) prodRecaudado += f.validPaymentsTotal;
                });
                const pct = prodAcordado > 0 ? Math.round((prodRecaudado / prodAcordado) * 100) : 0;

                return (
                  <div key={prod.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{prod.nombre}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ${prodRecaudado.toFixed(0)} / ${prodAcordado.toFixed(0)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{prodDebts.length} inscripciones</span>
                      <span>Pendiente: ${(prodAcordado - prodRecaudado).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('productos')}
              className="text-xs font-bold text-slate-900 hover:text-sky-600 flex items-center gap-1"
            >
              <span>Ver catálogo de programas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pagos Registrados Recientes</h2>
              <p className="text-xs text-slate-500">Últimos movimientos con comprobante y estado de conciliación</p>
            </div>
            <button
              onClick={() => onNavigate('pagos')}
              className="text-xs font-bold text-slate-900 hover:text-sky-600 flex items-center gap-1"
            >
              <span>Ver todos los pagos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/50">
                  <th className="py-2.5 px-3">Alumno</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Transacción / Banco</th>
                  <th className="py-2.5 px-3">Conciliación</th>
                  <th className="py-2.5 px-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => {
                  const client = clients.find((c) => c.id === p.clienteId);
                  const initials = client
                    ? `${client.nombres[0] || ''}${client.apellidos[0] || ''}`.toUpperCase()
                    : 'AL';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/80 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {client ? `${client.nombres} ${client.apellidos}` : p.clienteId}
                            </div>
                            {client?.cedula && (
                              <div className="text-[10px] text-slate-400 font-mono">CI: {client.cedula}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-700 whitespace-nowrap">
                        ${p.monto.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {p.fechaPago}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono font-bold text-[11px] text-slate-900">
                            {p.numeroTransaccion || 'S/N'}
                          </span>
                          {p.bancoOrigen && renderBankBadge(p.bancoOrigen)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {p.estadoConciliacion === 'conciliado_auto' && (
                          <span className="text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-lg text-[11px] border border-teal-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            Auto
                          </span>
                        )}
                        {p.estadoConciliacion === 'conciliado_manual' && (
                          <span className="text-sky-900 font-bold bg-sky-50 px-2 py-0.5 rounded-lg text-[11px] border border-sky-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-sky-600" />
                            Manual
                          </span>
                        )}
                        {p.estadoConciliacion === 'pendiente' && (
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-lg text-[11px] border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente
                          </span>
                        )}
                        {p.estadoConciliacion === 'con_diferencias' && (
                          <span className="text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded-lg text-[11px] border border-rose-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Diferencia
                          </span>
                        )}
                        {p.estadoConciliacion === 'no_encontrado' && (
                          <span className="text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] border border-slate-200">
                            No Encontrado
                          </span>
                        )}
                        {p.estadoConciliacion === 'revision_manual' && (
                          <span className="text-amber-900 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg text-[11px] border border-amber-200">
                            Revisión Manual
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {p.comprobanteId ? (
                          <button
                            onClick={() => onViewVoucher(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl text-[11px] font-bold border border-slate-200 transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sin archivo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
