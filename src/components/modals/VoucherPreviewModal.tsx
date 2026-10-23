import React from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Download, Printer, ShieldAlert } from 'lucide-react';
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
  if (!isOpen || !voucher) return null;

  const datos = voucher.datosExtraidos;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  {voucher.nombreArchivo}
                </h2>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Archivo Asociado
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Cargado el {voucher.fechaCarga} por {voucher.createdBy}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Simulation Notice */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Simulación de Demostración:</strong> Los datos OCR mostrados fueron extraídos
              por el motor local de muestra. No existe conexión con AWS Textract en este prototipo.
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Graphic Voucher Slip (Simulated receipt image) */}
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
            <div className="w-full max-w-xs bg-white rounded-xl shadow-md border border-slate-300 p-5 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <div className="text-sm font-bold tracking-wider text-slate-900">
                  {datos?.banco || payment?.bancoOrigen || 'COMPROBANTE BANCARIO'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">COMPROBANTE ELECTRÓNICO DE PAGO</div>
                <div className="text-[9px] text-slate-400">DOCUMENTO DE MUESTRA PARA VALIDACIÓN</div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Transacción:</span>
                  <span className="font-bold text-slate-900">
                    {datos?.numeroTransaccion || payment?.numeroTransaccion || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha / Hora:</span>
                  <span>{datos?.fecha || payment?.fechaPago || '2026-09-05'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ordenante:</span>
                  <span className="font-medium text-right truncate max-w-[150px]">
                    {datos?.ordenante || (client ? `${client.nombres} ${client.apellidos}` : 'N/A')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Referencia:</span>
                  <span className="text-right truncate max-w-[150px]">
                    {datos?.referencia || payment?.referencia || 'Matrícula curso'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Canal:</span>
                  <span>Banca Web / Móvil</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700">VALOR TOTAL:</span>
                <span className="text-base font-bold text-emerald-700 font-sans">
                  ${(datos?.monto || payment?.monto || 0).toFixed(2)} USD
                </span>
              </div>

              <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-100">
                *** OPERACIÓN EXITOSA (SIMULADA) ***
              </div>
            </div>

            <span className="text-[10px] text-slate-400 mt-3">
              Identificador de archivo: {voucher.id}
            </span>
          </div>

          {/* Right: Extracted OCR Metadata */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Datos Extraídos por OCR Simulado
                </h3>
                {datos && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Confianza: {datos.confianza}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Estos campos fueron autocompletados durante la carga del comprobante y confirmados por el usuario.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Entidad Bancaria:</span>
                <span className="font-semibold text-slate-900">{datos?.banco || 'No detectado'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Número de Transacción:</span>
                <span className="font-mono font-bold text-slate-900">
                  {datos?.numeroTransaccion || 'No detectado'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Monto Extraído:</span>
                <span className="font-bold text-emerald-700">
                  ${(datos?.monto || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Fecha Operación:</span>
                <span className="font-semibold text-slate-900">{datos?.fecha || 'No detectada'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Nombre Ordenante:</span>
                <span className="font-semibold text-slate-900">{datos?.ordenante || 'No detectado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referencia:</span>
                <span className="font-medium text-slate-800">{datos?.referencia || 'Sin referencia'}</span>
              </div>
            </div>

            {datos?.camposDudosos && datos.camposDudosos.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Campos con revisión requerida:</strong>{' '}
                  {datos.camposDudosos.join(', ')}
                </div>
              </div>
            )}

            {payment && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
                <div className="font-semibold">Estado de Conciliación del Pago:</div>
                <div className="text-[11px] text-indigo-700">
                  {payment.estadoConciliacion === 'conciliado_auto' && 'Conciliado automáticamente con extracto bancario.'}
                  {payment.estadoConciliacion === 'conciliado_manual' && 'Conciliado manualmente con observación.'}
                  {payment.estadoConciliacion === 'pendiente' && 'Pendiente de conciliar con extracto bancario.'}
                  {payment.estadoConciliacion === 'con_diferencias' && 'Presenta diferencia de monto con el banco.'}
                  {payment.estadoConciliacion === 'no_encontrado' && 'No encontrado en el último extracto bancario.'}
                  {payment.estadoConciliacion === 'revision_manual' && 'Requiere revisión manual por coincidencia dudosa.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>
    </div>
  );
};
