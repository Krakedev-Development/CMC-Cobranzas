import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({ isOpen, onClose }) => {
  const { resetToDemoData } = useApp();

  if (!isOpen) return null;

  const handleConfirm = () => {
    resetToDemoData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Restaurar Datos de Demostración</h2>
              <p className="text-xs text-slate-500">Acción confirmada de restablecimiento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Esta acción restablecerá los <strong>20 clientes</strong>, <strong>3 productos</strong>,
              deudas con los saldos iniciales (incluyendo el caso de Carlos Mendoza con $540 de saldo),
              los pagos de ejemplo, los movimientos bancarios y la auditoría inicial.
            </p>
          </div>
          <p>
            Cualquier pago nuevo, cliente creado o permiso modificado durante la sesión volverá a su estado
            coherente original especificado.
          </p>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Sí, restaurar datos
          </button>
        </div>
      </div>
    </div>
  );
};
