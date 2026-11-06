import React from 'react';
import { X, FileText, CheckCircle2, Download, Printer, ExternalLink, ShieldCheck } from 'lucide-react';
import { Voucher, Payment, Client } from '../../types';

interface VoucherPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher?: Voucher;
  payment?: Payment;
  client?: Client;
}

export const VoucherPreviewModal: React.FC<VoucherPreviewModalProps> = ({
  isOpen,
  onClose,
  voucher,
  payment,
  client,
}) => {
  if (!isOpen || (!voucher && !payment)) return null;

  const datos = voucher?.datosExtraidos;
  const fileName =
    voucher?.nombreArchivo ||
    (payment?.numeroTransaccion
      ? `Comprobante_${payment.numeroTransaccion}.pdf`
      : 'Recibo_Oficial_Pago.pdf');
  const isAttachedFile = !!voucher?.nombreArchivo;
  const clientName = client
    ? `${client.nombres} ${client.apellidos}`
    : datos?.ordenante || 'Alumno Registrado';
  const displayAmount = (datos?.monto || payment?.monto || 0).toFixed(2);
  const displayBank = datos?.banco || payment?.bancoOrigen || 'Caja / Banco Institucional';
  const displayTx = datos?.numeroTransaccion || payment?.numeroTransaccion || 'S/N';
  const displayDate = datos?.fecha || payment?.fechaPago?.slice(0, 10) || '2026-11-06';
  const displayRef = datos?.referencia || payment?.referencia || 'Abono a Cartera Educativa';
  const fileUrl = (payment as any)?.comprobanteUrl || voucher?.archivoDemoUrl;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{fileName}</h2>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                  {isAttachedFile ? 'Archivo Respaldado' : 'Recibo Oficial Digital'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Registrado el {displayDate} · CMC Cobranzas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Graphic Voucher Slip */}
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
            <div className="w-full max-w-xs bg-white rounded-xl shadow-md border border-slate-300 p-5 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <div className="text-sm font-bold tracking-wider text-slate-900 uppercase">
                  {displayBank}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">COMPROBANTE DE PAGO</div>
                <div className="text-[9px] text-sky-600 font-bold mt-0.5 tracking-wider">
                  CLEARMINDS CONSULTORES - CMC COBRANZAS
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Transacción:</span>
                  <span className="font-bold text-slate-900 font-mono">{displayTx}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha / Hora:</span>
                  <span>{displayDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alumno:</span>
                  <span className="font-semibold text-right truncate max-w-[150px]">{clientName}</span>
                </div>
                {client?.cedula && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cédula:</span>
                    <span className="font-mono">{client.cedula}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Referencia:</span>
                  <span className="text-right truncate max-w-[150px]">{displayRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Forma de Pago:</span>
                  <span className="capitalize">{payment?.metodo || 'Transferencia'}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700">VALOR TOTAL:</span>
                <span className="text-base font-extrabold text-emerald-700 font-sans">
                  ${displayAmount} USD
                </span>
              </div>

              <div className="text-center text-[9px] text-emerald-700 font-bold pt-2 border-t border-slate-100 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>TRANSACCIÓN REGISTRADA Y VALIDADA</span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 mt-3 font-mono">
              ID Registro: {payment?.id || voucher?.id || 'N/A'}
            </span>
          </div>

          {/* Right: Accounting & Conciliation Metadata */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Detalles Contables y Conciliación</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verificado
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Información registrada en el libro mayor y vinculada a la cuenta por cobrar del alumno.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Entidad / Canal:</span>
                <span className="font-semibold text-slate-900">{displayBank}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">N° Transacción:</span>
                <span className="font-mono font-bold text-slate-900">{displayTx}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Monto Acreditado:</span>
                <span className="font-bold text-emerald-700">${displayAmount} USD</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Fecha Efectiva:</span>
                <span className="font-semibold text-slate-900">{displayDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Beneficiario:</span>
                <span className="font-semibold text-slate-900">ClearMinds Consultores CMC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referencia:</span>
                <span className="font-medium text-slate-800">{displayRef}</span>
              </div>
            </div>

            {payment && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-slate-900">Estado de Conciliación:</div>
                <div className="text-[11px] text-slate-700">
                  {payment.estadoConciliacion === 'conciliado_auto' &&
                    '✓ Conciliado automáticamente con extracto bancario.'}
                  {payment.estadoConciliacion === 'conciliado_manual' &&
                    '✓ Conciliado manualmente por el operador de tesorería.'}
                  {payment.estadoConciliacion === 'pendiente' &&
                    '⏳ Pendiente de contrastar con el próximo extracto bancario.'}
                  {payment.estadoConciliacion === 'con_diferencias' &&
                    '⚠ Presenta diferencia de valor con el extracto bancario.'}
                  {payment.estadoConciliacion === 'no_encontrado' &&
                    'ℹ No localizado en el extracto del día; requiere verificación.'}
                </div>
              </div>
            )}

            {fileUrl && !fileUrl.startsWith('demo://') && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Archivo Original en Almacenamiento R2</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir Recibo</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar Comprobante
          </button>
        </div>
      </div>
    </div>
  );
};
