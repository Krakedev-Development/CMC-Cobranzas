import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Client, Debt, Payment, Invoice, AuditLog } from '../types';
import {
  Users,
  Search,
  Plus,
  Upload,
  UserCheck,
  UserX,
  Eye,
  Edit2,
  FileText,
  DollarSign,
  Receipt,
  CreditCard,
  Clock,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  History,
  Calendar,
  Phone,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';

import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';

interface ClientsViewProps {
  onRegisterPaymentForClient?: (clientId: string) => void;
  onViewVoucher?: (payment: Payment) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onRegisterPaymentForClient,
  onViewVoucher,
}) => {
  const {
    clients,
    addClient,
    updateClient,
    toggleClientStatus,
    importClientsBulk,
    getClientFinancials,
    getDebtFinancials,
    auditLogs,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo'>('all');

  // Modals & Drawers state
  const [selectedClientDetailId, setSelectedClientDetailId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // New Client Form state
  const [formData, setFormData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    notas: '',
  });
  const [formError, setFormError] = useState('');

  // Bulk Import state
  const [importSampleLoaded, setImportSampleLoaded] = useState(false);
  const [previewData, setPreviewData] = useState<Array<{
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    correo: string;
    notas?: string;
    isDuplicate: boolean;
  }>>([]);

  const canCreate = hasPermission('clientes', 'crear');
  const canModify = hasPermission('clientes', 'modificar');

  // Pagination state (15, 20, 25)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.cedula.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.telefono.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.estado === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClients.slice(startIndex, startIndex + pageSize);
  }, [filteredClients, currentPage, pageSize]);


  // Selected client details
  const selectedFinancials = selectedClientDetailId
    ? getClientFinancials(selectedClientDetailId)
    : null;

  // Selected client audit events
  const clientAuditEvents = useMemo(() => {
    if (!selectedClientDetailId) return [];
    return auditLogs.filter(
      (log) =>
        log.entidadId === selectedClientDetailId ||
        log.valoresNuevos?.clienteId === selectedClientDetailId ||
        log.valoresNuevos?.cliente?.includes(selectedFinancials?.client.apellidos || '')
    );
  }, [selectedClientDetailId, auditLogs, selectedFinancials]);

  // Form submit
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.cedula.trim()) {
      setFormError('La cédula es obligatoria (regla de negocio RF-01).');
      return;
    }
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setFormError('Nombres y apellidos son requeridos.');
      return;
    }

    // Duplicate check
    const isDup = clients.some(
      (c) =>
        c.cedula.trim().toLowerCase() === formData.cedula.trim().toLowerCase() &&
        (!editingClient || c.id !== editingClient.id)
    );
    if (isDup) {
      setFormError('Ya existe un cliente registrado con esa cédula.');
      return;
    }

    if (editingClient) {
      updateClient(editingClient.id, {
        cedula: formData.cedula.trim(),
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim(),
        notas: formData.notas.trim(),
      });
      setEditingClient(null);
    } else {
      addClient({
        cedula: `${formData.cedula.trim()} (Demo)`,
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim(),
        estado: 'activo',
        notas: formData.notas.trim(),
      });
      setIsCreateModalOpen(false);
    }

    setFormData({ cedula: '', nombres: '', apellidos: '', telefono: '', correo: '', notas: '' });
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClient(c);
    setFormData({
      cedula: c.cedula.replace(' (Demo)', ''),
      nombres: c.nombres,
      apellidos: c.apellidos,
      telefono: c.telefono,
      correo: c.correo,
      notas: c.notas || '',
    });
    setFormError('');
  };

  // Sample import batch loader
  const handleLoadSampleBatch = () => {
    const existingCedulas = new Set(clients.map((c) => c.cedula.toLowerCase().replace(' (demo)', '').trim()));
    const sampleBatch = [
      {
        cedula: '1789401928',
        nombres: 'Andrea Nicole',
        apellidos: 'Vargas Albornoz',
        telefono: '+593 99 192 8374',
        correo: 'andrea.vargas.demo@ejemplo.ec',
        notas: 'Importado de lista de aspirantes Móviles Nivel 1',
        isDuplicate: existingCedulas.has('1789401928'),
      },
      {
        cedula: '1792837465',
        nombres: 'Esteban Darío',
        apellidos: 'Montenegro Rosero',
        telefono: '+593 98 482 9102',
        correo: 'esteban.montenegro.demo@ejemplo.ec',
        notas: 'Ex-alumno con código de referido',
        isDuplicate: existingCedulas.has('1792837465'),
      },
      {
        cedula: '1718293041', // Duplicado de Carlos Mendoza para demostrar validación
        nombres: 'Carlos Repetido',
        apellidos: 'Mendoza Error',
        telefono: '+593 98 000 0000',
        correo: 'carlos.dup@ejemplo.ec',
        notas: 'Registro repetido de prueba',
        isDuplicate: true,
      },
      {
        cedula: '1776543210',
        nombres: 'Gabriela Belén',
        apellidos: 'Zurita Montero',
        telefono: '+593 96 384 7561',
        correo: 'gabriela.zurita.demo@ejemplo.ec',
        notas: 'Interesada en beca institucional',
        isDuplicate: existingCedulas.has('1776543210'),
      },
    ];

    setPreviewData(sampleBatch);
    setImportSampleLoaded(true);
  };

  const handleConfirmImport = () => {
    const validToImport = previewData.filter((item) => !item.isDuplicate);
    if (validToImport.length > 0) {
      importClientsBulk(
        validToImport.map((v) => ({
          cedula: `${v.cedula} (Demo)`,
          nombres: v.nombres,
          apellidos: v.apellidos,
          telefono: v.telefono,
          correo: v.correo,
          estado: 'activo',
          notas: v.notas,
        }))
      );
    }
    setIsImportModalOpen(false);
    setPreviewData([]);
    setImportSampleLoaded(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* State filter buttons & Actions */}
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
              Todos ({clients.length})
            </button>
            <button
              onClick={() => setStatusFilter('activo')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'activo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setStatusFilter('inactivo')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'inactivo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactivos
            </button>
          </div>

          {canCreate && (
            <>
              <button
                onClick={() => {
                  setImportSampleLoaded(false);
                  setPreviewData([]);
                  setIsImportModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Importar Excel</span>
              </button>

              <button
                onClick={() => {
                  setEditingClient(null);
                  setFormData({ cedula: '', nombres: '', apellidos: '', telefono: '', correo: '', notas: '' });
                  setFormError('');
                  setIsCreateModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Cliente</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong>{filteredClients.length}</strong> clientes registrados
          </div>
          <span className="text-[11px] text-slate-400">
            Cédulas ficticias etiquetadas para demostración
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Cédula (Obligatoria)</th>
                <th className="py-3 px-4">Nombres y Apellidos</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Deudas / Programas</th>
                <th className="py-3 px-4">Saldo Pendiente</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedClients.map((client) => {
                const fin = getClientFinancials(client.id);
                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {client.cedula}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {client.nombres} {client.apellidos}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{client.telefono}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{client.correo}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {fin?.deudas.length || 0} programas
                      </span>
                      <span className="text-slate-400 text-[11px] block">
                        Acordado: ${fin?.totalPrecioAcordado.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums whitespace-nowrap">
                      {(fin?.saldoPendienteTotal || 0) > 0 ? (
                        <span className="text-amber-700">
                          ${fin?.saldoPendienteTotal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Al día ($0.00)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {client.estado === 'activo' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedClientDetailId(client.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Ver Ficha Integral y Trazabilidad del Cliente"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ficha</span>
                        </button>

                        {canModify && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(client)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/50"
                              title="Modificar datos"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleClientStatus(client.id)}
                              className={`p-1 rounded hover:bg-slate-200/50 ${
                                client.estado === 'activo' ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                              title={client.estado === 'activo' ? 'Desactivar cliente' : 'Activar cliente'}
                            >
                              {client.estado === 'activo' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
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
          totalItems={filteredClients.length}
          pageSize={pageSize}
          pageSizeOptions={[15, 20, 25]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          className="rounded-b-2xl"
        />
      </div>

      {/* --- MODAL: CREATE / EDIT CLIENT --- */}
      {(isCreateModalOpen || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingClient ? 'Modificar Datos de Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingClient(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cédula / Identificación <span className="text-rose-500">* (Obligatoria)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1718293041"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos Andrés"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mendoza Viteri"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+593 98 412 8391"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="carlos.mendoza@ejemplo.ec"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre becas, convenios o requerimientos especiales..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: BULK EXCEL IMPORT SIMULATION --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Carga Masiva de Clientes desde Excel / CSV
                </h2>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600">
              {!importSampleLoaded ? (
                <div className="text-center py-8 space-y-3 border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Subir archivo de clientes o usar plantilla demo
                    </h3>
                    <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                      Columnas esperadas: <code>Cédula, Nombres, Apellidos, Teléfono, Correo, Notas</code>.
                      El sistema validará duplicados antes de confirmar.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={handleLoadSampleBatch}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Cargar Archivo de Muestra (4 Alumnos)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Vista previa y validación de duplicados:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Detectados: <strong>{previewData.filter((i) => !i.isDuplicate).length}</strong> nuevos,{' '}
                      <strong className="text-rose-600">{previewData.filter((i) => i.isDuplicate).length}</strong> duplicados
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Cédula</th>
                          <th className="p-2">Nombres / Apellidos</th>
                          <th className="p-2">Teléfono</th>
                          <th className="p-2">Diagnóstico</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.map((row, idx) => (
                          <tr
                            key={idx}
                            className={row.isDuplicate ? 'bg-rose-50/70 text-rose-900' : 'hover:bg-slate-50'}
                          >
                            <td className="p-2 font-mono">{row.cedula}</td>
                            <td className="p-2 font-semibold">
                              {row.nombres} {row.apellidos}
                            </td>
                            <td className="p-2 text-slate-500">{row.telefono}</td>
                            <td className="p-2 font-medium">
                              {row.isDuplicate ? (
                                <span className="text-rose-600 flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Ya existe cédula
                                </span>
                              ) : (
                                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Válido para crear
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Los registros duplicados serán omitidos automáticamente para proteger la integridad de las cuentas por cobrar.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 text-xs"
              >
                Cerrar
              </button>
              {importSampleLoaded && (
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Confirmar Importación ({previewData.filter((i) => !i.isDuplicate).length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CLIENT INTEGRAL DETAIL DRAWER (FICHA COMPLETA) --- */}
      {selectedFinancials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden max-h-[85vh]">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {selectedFinancials.client.nombres[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 leading-tight">
                      {selectedFinancials.client.nombres} {selectedFinancials.client.apellidos}
                    </h2>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      {selectedFinancials.client.estado}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Cédula: {selectedFinancials.client.cedula} · Tel: {selectedFinancials.client.telefono}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientDetailId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-4 bg-slate-900 text-white p-4 text-center divide-x divide-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio Nominal</span>
                <span className="text-sm font-bold tabular-nums">
                  ${selectedFinancials.totalPrecioNominal.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio Acordado</span>
                <span className="text-sm font-bold tabular-nums text-indigo-300">
                  ${selectedFinancials.totalPrecioAcordado.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Pagado</span>
                <span className="text-sm font-bold tabular-nums text-emerald-400">
                  ${selectedFinancials.totalPagado.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Saldo Pendiente</span>
                <span className="text-sm font-bold tabular-nums text-amber-400">
                  ${selectedFinancials.saldoPendienteTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Drawer Body Tabs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Programas y Deudas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Programas Adquiridos ({selectedFinancials.deudas.length})
                  </h3>
                  {onRegisterPaymentForClient && (
                    <button
                      onClick={() => {
                        setSelectedClientDetailId(null);
                        onRegisterPaymentForClient(selectedFinancials.client.id);
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-[11px] border border-indigo-200 transition-colors"
                    >
                      + Registrar Pago para este alumno
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {selectedFinancials.deudas.map((debt) => {
                    const fin = getDebtFinancials(debt.id);
                    return (
                      <div
                        key={debt.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {fin?.product?.nombre || debt.productoId}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Adquisición: {debt.fechaAdquisicion} · ID: {debt.id}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              debt.estado === 'pagada'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : debt.estado === 'parcial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {debt.estado === 'pagada' ? 'Pagada' : debt.estado === 'parcial' ? 'Parcial' : 'Pendiente'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-slate-200 text-center text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Acordado</span>
                            <span className="font-bold text-slate-800">${debt.precioAcordado.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Abonado</span>
                            <span className="font-bold text-emerald-600">
                              ${(fin?.validPaymentsTotal || 0).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Saldo</span>
                            <span className="font-bold text-amber-600">
                              ${(fin?.saldoPendiente || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {debt.observaciones && (
                          <p className="text-[11px] text-slate-500 italic bg-white/60 p-1.5 rounded">
                            {debt.observaciones}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historial de Pagos y Comprobantes */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Historial de Pagos ({selectedFinancials.pagos.length})
                </h3>

                {selectedFinancials.pagos.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No hay pagos registrados para este cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedFinancials.pagos.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          p.estadoRegistro === 'anulado'
                            ? 'bg-rose-50/50 border-rose-200 opacity-60'
                            : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">${p.monto.toFixed(2)}</span>
                            <span className="text-slate-500">· {p.fechaPago}</span>
                            <span className="font-mono text-[11px] text-slate-600">
                              [{p.numeroTransaccion || 'Sin TX'}]
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.metodo} · {p.bancoOrigen || 'Sin banco especificado'}
                          </div>
                          {p.motivoAnulacion && (
                            <div className="text-[10px] text-rose-600 font-medium mt-1">
                              Anulado: {p.motivoAnulacion}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              p.estadoConciliacion === 'conciliado_auto' || p.estadoConciliacion === 'conciliado_manual'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {p.estadoConciliacion}
                          </span>

                          {p.comprobanteId && onViewVoucher && (
                            <button
                              onClick={() => onViewVoucher(p)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Comprobante
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Facturas Documentales */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Facturas Registradas ({selectedFinancials.facturas.length})
                </h3>

                {selectedFinancials.facturas.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">
                    Sin facturas físicas/externas registradas para este cliente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedFinancials.facturas.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 font-mono">{inv.numeroFactura}</div>
                          <div className="text-[11px] text-slate-500">
                            Fecha: {inv.fechaFactura} · Monto: ${(inv.monto || 0).toFixed(2)}
                          </div>
                          {inv.nombreArchivo && (
                            <div className="text-[10px] text-indigo-600 flex items-center gap-1 mt-0.5">
                              <FileText className="w-3 h-3" /> {inv.nombreArchivo}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            inv.estadoDocumental === 'registrada'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inv.estadoDocumental}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline de Eventos / Auditoría del Cliente */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  Trazabilidad de Auditoría del Cliente
                </h3>

                <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                  {clientAuditEvents.length === 0 ? (
                    <p className="text-slate-400 text-xs">Sin registros de auditoría específicos.</p>
                  ) : (
                    clientAuditEvents.map((aud) => (
                      <div key={aud.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 capitalize">{aud.accion}</span>
                          <span className="text-[10px] text-slate-400">{aud.fechaHora}</span>
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          Por {aud.usuarioNombre} · {aud.motivo || 'Operación registrada'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedClientDetailId(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
