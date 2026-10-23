import React from 'react';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RestrictedAccessViewProps {
  moduleName: string;
}

export const RestrictedAccessView: React.FC<RestrictedAccessViewProps> = ({ moduleName }) => {
  const { currentUser, setCurrentUserId } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Acceso Restringido</h2>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        El perfil actual <strong>{currentUser.nombre} ({currentUser.username})</strong> con rol{' '}
        <span className="text-indigo-600 font-semibold">{currentUser.cargo}</span> no cuenta con
        permiso de lectura para el módulo de <strong>{moduleName}</strong>.
      </p>

      <div className="mt-6 p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 w-full text-left">
        <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          Probar con otro usuario de demostración:
        </div>
        <p className="text-[11px] text-slate-500 mb-3">
          Puedes cambiar al usuario <strong>admin</strong> para administrar o conceder permisos a este rol:
        </p>
        <button
          onClick={() => setCurrentUserId('admin')}
          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <span>Cambiar a Administrador (admin)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
