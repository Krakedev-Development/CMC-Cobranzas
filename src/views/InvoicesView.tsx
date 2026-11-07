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
  FileSpreadsheet,
  Printer,
  Download,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

import { Pagination } from '../components/common/Pagination';
import { DatePicker } from '../components/common/DatePicker';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    clients,
    debts,
    products,
    registerInvoice,
    updateInvoice,
    hasPermission,
    exportToCSV,
    exportToPDF,
    vouchers,
    payments,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registrada' | 'pendiente_registrar'>('all');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewTab, setPreviewTab] = useState<'factura' | 'voucher'>('factura');

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
  const canExport = hasPermission('facturas', 'exportar');

  // Export handlers
  const handleExportExcel = () => {
    if (!canExport) return;
    const headers = [
      'No. Factura',
      'Cliente / Alumno',
      'Cédula',
      'Programa Académico',
      'Fecha Factura',
      'Monto ($)',
      'Archivo Adjunto',
      'Estado Documental',
      'Observaciones',
    ];
    const rows = filteredInvoices.map((inv) => {
      const client = clients.find((c) => c.id === inv.clienteId);
      const debt = debts.find((d) => d.id === inv.deudaId);
      const prod = products.find((pr) => pr.id === debt?.productoId);
      return [
        inv.numeroFactura,
        client ? `${client.nombres} ${client.apellidos}` : inv.clienteId,
        client?.cedula || '-',
        prod?.nombre || '-',
        inv.fechaFactura,
        (inv.monto || 0).toFixed(2),
        inv.nombreArchivo || 'Sin archivo',
        inv.estadoDocumental === 'registrada' ? 'Registrada' : 'Pendiente Registrar',
        inv.observaciones || '',
      ];
    });
    exportToCSV('Facturas_Y_Documentos', headers, rows);
  };

  const handleExportPDF = () => {
    if (!canExport) return;
    const headers = [
      'No. Factura',
      'Cliente / Alumno',
      'Cédula',
      'Programa',
      'Fecha Factura',
      'Monto ($)',
      'Archivo',
      'Estado',
    ];
    const rows = filteredInvoices.map((inv) => {
      const client = clients.find((c) => c.id === inv.clienteId);
      const debt = debts.find((d) => d.id === inv.deudaId);
      const prod = products.find((pr) => pr.id === debt?.productoId);
      return [
        inv.numeroFactura,
        client ? `${client.nombres} ${client.apellidos}` : inv.clienteId,
        client?.cedula || '-',
        prod?.nombre || '-',
        inv.fechaFactura,
        (inv.monto || 0).toFixed(2),
        inv.nombreArchivo || 'Sin archivo',
        inv.estadoDocumental === 'registrada' ? 'Registrada' : 'Pendiente',
      ];
    });
    exportToPDF(
      'Reporte de Facturas y Documentos',
      headers,
      rows,
      'Registro documental oficial de facturas y comprobantes asociados'
    );
  };

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
        <Building className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <strong>Control Documental:</strong> En este módulo se registran y archivan las facturas vinculadas a las cuentas por cobrar.
          La emisión tributaria oficial se gestiona a través del sistema de facturación electrónica de la empresa.
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
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
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

          {canExport && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Exportar facturas a Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Exportar o imprimir facturas en PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>PDF</span>
              </button>
            </div>
          )}

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
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
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
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {inv.nombreArchivo ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoicePreview(inv);
                            setPreviewTab('factura');
                          }}
                          className="flex items-center gap-1.5 font-medium text-[11px] text-sky-600 hover:text-sky-800 hover:underline cursor-pointer"
                          title="Haga clic para previsualizar el archivo"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span className="truncate max-w-[160px]">{inv.nombreArchivo}</span>
                        </button>
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Factura *</label>
                  <DatePicker
                    required
                    value={formFecha}
                    onChange={(val) => setFormFecha(val)}
                    className="w-full"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Archivo PDF Factura</label>
                  <input
                    type="text"
                    placeholder="Factura_001_DianaTorres.pdf"
                    value={formNombreArchivo}
                    onChange={(e) => setFormNombreArchivo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none"
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
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  {editingInvoice ? 'Guardar Cambios' : 'Registrar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: VISOR DOCUMENTAL INTEGRAL (FACTURA Y COMPROBANTE/VOUCHER) --- */}
      {selectedInvoicePreview && (() => {
        const client = clients.find((c) => c.id === selectedInvoicePreview.clienteId);
        const debt = debts.find((d) => d.id === selectedInvoicePreview.deudaId);
        const product = products.find((pr) => pr.id === debt?.productoId);

        // Find associated voucher or payment voucher
        const associatedVoucher =
          vouchers.find(
            (v) =>
              v.entidadRelacionadaId === selectedInvoicePreview.id ||
              (selectedInvoicePreview.deudaId && v.entidadRelacionadaId === selectedInvoicePreview.deudaId) ||
              (v.nombreArchivo && v.nombreArchivo === selectedInvoicePreview.nombreArchivo)
          ) || null;

        const associatedPayment =
          payments.find(
            (p) =>
              (selectedInvoicePreview.deudaId && p.deudaId === selectedInvoicePreview.deudaId) ||
              p.clienteId === selectedInvoicePreview.clienteId
          ) || null;

        const voucherImageUrl =
          associatedVoucher?.archivoUrl ||
          associatedPayment?.comprobanteUrl ||
          associatedVoucher?.archivoDemoUrl;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Visor Documental: {selectedInvoicePreview.numeroFactura}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Previsualización de factura electrónica y comprobante de pago asociado
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoicePreview(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Visor Tabs Switcher */}
              <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setPreviewTab('factura')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewTab === 'factura'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Factura Electrónica</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('voucher')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewTab === 'voucher'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Comprobante / Voucher Asociado</span>
                  {voucherImageUrl && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                {previewTab === 'factura' ? (
                  /* --- FACTURA ELECTRÓNICA VISOR --- */
                  <div className="space-y-4">
                    {/* Header Factura SRI */}
                    <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <div className="text-xs font-black tracking-wider uppercase text-sky-400">
                            CLEAR MINDS CONSULTORES CÍA. LTDA.
                          </div>
                          <div className="text-[10px] text-slate-400">
                            RUC: 1792458921001 · Matriz: Quito, Ecuador
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono font-bold block sm:inline-block">
                            FACTURA ELECTRÓNICA
                          </span>
                          <div className="text-xs font-mono font-bold text-white mt-1">
                            N° {selectedInvoicePreview.numeroFactura}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Fecha de Emisión:</span>
                          <strong className="text-white">{selectedInvoicePreview.fechaFactura}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Estado Documental:</span>
                          <strong className="text-emerald-400 uppercase">
                            {selectedInvoicePreview.estadoDocumental === 'registrada' ? 'Registrada SRI' : 'Pendiente'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Archivo de Respaldo:</span>
                          <strong className="text-sky-300 truncate block">
                            {selectedInvoicePreview.nombreArchivo || 'factura.pdf'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Cliente Datos */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Datos del Alumno / Receptor
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[11px]">Razón Social / Nombres:</span>
                          <div className="font-bold text-slate-900">
                            {client ? `${client.nombres} ${client.apellidos}` : 'Consumidor Final'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">Identificación (RUC/CI):</span>
                          <div className="font-mono font-bold text-slate-900">{client?.cedula || '9999999999'}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">Correo Electrónico:</span>
                          <div className="text-slate-700">{client?.correo || '-'}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">Teléfono:</span>
                          <div className="text-slate-700">{client?.telefono || '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Rubros Facturados */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Descripción del Servicio Educativo</th>
                            <th className="py-2.5 px-3 text-center w-16">Cant.</th>
                            <th className="py-2.5 px-3 text-right w-24">P. Unitario</th>
                            <th className="py-2.5 px-3 text-right w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          <tr>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block">
                                {product?.nombre || 'Capacitación Profesional y Certificación'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Matrícula y colegiatura académica
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">1</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              ${(selectedInvoicePreview.monto || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ${(selectedInvoicePreview.monto || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-medium text-slate-700">
                          <tr>
                            <td colSpan={3} className="py-1.5 px-3 text-right text-[11px]">Subtotal 0% (Educación Exenta):</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                              ${(selectedInvoicePreview.monto || 0).toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="py-1.5 px-3 text-right text-[11px]">IVA 0%:</td>
                            <td className="py-1.5 px-3 text-right font-mono text-slate-500">$0.00</td>
                          </tr>
                          <tr className="border-t border-slate-200 font-bold bg-slate-100 text-slate-900">
                            <td colSpan={3} className="py-2 px-3 text-right text-xs">VALOR TOTAL FACTURADO:</td>
                            <td className="py-2 px-3 text-right font-mono text-sm font-black text-emerald-700">
                              ${(selectedInvoicePreview.monto || 0).toFixed(2)} USD
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {selectedInvoicePreview.observaciones && (
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-200 text-[11px]">
                        <strong className="text-slate-800 block mb-0.5">Observaciones:</strong>
                        {selectedInvoicePreview.observaciones}
                      </div>
                    )}
                  </div>
                ) : (
                  /* --- COMPROBANTE / VOUCHER VISOR --- */
                  <div className="space-y-4">
                    {voucherImageUrl ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-900/5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                          <img
                            src={voucherImageUrl}
                            alt="Comprobante de pago adjunto"
                            className="max-h-72 w-auto object-contain rounded-xl shadow-xs border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 truncate">
                            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">
                              {associatedVoucher?.nombreArchivo || 'Comprobante_Pago.png'}
                            </span>
                          </div>
                          <a
                            href={voucherImageUrl}
                            download={associatedVoucher?.nombreArchivo || 'Comprobante_Pago.png'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <div className="font-bold text-slate-700">
                          Respaldo de comprobante registrado digitalmente
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Este registro cuenta con respaldo de transacción bancaria vinculada:
                        </p>
                        {associatedPayment && (
                          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs max-w-md mx-auto space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-500">N° Transacción:</span>
                              <strong className="font-mono text-slate-900">{associatedPayment.numeroTransaccion || 'S/N'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Banco / Entidad:</span>
                              <strong className="text-slate-900">{associatedPayment.bancoOrigen || 'Banco'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Monto Acreditado:</span>
                              <strong className="text-emerald-700 font-bold">${associatedPayment.monto.toFixed(2)}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Fecha de Pago:</span>
                              <strong className="text-slate-800">{associatedPayment.fechaPago}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Imprimir o guardar PDF del documento"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInvoicePreview(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
