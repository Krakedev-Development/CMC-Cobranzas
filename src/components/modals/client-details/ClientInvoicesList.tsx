import React from 'react';
import { FileText } from 'lucide-react';
import { Invoice } from '../../../types';

interface ClientInvoicesListProps {
  facturas: Invoice[];
}

export const ClientInvoicesList: React.FC<ClientInvoicesListProps> = ({ facturas }) => {
  return (
    <div>
      <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
        <FileText className="w-4 h-4 text-purple-600" />
        Facturas Registradas ({facturas.length})
      </h3>

      {facturas.length === 0 ? (
        <p className="text-slate-400 text-xs italic">
          Sin facturas físicas/externas registradas para este cliente.
        </p>
      ) : (
        <div className="space-y-2">
          {facturas.map((inv) => (
            <div
              key={inv.id}
              className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-xs"
            >
              <div>
                <div className="font-bold text-slate-900 font-mono">{inv.numeroFactura}</div>
                <div className="text-[11px] text-slate-500">
                  Fecha: {inv.fechaFactura} · Monto: ${(inv.monto || 0).toFixed(2)}
                </div>
                {inv.nombreArchivo && (
                  <div className="text-[10px] text-indigo-600 flex items-center gap-1 mt-0.5">
                    <FileText className="w-3 h-3" /> {inv.nombreArchivo}
                  </div>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  inv.estadoDocumental === 'registrada'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {inv.estadoDocumental}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

