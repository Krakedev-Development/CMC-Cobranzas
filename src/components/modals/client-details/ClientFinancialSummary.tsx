import React from 'react';

interface ClientFinancialSummaryProps {
  totalPrecioNominal: number;
  totalPrecioAcordado: number;
  totalPagado: number;
  saldoPendienteTotal: number;
}

export const ClientFinancialSummary: React.FC<ClientFinancialSummaryProps> = ({
  totalPrecioNominal,
  totalPrecioAcordado,
  totalPagado,
  saldoPendienteTotal,
}) => {
  return (
    <div className="grid grid-cols-4 bg-slate-900 text-white p-4 text-center divide-x divide-slate-800 text-xs">
      <div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio Nominal</span>
        <span className="text-sm font-bold tabular-nums">
          ${totalPrecioNominal.toFixed(2)}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio Acordado</span>
        <span className="text-sm font-bold tabular-nums text-indigo-300">
          ${totalPrecioAcordado.toFixed(2)}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Pagado</span>
        <span className="text-sm font-bold tabular-nums text-emerald-400">
          ${totalPagado.toFixed(2)}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Saldo Pendiente</span>
        <span className="text-sm font-bold tabular-nums text-amber-400">
          ${saldoPendienteTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

