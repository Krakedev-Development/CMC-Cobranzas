import React from 'react';
import { X } from 'lucide-react';
import { Client } from '../../../types';

interface ClientDetailsHeaderProps {
  client: Client;
  onClose: () => void;
}

export const ClientDetailsHeader: React.FC<ClientDetailsHeaderProps> = ({ client, onClose }) => {
  return (
    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          {client.nombres[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {client.nombres} {client.apellidos}
            </h2>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              {client.estado}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cédula: {client.cedula} · Tel: {client.telefono}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors"
        title="Cerrar modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

