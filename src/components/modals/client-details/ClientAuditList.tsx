import React from 'react';
import { History } from 'lucide-react';
import { AuditLog } from '../../../types';

interface ClientAuditListProps {
  auditEvents: AuditLog[];
}

export const ClientAuditList: React.FC<ClientAuditListProps> = ({ auditEvents }) => {
  return (
    <div>
      <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
        <History className="w-4 h-4 text-slate-500" />
        Trazabilidad de Auditoría del Cliente
      </h3>

      <div className="space-y-2 border-l-2 border-slate-200 pl-3">
        {auditEvents.length === 0 ? (
          <p className="text-slate-400 text-xs">Sin registros de auditoría específicos.</p>
        ) : (
          auditEvents.map((aud) => (
            <div key={aud.id} className="text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 capitalize">{aud.accion}</span>
                <span className="text-[10px] text-slate-400">{aud.fechaHora}</span>
              </div>
              <div className="text-slate-600 text-[11px]">
                Por {aud.usuarioNombre} · {aud.motivo || 'Operación registrada'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

