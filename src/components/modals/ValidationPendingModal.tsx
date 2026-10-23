import React from 'react';
import { X, HelpCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

interface ValidationPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ValidationPendingModal: React.FC<ValidationPendingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const points = [
    {
      num: 1,
      title: '¿Un pago puede cubrir varias deudas simultáneamente?',
      desc: 'En esta versión 1, cada pago se aplica estrictamente a una única deuda/producto. Queda pendiente definir la regla de prorrateo o aplicación en cascada para fases futuras.',
      status: 'Regla V1: 1 pago = 1 deuda',
    },
    {
      num: 2,
      title: '¿Qué métodos de pago adicionales deben aceptarse?',
      desc: 'Actualmente se soportan transferencias y depósitos como métodos principales, con efectivo y otros como secundarios sujetos a verificación manual.',
      status: 'En validación',
    },
    {
      num: 3,
      title: '¿Formatos bancarios reales y mapeo de columnas?',
      desc: 'Se modeló un formato estándar con: Fecha, Monto, Número de Transacción, Referencia, Ordenante y Banco. Pendiente recopilar extractos reales de Banco Pichincha, Guayaquil y Produbanco.',
      status: 'Plantilla estándar provista',
    },
    {
      num: 4,
      title: '¿Política de conciliación automática definitiva?',
      desc: 'La regla aplicada exige coincidencia exacta de número de transacción Y monto coherente. Pendiente confirmar si se amplía a coincidencias por fecha + nombre de ordenante.',
      status: 'Regla estricta unívoca activa',
    },
    {
      num: 5,
      title: '¿Relación entre facturas y deudas/pagos?',
      desc: 'En el prototipo la factura se asocia documentalmente a una deuda y se consulta desde el cliente. Queda validar si una factura puede agrupar múltiples cuotas o pagos.',
      status: 'Modelo ampliable preparado',
    },
    {
      num: 6,
      title: '¿Flujo de aprobación para anulaciones o cambios financieros?',
      desc: 'Se implementó anulación con motivo obligatorio y trazabilidad completa en auditoría. Pendiente definir si requiere doble firma/aprobación por supervisor.',
      status: 'Anulación auditada activa',
    },
    {
      num: 7,
      title: '¿Permisos definitivos y quién puede exportar auditoría?',
      desc: 'Se diseñó una matriz 100% configurable sin tocar código con permisos de ver, crear, modificar, eliminar, aprobar y exportar por módulo.',
      status: 'Matriz granular operativa',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Puntos Pendientes de Validación con Chris
              </h2>
              <p className="text-xs text-slate-500">
                Decisiones de negocio identificadas en la Sección 13 de la especificación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Estado en el prototipo:</strong> Todas estas decisiones se encuentran
              resueltas con reglas predeterminadas coherentes y no bloquean el uso del sistema.
              Esta lista sirve como agenda de trabajo para la sesión de validación con la usuaria.
            </div>
          </div>

          <div className="space-y-3">
            {points.map((p) => (
              <div
                key={p.num}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {p.num}. {p.title}
                  </h3>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shrink-0">
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
