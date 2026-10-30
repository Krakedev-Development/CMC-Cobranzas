import React from 'react';
import { CreditCard, Eye } from 'lucide-react';
import { Payment } from '../../../types';

interface ClientPaymentsListProps {
  pagos: Payment[];
  onViewVoucher?: (payment: Payment) => void;
}

export const ClientPaymentsList: React.FC<ClientPaymentsListProps> = ({ pagos, onViewVoucher }) => {
  return (
    <div>
      <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
        <CreditCard className="w-4 h-4 text-emerald-600" />
        Historial de Pagos ({pagos.length})
      </h3>

      {pagos.length === 0 ? (
        <p className="text-slate-400 text-xs italic">No hay pagos registrados para este cliente.</p>
      ) : (
        <div className="space-y-2">
          {pagos.map((p) => {
            const isReconciled =
              p.estadoConciliacion === 'conciliado_auto' || p.estadoConciliacion === 'conciliado_manual';

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  p.estadoRegistro === 'anulado'
                    ? 'bg-rose-50/50 border-rose-200 opacity-60'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">${p.monto.toFixed(2)}</span>
                    <span className="text-slate-500">· {p.fechaPago}</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      [{p.numeroTransaccion || 'Sin TX'}]
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.metodo} · {p.bancoOrigen || 'Sin banco especificado'}
                  </div>
                  {p.motivoAnulacion && (
                    <div className="text-[10px] text-rose-600 font-medium mt-1">
                      Anulado: {p.motivoAnulacion}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      isReconciled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {p.estadoConciliacion}
                  </span>

                  {p.comprobanteId && onViewVoucher && (
                    <button
                      onClick={() => onViewVoucher(p)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Comprobante
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

