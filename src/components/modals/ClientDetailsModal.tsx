import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import { ClientDetailsHeader } from './client-details/ClientDetailsHeader';
import { ClientFinancialSummary } from './client-details/ClientFinancialSummary';
import { ClientProgramsList } from './client-details/ClientProgramsList';
import { ClientPaymentsList } from './client-details/ClientPaymentsList';
import { ClientInvoicesList } from './client-details/ClientInvoicesList';
import { ClientAuditList } from './client-details/ClientAuditList';

export interface ClientDetailsModalProps {
  isOpen: boolean;
  clientId: string | null;
  onClose: () => void;
  onRegisterPayment?: (clientId: string) => void;
  onViewVoucher?: (payment: Payment) => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  clientId,
  onClose,
  onRegisterPayment,
  onViewVoucher,
}) => {
  const { getClientFinancials, getDebtFinancials, auditLogs } = useApp();

  const financials = useMemo(() => {
    if (!isOpen || !clientId) return null;
    return getClientFinancials(clientId);
  }, [isOpen, clientId, getClientFinancials]);

  const clientAuditEvents = useMemo(() => {
    if (!clientId) return [];
    return auditLogs.filter(
      (log) =>
        log.entidadId === clientId ||
        log.valoresNuevos?.clienteId === clientId ||
        log.valoresNuevos?.cliente?.includes(financials?.client.apellidos || '')
    );
  }, [clientId, auditLogs, financials]);

  if (!isOpen || !financials) return null;

  const handleRegisterPayment = () => {
    onClose();
    onRegisterPayment?.(financials.client.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <ClientDetailsHeader client={financials.client} onClose={onClose} />

        <ClientFinancialSummary
          totalPrecioNominal={financials.totalPrecioNominal}
          totalPrecioAcordado={financials.totalPrecioAcordado}
          totalPagado={financials.totalPagado}
          saldoPendienteTotal={financials.saldoPendienteTotal}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          <ClientProgramsList
            deudas={financials.deudas}
            onRegisterPayment={onRegisterPayment ? handleRegisterPayment : undefined}
            getDebtFinancials={getDebtFinancials}
          />

          <ClientPaymentsList pagos={financials.pagos} onViewVoucher={onViewVoucher} />

          <ClientInvoicesList facturas={financials.facturas} />

          <ClientAuditList auditEvents={clientAuditEvents} />
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};

