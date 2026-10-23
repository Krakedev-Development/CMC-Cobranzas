import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Package, Plus, Edit2, CheckCircle2, DollarSign, Users, AlertTriangle, X } from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, debts, addProduct, updateProduct, hasPermission } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precioNominal: '',
  });
  const [formError, setFormError] = useState('');

  const canCreate = hasPermission('productos', 'crear');
  const canModify = hasPermission('productos', 'modificar');

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ nombre: '', descripcion: '', precioNominal: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precioNominal: p.precioNominal.toString(),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const nominal = parseFloat(formData.precioNominal);
    if (!formData.nombre.trim()) {
      setFormError('El nombre del programa/producto es requerido.');
      return;
    }
    if (isNaN(nominal) || nominal <= 0) {
      setFormError('Ingrese un precio nominal válido mayor a 0.');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precioNominal: nominal,
      });
    } else {
      addProduct({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precioNominal: nominal,
        estado: 'activo',
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Catálogo de Programas Educativos y Productos</h2>
          <p className="text-xs text-slate-500">
            Define los precios nominales de lista que servirán de base para las deudas y acuerdos con clientes.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {products.map((prod) => {
          const associatedDebts = debts.filter((d) => d.productoId === prod.id && d.estado !== 'anulada');
          const totalAcordado = associatedDebts.reduce((sum, d) => sum + d.precioAcordado, 0);

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      prod.estado === 'activo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {prod.estado}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{prod.nombre}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                  {prod.descripcion}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-500">Precio Nominal:</span>
                    <span className="text-base font-bold text-slate-900 font-sans tabular-nums">
                      ${prod.precioNominal.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Inscripciones registradas:</span>
                    <span className="font-semibold text-slate-800">{associatedDebts.length} alumnos</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Total cartera acordada:</span>
                    <span className="font-semibold text-indigo-600 tabular-nums">
                      ${totalAcordado.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {canModify && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modificar</span>
                  </button>
                  <button
                    onClick={() =>
                      updateProduct(prod.id, {
                        estado: prod.estado === 'activo' ? 'inactivo' : 'activo',
                      })
                    }
                    className="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    {prod.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingProduct ? 'Modificar Producto / Programa' : 'Nuevo Producto / Programa'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Programa / Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Móviles Nivel 1"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Precio Nominal de Lista ($ USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="890.00"
                  value={formData.precioNominal}
                  onChange={(e) => setFormData({ ...formData, precioNominal: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Regla de negocio: Precio base orientativo. El precio acordado final se define por cada alumno en Deudas.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el contenido del curso, horas y módulos..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
