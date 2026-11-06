import React from 'react';
import { ShieldAlert, ArrowLeft, ShieldCheck, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RestrictedAccessViewProps {
  moduleName: string;
  onNavigateToDashboard?: () => void;
}

export const RestrictedAccessView: React.FC<RestrictedAccessViewProps> = ({
  moduleName,
  onNavigateToDashboard,
}) => {
  const { currentUser, setCurrentUserId, logout } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Acceso Restringido</h2>

      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        El usuario <strong>{currentUser.nombre} (@{currentUser.username})</strong> con cargo{' '}
        <span className="text-slate-900 font-bold">{currentUser.cargo}</span> no cuenta con
        permisos suficientes para acceder al módulo de <strong>{moduleName}</strong>.
      </p>

      <div className="mt-6 flex flex-col gap-2.5 w-full">
        {onNavigateToDashboard && (
          <button
            onClick={onNavigateToDashboard}
            className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel Principal</span>
          </button>
        )}

        {currentUser.username !== 'admin' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-left">
            <div className="text-[11px] text-slate-500">
              ¿Necesitas administrar permisos o acceder como Administrador?
            </div>
            <button
              onClick={() => setCurrentUserId('admin')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Acceder como Admin</span>
            </button>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full py-2 px-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
