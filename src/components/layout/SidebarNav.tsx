import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  CreditCard,
  Scale,
  FileText,
  BarChart3,
  ShieldCheck,
  History,
  Pin,
  PinOff,
  Menu,
  X,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { ModuleName } from '../../types';
import { useApp } from '../../context/AppContext';

interface SidebarNavProps {
  currentModule: ModuleName;
  onSelectModule: (module: ModuleName) => void;
  onOpenValidationModal: () => void;
  onOpenResetModal: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentModule,
  onSelectModule,
  onOpenValidationModal,
  onOpenResetModal,
  isExpanded,
  setIsExpanded,
}) => {
  const {
    currentUser,
    users,
    setCurrentUserId,
    hasPermission,
    payments,
    bankMovements,
    isNavPinned,
    setIsNavPinned,
  } = useApp();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute live badges
  const pendingPaymentsCount = payments.filter(
    (p) => p.estadoRegistro !== 'anulado' && p.estadoConciliacion === 'pendiente'
  ).length;

  const unassignedMovementsCount = bankMovements.filter((m) => m.estado === 'sin_asignar').length;

  const navItems: Array<{
    id: ModuleName;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Inicio / Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'productos', label: 'Productos', icon: Package },
    {
      id: 'deudas',
      label: 'Deudas, Pagos y Cobranzas',
      icon: Receipt,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'conciliacion',
      label: 'Conciliación Bancaria',
      icon: Scale,
      badge: unassignedMovementsCount > 0 ? unassignedMovementsCount : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    { id: 'facturas', label: 'Facturas y Documentos', icon: FileText },
    { id: 'reportes', label: 'Reportes y Exportación', icon: BarChart3 },
    { id: 'usuarios', label: 'Usuarios y Permisos', icon: ShieldCheck },
    { id: 'auditoria', label: 'Auditoría (Solo lectura)', icon: History },
  ];

  // Hover handlers with debounce
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (!isNavPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (isNavPinned) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleItemClick = (id: ModuleName) => {
    onSelectModule(id);
    setIsMobileOpen(false);
    if (!isNavPinned) {
      setTimeout(() => {
        setIsExpanded(false);
      }, 300);
    }
  };

  const effectiveExpanded = isNavPinned || isExpanded;

  return (
    <>
      {/* Mobile Drawer Trigger (Floating on Top Left of screen for mobile) */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={isMobileOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral izquierdo'}
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Left-Hand Navigation Bar Container */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-40 flex flex-col justify-between shadow-xl transition-all duration-300 ease-in-out ${
          // Mobile responsive drawer
          isMobileOpen
            ? 'translate-x-0 w-80'
            : '-translate-x-full md:translate-x-0'
        } ${
          // Desktop compact vs expanded
          effectiveExpanded ? 'md:w-72' : 'md:w-18'
        }`}
        aria-label="Navegación principal lateral izquierda"
      >
        {/* Header of the Left Navbar */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            {effectiveExpanded && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="block font-bold text-sm text-slate-900 leading-tight">
                  Cobranzas & Trazabilidad
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Prototipo Operativo
                </span>
              </div>
            )}
          </div>

          {/* Desktop Pin / Unpin Button */}
          {effectiveExpanded && (
            <button
              onClick={() => setIsNavPinned(!isNavPinned)}
              title={isNavPinned ? 'Desfijar barra lateral (se contraerá automáticamente)' : 'Fijar barra lateral abierta'}
              className={`hidden md:flex p-1.5 rounded-lg border transition-colors ${
                isNavPinned
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {isNavPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Current Demo User Switcher Bar */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
          {effectiveExpanded ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                <span>Usuario activo (Demo):</span>
                <span className="text-indigo-600 font-semibold">{currentUser.cargo}</span>
              </div>
              <div className="relative">
                <select
                  value={currentUser.id}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  title="Cambiar usuario para probar permisos"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.username}) - {u.perfilBase || 'Personalizado'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`Usuario: ${currentUser.nombre} (${currentUser.username})`}>
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold uppercase">
                {currentUser.username.slice(0, 2)}
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation Modules */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const hasView = hasPermission(item.id, 'ver');
            const isActive = currentModule === item.id;
            const IconComponent = item.icon;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item.id)}
                  onMouseEnter={() => setHoveredModule(item.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                  disabled={!hasView}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : hasView
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-300 hover:text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="shrink-0 relative">
                    <IconComponent
                      className={`w-5 h-5 ${
                        isActive
                          ? 'text-white'
                          : hasView
                          ? 'text-slate-500 group-hover:text-slate-900'
                          : 'text-slate-300'
                      }`}
                    />
                    {/* Compact badge pill */}
                    {!effectiveExpanded && item.badge !== undefined && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {effectiveExpanded && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {!hasView && effectiveExpanded && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                      Restringido
                    </span>
                  )}
                </button>

                {/* Tooltip on Compact mode (shown on the RIGHT side of the left navbar) */}
                {!effectiveExpanded && (
                  <div className="hidden md:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
                    <div className="bg-slate-900 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
                      <span>{item.label}</span>
                      {!hasView && (
                        <span className="text-amber-300 text-[10px] font-normal">(Sin permiso)</span>
                      )}
                      {item.badge !== undefined && (
                        <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions: Reset Demo & Chris Validation Points */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/70">
          <button
            onClick={onOpenValidationModal}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors ${
              effectiveExpanded ? 'justify-start' : 'justify-center'
            }`}
            title="Puntos pendientes de validación con Chris"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            {effectiveExpanded && <span className="truncate">Pendientes con Chris (Sec. 13)</span>}
          </button>

          <button
            onClick={onOpenResetModal}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium border border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100/70 transition-colors ${
              effectiveExpanded ? 'justify-start' : 'justify-center'
            }`}
            title="Restaurar datos de demostración a su estado inicial coherente"
          >
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            {effectiveExpanded && <span className="truncate">Restaurar datos demo</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
