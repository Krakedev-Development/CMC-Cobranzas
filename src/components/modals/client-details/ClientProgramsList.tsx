import React from 'react';
import { Receipt } from 'lucide-react';
import { Debt } from '../../../types';
import { DebtFinancialSummary } from '../../../context/AppContext';

interface ClientProgramsListProps {
  deudas: Debt[];
  onRegisterPayment?: () => void;
  getDebtFinancials: (debtId: string) => DebtFinancialSummary | null;
}

export const ClientProgramsList: React.FC<ClientProgramsListProps> = ({
  deudas,
  onRegisterPayment,
  getDebtFinancials,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-indigo-600" />
          Programas Adquiridos ({deudas.length})
        </h3>
        {onRegisterPayment && (
          <button
            onClick={onRegisterPayment}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-[11px] border border-indigo-200 transition-colors"
          >
            + Registrar Pago para este alumno
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {deudas.map((debt) => {
          const fin = getDebtFinancials(debt.id);
          const statusBadgeClass =
            debt.estado === 'pagada'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : debt.estado === 'parcial'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

          const statusLabel =
            debt.estado === 'pagada' ? 'Pagada' : debt.estado === 'parcial' ? 'Parcial' : 'Pendiente';

          return (
            <div
              key={debt.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {fin?.product?.nombre || debt.productoId}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Adquisición: {debt.fechaAdquisicion} · ID: {debt.id}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusBadgeClass}`}>
                  {statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-slate-200 text-center text-[11px]">
                <div>
                  <span className="text-slate-400 block">Acordado</span>
                  <span className="font-bold text-slate-800">${debt.precioAcordado.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Abonado</span>
                  <span className="font-bold text-emerald-600">
                    ${(fin?.validPaymentsTotal || 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Saldo</span>
                  <span className="font-bold text-amber-600">
                    ${(fin?.saldoPendiente || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {debt.observaciones && (
                <p className="text-[11px] text-slate-500 italic bg-white/60 p-1.5 rounded">
                  {debt.observaciones}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

