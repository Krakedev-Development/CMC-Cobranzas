import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, Client, Debt } from '../types';
import {
  FileText,
  Plus,
  Search,
  Upload,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  FileCheck,
  Building,
} from 'lucide-react';

import { Pagination } from '../components/common/Pagination';

export const InvoicesView: React.FC = () => {
  const { invoices, clients, debts, products, registerInvoice, updateInvoice, hasPermission } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registrada' | 'pendiente_registrar'>('all');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form state
  const [formClientId, setFormClientId] = useState('');
  const [formDebtId, setFormDebtId] = useState('');
  const [formNumero, setFormNumero] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().slice(0, 10));
  const [formMonto, setFormMonto] = useState('');
  const [formNombreArchivo, setFormNombreArchivo] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');
  const [formError, setFormError] = useState('');

  const canCreate = hasPermission('facturas', 'crear');
  const canModify = hasPermission('facturas', 'modificar');

  // Client debts
  const clientDebts = useMemo(() => {
    if (!formClientId) return [];
    return debts.filter((d) => d.clienteId === formClientId && d.estado !== 'anulada');
  }, [formClientId, debts]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const client = clients.find((c) => c.id === inv.clienteId);
      const matchesSearch =
        inv.numeroFactura.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client?.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client?.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client?.cedula.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inv.estadoDocumental === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, clients, searchQuery, statusFilter]);

  // Pagination state (15, 20, 25)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(startIndex, startIndex + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formClientId) {
      setFormError('Debe seleccionar el cliente receptor de la factura.');
      return;
    }
    if (!formNumero.trim()) {
      setFormError('El número de factura es obligatorio (ej: 001-001-000004925).');
      return;
    }

    const montoVal = parseFloat(formMonto);

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        numeroFactura: formNumero.trim(),
        fechaFactura: formFecha,
        monto: isNaN(montoVal) ? undefined : montoVal,
        nombreArchivo: formNombreArchivo.trim() || editingInvoice.nombreArchivo,
        observaciones: formObservaciones.trim() || undefined,
        estadoDocumental: 'registrada',
      });
      setEditingInvoice(null);
    } else {
      registerInvoice({
        clienteId: formClientId,
        deudaId: formDebtId || undefined,
        numeroFactura: formNumero.trim(),
        fechaFactura: formFecha,
        monto: isNaN(montoVal) ? undefined : montoVal,
        nombreArchivo: formNombreArchivo.trim() || `Factura_${formNumero.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        observaciones: formObservaciones.trim() || undefined,
      });
      setIsRegisterModalOpen(false);
    }

    setFormClientId('');
    setFormDebtId('');
    setFormNumero('');
    setFormMonto('');
    setFormNombreArchivo('');
    setFormObservaciones('');
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormClientId(inv.clienteId);
    setFormDebtId(inv.deudaId || '');
    setFormNumero(inv.numeroFactura);
    setFormFecha(inv.fechaFactura);
    setFormMonto(inv.monto ? inv.monto.toString() : '');
    setFormNombreArchivo(inv.nombreArchivo || '');
    setFormObservaciones(inv.observaciones || '');
    setFormError('');
    setIsRegisterModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Explicit SRI scope banner (RF-06 requirement) */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-700">
        <Building className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div>
          <strong>Regla Documental (RF-06):</strong> En esta versión se registra la factura y se adjunta su archivo PDF físico o externo.
          <strong> No se emite factura electrónica ni existe conexión con el SRI</strong> en este prototipo.
          No se presenta ninguna factura como emitida automáticamente por el sistema.
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número de factura o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* State filter buttons & New Invoice */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter('registrada')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'registrada'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registradas con PDF
            </button>
            <button
              onClick={() => setStatusFilter('pendiente_registrar')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'pendiente_registrar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes de Registro
            </button>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setEditingInvoice(null);
                setFormClientId('');
                setFormDebtId('');
                setFormNumero(`001-001-${Math.floor(1000000 + Math.random() * 9000000)}`);
                setFormMonto('');
                setFormNombreArchivo('');
                setFormObservaciones('');
                setFormError('');
                setIsRegisterModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Factura (Flujo D)</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <span className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredInvoices.length}</strong> facturas y documentos registrados
          </span>
          <span className="text-[11px] text-slate-400">
            Archivos conservados y consultables desde la ficha del cliente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">No. Factura</th>
                <th className="py-3 px-4">Cliente / Alumno</th>
                <th className="py-3 px-4">Fecha Factura</th>
                <th className="py-3 px-4">Monto ($)</th>
                <th className="py-3 px-4">Archivo Adjunto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInvoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.clienteId);
                const debt = debts.find((d) => d.id === inv.deudaId);
                const prod = products.find((pr) => pr.id === debt?.productoId);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {inv.numeroFactura}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">
                        {client ? `${client.nombres} ${client.apellidos}` : inv.clienteId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {prod ? prod.nombre : client?.cedula}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{inv.fechaFactura}</td>
                    <td className="py-3 px-4 font-bold tabular-nums text-slate-900 whitespace-nowrap">
                      ${(inv.monto || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-indigo-600 whitespace-nowrap">
                      {inv.nombreArchivo ? (
                        <div className="flex items-center gap-1 font-medium text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="truncate max-w-[160px]">{inv.nombreArchivo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sin archivo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {inv.estadoDocumental === 'registrada' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          Registrada
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                          Pendiente Registrar
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoicePreview(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/50"
                            title="Modificar o sustituir archivo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination (15, 20, 25) */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInvoices.length}
          pageSize={pageSize}
          pageSizeOptions={[15, 20, 25]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          className="rounded-b-2xl"
        />
      </div>

      {/* --- MODAL: REGISTRAR O MODIFICAR FACTURA (FLUJO D) --- */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingInvoice ? 'Modificar / Sustituir Factura' : 'Registrar Factura Documental (Flujo D)'}
              </h2>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
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
                <label className="block font-semibold text-slate-700 mb-1">Cliente / Alumno *</label>
                <select
                  required
                  value={formClientId}
                  onChange={(e) => {
                    setFormClientId(e.target.value);
                    setFormDebtId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombres} {c.apellidos} ({c.cedula})
                    </option>
                  ))}
                </select>
              </div>

              {clientDebts.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deuda / Programa Relacionado (Opcional)
                  </label>
                  <select
                    value={formDebtId}
                    onChange={(e) => setFormDebtId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Sin deuda específica / General --</option>
                    {clientDebts.map((d) => {
                      const prod = products.find((p) => p.id === d.productoId);
                      return (
                        <option key={d.id} value={d.id}>
                          {prod?.nombre} (Acordado: ${d.precioAcordado})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Factura *</label>
                  <input
                    type="text"
                    required
                    placeholder="001-001-000004925"
                    value={formNumero}
                    onChange={(e) => setFormNumero(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Factura *</label>
                  <input
                    type="date"
                    required
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto Facturado ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 790.00"
                    value={formMonto}
                    onChange={(e) => setFormMonto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Archivo PDF Demo</label>
                  <input
                    type="text"
                    placeholder="Factura_001_DianaTorres.pdf"
                    value={formNombreArchivo}
                    onChange={(e) => setFormNombreArchivo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre emisión externa, desglose de impuestos o datos de retención..."
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {editingInvoice ? 'Guardar Cambios' : 'Registrar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: PREVIEW INVOICE DOCUMENT --- */}
      {selectedInvoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Factura {selectedInvoicePreview.numeroFactura}</span>
              </div>
              <button
                onClick={() => setSelectedInvoicePreview(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-purple-900 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-sm">FACTURA ELECTRÓNICA EXTERNA</span>
                  <span className="font-bold text-xs font-mono">{selectedInvoicePreview.numeroFactura}</span>
                </div>
                <div className="text-[11px] text-purple-700">
                  Registrada documentalmente en el sistema. Archivo:{' '}
                  <code>{selectedInvoicePreview.nombreArchivo || 'documento.pdf'}</code>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente Asociado:</span>
                  <span className="font-bold text-slate-900">
                    {clients.find((c) => c.id === selectedInvoicePreview.clienteId)?.nombres}{' '}
                    {clients.find((c) => c.id === selectedInvoicePreview.clienteId)?.apellidos}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de Factura:</span>
                  <span className="font-medium text-slate-800">{selectedInvoicePreview.fechaFactura}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monto Registrado:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ${(selectedInvoicePreview.monto || 0).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado Documental:</span>
                  <span className="font-semibold text-indigo-700">
                    {selectedInvoicePreview.estadoDocumental}
                  </span>
                </div>
              </div>

              {selectedInvoicePreview.observaciones && (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                  <span className="font-semibold block text-slate-700 mb-0.5">Observaciones:</span>
                  {selectedInvoicePreview.observaciones}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedInvoicePreview(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
