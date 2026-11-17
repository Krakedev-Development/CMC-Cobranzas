import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import {
  Package,
  Plus,
  Edit2,
  CheckCircle2,
  DollarSign,
  Users,
  AlertTriangle,
  X,
  Search,
  LayoutGrid,
  List,
  GraduationCap,
  TrendingUp,
  Tag,
  Power,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { products, debts, addProduct, updateProduct, hasPermission } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchQuery =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.estado === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [products, searchQuery, statusFilter]);

  // Executive KPI summary calculations
  const kpiData = useMemo(() => {
    const totalProgramas = products.length;
    const programasActivos = products.filter((p) => p.estado === 'activo').length;
    const associatedDebts = debts.filter((d) => d.estado !== 'anulada');
    const totalMatriculados = associatedDebts.length;
    const carteraTotalAcordada = associatedDebts.reduce((sum, d) => sum + d.precioAcordado, 0);
    const precioPromedio =
      products.length > 0
        ? products.reduce((sum, p) => sum + p.precioNominal, 0) / products.length
        : 0;

    return [
      {
        label: 'Total de Programas',
        value: `${totalProgramas}`,
        subtext: `${programasActivos} programas activos en oferta`,
        accentClass: 'before:bg-sky-500',
        textClass: 'text-sky-700',
        bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: GraduationCap,
      },
      {
        label: 'Alumnos Matriculados',
        value: `${totalMatriculados}`,
        subtext: 'Inscripciones académicas vigentes',
        accentClass: 'before:bg-emerald-500',
        textClass: 'text-emerald-700',
        bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Users,
      },
      {
        label: 'Cartera Total Acordada',
        value: `$${carteraTotalAcordada.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subtext: 'Compromiso acumulado de alumnos',
        accentClass: 'before:bg-blue-600',
        textClass: 'text-blue-700',
        bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: DollarSign,
      },
      {
        label: 'Precio Nominal Promedio',
        value: `$${precioPromedio.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subtext: 'Valor medio de lista en catálogo',
        accentClass: 'before:bg-amber-500',
        textClass: 'text-amber-700',
        bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Tag,
      },
    ];
  }, [products, debts]);

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
      setFormError('El nombre del programa o producto es requerido.');
      return;
    }
    if (isNaN(nominal) || nominal <= 0) {
      setFormError('Ingrese un precio nominal de lista válido mayor a 0.');
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
      {/* 4 Executive KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-1 ${kpi.accentClass}`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`w-8 h-8 rounded-xl border shadow-2xs flex items-center justify-center shrink-0 ${kpi.bgBadge}`}>
                  <IconComp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className={`text-2xl lg:text-3xl font-black font-mono tracking-tight tabular-nums ${kpi.textClass}`}>
                  {kpi.value}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {kpi.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        {/* Left: Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por programa o contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Segmented Pill */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('activo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'activo'
                  ? 'bg-white text-emerald-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activos ({products.filter((p) => p.estado === 'activo').length})
            </button>
            <button
              onClick={() => setStatusFilter('inactivo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'inactivo'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactivos ({products.filter((p) => p.estado === 'inactivo').length})
            </button>
          </div>
        </div>

        {/* Right: View Mode & Create Action */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Create Button */}
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Content: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No se encontraron productos o programas</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ajuste los criterios de búsqueda o filtro de estado</p>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const associatedDebts = debts.filter((d) => d.productoId === prod.id && d.estado !== 'anulada');
              const totalAcordado = associatedDebts.reduce((sum, d) => sum + d.precioAcordado, 0);
              const isActive = prod.estado === 'activo';

              return (
                <div
                  key={prod.id}
                  className={`relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-all before:absolute before:top-0 before:left-0 before:right-0 before:h-1 ${
                    isActive ? 'before:bg-sky-500' : 'before:bg-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon and Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0 shadow-2xs">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Program Title & Description */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{prod.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[36px]">
                      {prod.descripcion || 'Sin descripción detallada registrada.'}
                    </p>

                    {/* Financial Data Strip */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-slate-500 font-medium">Precio Nominal de Lista:</span>
                        <span className="text-lg font-black text-slate-900 font-mono tabular-nums">
                          ${prod.precioNominal.toFixed(2)} <span className="text-[11px] font-sans font-normal text-slate-400">USD</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Alumnos inscritos:</span>
                        <span className="font-semibold text-slate-800 font-mono tabular-nums">{associatedDebts.length} alumnos</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Cartera total acordada:</span>
                        <span className="font-bold text-emerald-700 font-mono tabular-nums">
                          ${totalAcordado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canModify && (
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200/80"
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
                        className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isActive
                            ? 'border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isActive ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/75">
                  <th className="py-3 px-4">Programa Académico</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Precio Nominal</th>
                  <th className="py-3 px-4 text-right">Inscritos</th>
                  <th className="py-3 px-4 text-right">Cartera Acordada</th>
                  {canModify && <th className="py-3 px-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={canModify ? 7 : 6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No se encontraron productos o programas</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ajuste los criterios de búsqueda o filtro de estado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const associatedDebts = debts.filter((d) => d.productoId === prod.id && d.estado !== 'anulada');
                    const totalAcordado = associatedDebts.reduce((sum, d) => sum + d.precioAcordado, 0);
                    const isActive = prod.estado === 'activo';

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div className="font-bold text-slate-900 truncate max-w-xs">{prod.nombre}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-sm truncate" title={prod.descripcion}>
                          {prod.descripcion || 'Sin descripción'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums text-xs">
                          ${prod.precioNominal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums text-xs">
                          {associatedDebts.length}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums text-xs">
                          ${totalAcordado.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {canModify && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(prod)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-slate-200/80"
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
                                className={`px-2.5 py-1 border rounded-lg text-xs font-medium transition-colors ${
                                  isActive
                                    ? 'border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                {isActive ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  {editingProduct ? 'Modificar Producto o Programa' : 'Nuevo Producto o Programa'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Programa / Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Certificación en Arquitectura Cloud"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Regla de negocio: Precio base orientativo. El precio acordado final se define individualmente para cada alumno.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción del Contenido</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre el contenido del curso, módulos temáticos y alcance..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-all shadow-xs"
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
