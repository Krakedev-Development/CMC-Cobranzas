import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ModuleName } from '../../types';
import { useApp } from '../../context/AppContext';
import { Shield, Sparkles, ChevronRight, User, HelpCircle, RotateCcw, Bell, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface TopHeaderProps {
  currentModule: ModuleName;
  onOpenValidationModal: () => void;
  onOpenResetModal: () => void;
  onNavigateToModule?: (module: ModuleName) => void;
  isExpanded: boolean;
}

const MODULE_TITLES: Record<ModuleName, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Panel Principal de Cobranzas',
    subtitle: 'Resumen de cartera educativa, recaudación, estados de conciliación y facturas',
  },
  clientes: {
    title: 'Gestión de Clientes',
    subtitle: 'Ficha integral, historial de deudas, pagos, comprobantes y facturas asociadas',
  },
  productos: {
    title: 'Catálogo de Programas y Productos',
    subtitle: 'Configuración de programas educativos, precios nominales de lista y estados',
  },
  deudas: {
    title: 'Deudas, Adquisiciones y Registro de Pagos',
    subtitle: 'Gestión unificada de cartera: asociación de productos, registro directo de pagos, facturas e historial de abonos',
  },
  pagos: {
    title: 'Deudas, Adquisiciones y Registro de Pagos',
    subtitle: 'Gestión unificada de cartera: asociación de productos, registro directo de pagos, facturas e historial de abonos',
  },
  conciliacion: {
    title: 'Conciliación Bancaria',
    subtitle: 'Cruce unívoco de extractos bancarios con pagos y resolución de casos dudosos',
  },
  facturas: {
    title: 'Facturas y Documentos',
    subtitle: 'Registro documental de facturas físicas/externas vinculadas a deudas de clientes',
  },
  reportes: {
    title: 'Reportes y Analítica',
    subtitle: 'Consultas de cartera, trazabilidad por cliente y exportación real a formato CSV',
  },
  usuarios: {
    title: 'Administración de Usuarios y Permisos',
    subtitle: 'Simulador de roles y configuración granular de permisos por módulo y acción',
  },
  auditoria: {
    title: 'Registro de Auditoría y Trazabilidad',
    subtitle: 'Bitácora histórica inmutable de solo lectura con comparativa de valores antes/después',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentModule,
  onOpenValidationModal,
  onOpenResetModal,
  onNavigateToModule,
  isExpanded,
}) => {
  const { currentUser, debts, clients, products, getDebtFinancials } = useApp();
  const info = MODULE_TITLES[currentModule] || { title: 'Sistema de Cobranzas', subtitle: '' };

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute overdue debts
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const today = useMemo(() => new Date(), []);

  const overdueDebts = useMemo(() => {
    return debts
      .map((debt) => {
        const fin = getDebtFinancials(debt.id);
        const saldo = fin?.saldoPendiente ?? debt.precioAcordado;
        if (saldo <= 0.001 || debt.estado === 'pagada' || debt.estado === 'anulada') {
          return null;
        }

        const totalAbonado = fin?.validPaymentsTotal ?? 0;

        // 1. Si la deuda tiene cuotas configuradas:
        if (debt.cuotas && debt.cuotas.length > 0) {
          let acumuladoEsperado = 0;
          for (const cuota of debt.cuotas) {
            acumuladoEsperado += cuota.monto;
            if (cuota.fechaVencimiento < todayStr && totalAbonado < acumuladoEsperado - 0.01) {
              const dueDate = new Date(cuota.fechaVencimiento);
              const diffTime = Math.max(0, today.getTime() - dueDate.getTime());
              const daysDelayed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
              return {
                debt,
                saldo,
                daysDelayed,
                reason: `Cuota #${cuota.numero} vencida (${cuota.fechaVencimiento})`,
              };
            }
          }
        }

        // 2. Si tiene día de corte mensual:
        if (debt.diaCorte) {
          const currentDay = today.getDate();
          const acqDate = new Date(debt.fechaAdquisicion);
          const isPastMonth =
            today.getFullYear() > acqDate.getFullYear() ||
            (today.getFullYear() === acqDate.getFullYear() && today.getMonth() > acqDate.getMonth());

          if (isPastMonth || currentDay > debt.diaCorte) {
            const cutDate = new Date(today.getFullYear(), today.getMonth(), debt.diaCorte);
            if (today > cutDate) {
              const daysDelayed = Math.max(1, Math.floor((today.getTime() - cutDate.getTime()) / (1000 * 60 * 60 * 24)));
              return {
                debt,
                saldo,
                daysDelayed,
                reason: `Día de corte ${debt.diaCorte} mensual superado`,
              };
            }
          }
        }

        // 3. Deuda genérica tras 30 días:
        const acq = new Date(debt.fechaAdquisicion);
        const daysSinceAcq = Math.floor((today.getTime() - acq.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceAcq > 30) {
          return {
            debt,
            saldo,
            daysDelayed: daysSinceAcq - 30,
            reason: 'Pago de contado con más de 30 días de antigüedad',
          };
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.daysDelayed - a.daysDelayed);
  }, [debts, getDebtFinancials, todayStr, today]);

  const totalOverdueBalance = useMemo(() => {
    return overdueDebts.reduce((sum, item) => sum + item.saldo, 0);
  }, [overdueDebts]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Breadcrumb and View Title */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-medium">
            <span>Cobranzas & Trazabilidad</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-indigo-600 capitalize">{currentModule}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{info.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{info.subtitle}</p>
        </div>

        {/* Right zone: Overdue Notification Bell + Simulation Notice + User Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          {/* CAMPANA DE ALERTA DE COBRANZAS EN EL TOPBAR */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className={`relative p-2 rounded-xl transition-all border flex items-center justify-center ${
                overdueDebts.length > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title={
                overdueDebts.length > 0
                  ? `${overdueDebts.length} cuentas con cuotas o pagos en retraso`
                  : 'Sin alertas de mora activas'
              }
            >
              <Bell className={`w-5 h-5 ${overdueDebts.length > 0 ? 'animate-bounce text-rose-600' : ''}`} />
              {overdueDebts.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black border-2 border-white shadow-xs">
                  {overdueDebts.length}
                </span>
              )}
            </button>

            {/* Dropdown de Alertas en el Topbar */}
            {isAlertsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50 border-b border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Alertas de Pagos en Mora</h4>
                      <span className="text-[10px] text-slate-500">
                        {overdueDebts.length} cuotas/deudas vencidas
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold font-mono text-rose-700">
                    ${totalOverdueBalance.toFixed(2)}
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {overdueDebts.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs italic">
                      No hay pagos ni cuotas atrasadas al momento
                    </div>
                  ) : (
                    overdueDebts.map(({ debt, saldo, daysDelayed, reason }) => {
                      const cl = clients.find((c) => c.id === debt.clienteId);
                      const pr = products.find((p) => p.id === debt.productoId);

                      return (
                        <div
                          key={debt.id}
                          onClick={() => {
                            setIsAlertsOpen(false);
                            if (onNavigateToModule) onNavigateToModule('deudas');
                          }}
                          className="p-3 hover:bg-slate-50 cursor-pointer transition-colors text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{cl ? `${cl.nombres} ${cl.apellidos}` : debt.clienteId}</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              {daysDelayed}d retraso
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {pr?.nombre || debt.productoId}
                          </div>
                          <div className="flex items-center justify-between text-[10px] pt-0.5 text-slate-400">
                            <span className="text-rose-600 font-medium">{reason}</span>
                            <span className="font-mono font-bold text-rose-700">
                              Saldo: ${saldo.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {overdueDebts.length > 0 && (
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setIsAlertsOpen(false);
                        if (onNavigateToModule) onNavigateToModule('deudas');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Ir a Cuentas por Cobrar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Modo Prototipo Interactivo</span>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase">
              {currentUser.username.slice(0, 2)}
            </div>
            <div className="text-left text-xs">
              <span className="block font-semibold text-indigo-950 leading-tight">
                {currentUser.nombre}
              </span>
              <span className="text-[11px] text-indigo-600 font-medium">
                {currentUser.cargo}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
