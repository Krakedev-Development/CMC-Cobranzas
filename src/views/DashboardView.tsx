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

interface DashboardViewProps {
  onNavigate: (module: ModuleName) => void;
  onViewVoucher: (payment: Payment) => void;
  onOpenValidationModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onViewVoucher,
  onOpenValidationModal,
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
      {/* Simulation Banner Notice */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs text-indigo-950 leading-relaxed">
            <strong>Prototipo Funcional de Demostración:</strong> Todos los datos, clientes, pagos, comprobantes
            y conciliaciones están precargados y se recalculan en tiempo real con persistencia local.
          </p>
        </div>
        <button
          onClick={onOpenValidationModal}
          className="px-3 py-1.5 bg-white hover:bg-indigo-100/50 text-indigo-700 border border-indigo-300 rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ver temas pendientes con Chris</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Cartera Pendiente */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cartera Pendiente</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              ${totalCarteraPendiente.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              De un total acordado de ${(totalRecaudado + totalCarteraPendiente).toFixed(2)}
            </p>
          </div>
        </div>

        {/* KPI 2: Total Recaudado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Recaudado</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              ${totalRecaudado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
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
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Por Conciliar</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700 tabular-nums flex items-baseline gap-2">
              <span>{pendingPaymentsCount}</span>
              <span className="text-xs font-normal text-slate-500">pagos</span>
            </div>
            {differencePaymentsCount > 0 && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {differencePaymentsCount} con diferencia detectada
              </p>
            )}
            {differencePaymentsCount === 0 && (
              <p className="text-[11px] text-slate-500 mt-1">Listo para cruce automático</p>
            )}
          </div>
        </div>

        {/* KPI 4: Movimientos Bancarios sin Asignar */}
        <div
          onClick={() => onNavigate('conciliacion')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Banco sin Asignar</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700 tabular-nums flex items-baseline gap-2">
              <span>{unassignedMovementsCount}</span>
              <span className="text-xs font-normal text-slate-500">movimientos</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Extractos bancarios demo</p>
          </div>
        </div>

        {/* KPI 5: Facturas Pendientes */}
        <div
          onClick={() => onNavigate('facturas')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Facturas Pendientes</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums flex items-baseline gap-2">
              <span>{pendingInvoicesCount}</span>
              <span className="text-xs font-normal text-slate-500">por registrar</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Registro documental físico</p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('pagos')}
          className="p-3.5 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Registrar Pago
            </span>
            <span className="text-[11px] text-slate-500">Con OCR simulado</span>
          </div>
          <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('conciliacion')}
          className="p-3.5 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Conciliación Bancaria
            </span>
            <span className="text-[11px] text-slate-500">Cruce automático & manual</span>
          </div>
          <Scale className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('deudas')}
          className="p-3.5 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Importar Deudas
            </span>
            <span className="text-[11px] text-slate-500">Excel masivo de alumnos</span>
          </div>
          <Receipt className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </button>

        <button
          onClick={() => onNavigate('auditoria')}
          className="p-3.5 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl flex items-center justify-between group shadow-xs transition-all text-left"
        >
          <div>
            <span className="block text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Ver Auditoría
            </span>
            <span className="text-[11px] text-slate-500">Trazabilidad inmutable</span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
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
                        className="bg-indigo-600 h-2 rounded-full transition-all"
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
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver todos los pagos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Monto</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Transacción / Banco</th>
                  <th className="py-2.5 px-3">Conciliación</th>
                  <th className="py-2.5 px-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.map((p) => {
                  const client = clients.find((c) => c.id === p.clienteId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {client ? `${client.nombres} ${client.apellidos}` : p.clienteId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                        ${p.monto.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{p.fechaPago}</td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        <span className="font-mono">{p.numeroTransaccion || 'S/N'}</span>
                        {p.bancoOrigen && <span className="text-slate-400 text-[11px] block">{p.bancoOrigen}</span>}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {p.estadoConciliacion === 'conciliado_auto' && (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                            Conciliado Auto
                          </span>
                        )}
                        {p.estadoConciliacion === 'conciliado_manual' && (
                          <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                            Conciliado Manual
                          </span>
                        )}
                        {p.estadoConciliacion === 'pendiente' && (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            Pendiente
                          </span>
                        )}
                        {p.estadoConciliacion === 'con_diferencias' && (
                          <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            Diferencia
                          </span>
                        )}
                        {p.estadoConciliacion === 'no_encontrado' && (
                          <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            No Encontrado
                          </span>
                        )}
                        {p.estadoConciliacion === 'revision_manual' && (
                          <span className="text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                            Revisión Manual
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {p.comprobanteId ? (
                          <button
                            onClick={() => onViewVoucher(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Sin archivo</span>
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
