import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLog, AuditAction, ModuleName } from '../types';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Shield,
  Clock,
  ArrowRight,
  User,
  Layers,
  FileText,
} from 'lucide-react';

import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';

export const AuditView: React.FC = () => {
  const { auditLogs, exportToCSV, hasPermission } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Log for Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const canExport = hasPermission('auditoria', 'exportar');

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.usuarioNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entidadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.motivo && log.motivo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchUser = selectedUserFilter === 'all' || log.usuarioId === selectedUserFilter;
      const matchModule = selectedModuleFilter === 'all' || log.modulo === selectedModuleFilter;
      const matchAction = selectedActionFilter === 'all' || log.accion === selectedActionFilter;
      const matchFrom = !dateFrom || log.fechaHora >= dateFrom;
      const matchTo = !dateTo || log.fechaHora <= dateTo + ' 23:59:59';

      return matchSearch && matchUser && matchModule && matchAction && matchFrom && matchTo;
    });
  }, [auditLogs, searchQuery, selectedUserFilter, selectedModuleFilter, selectedActionFilter, dateFrom, dateTo]);

  // Pagination state (15, 20, 25)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);


  // Unique users & modules for filters
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    auditLogs.forEach((l) => map.set(l.usuarioId, l.usuarioNombre));
    return Array.from(map.entries());
  }, [auditLogs]);

  const uniqueModules = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.modulo)));
  }, [auditLogs]);

  const handleExportCSV = () => {
    if (!canExport) return;
    const headers = [
      'ID Evento',
      'Fecha y Hora',
      'Usuario',
      'Módulo',
      'Acción',
      'Entidad Tipo',
      'ID Entidad',
      'Resultado',
      'Motivo / Justificación',
      'Origen',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.fechaHora,
      `${l.usuarioNombre} (${l.usuarioId})`,
      l.modulo,
      l.accion,
      l.entidadTipo,
      l.entidadId,
      l.resultado,
      l.motivo || '',
      l.origen,
    ]);

    exportToCSV('Bitacora_Auditoria_Cobranzas', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Strict Read-Only Notice (RF-11 rule) */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Bitácora de Auditoría de Solo Lectura (RF-11):</strong> Todos los eventos de creación,
            modificación, anulación, conciliación y cambio de permisos se registran de forma inmutable.
            Ningún usuario (incluido el administrador) tiene controles para editar o borrar registros de auditoría en la interfaz.
          </span>
        </div>

        {canExport && (
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario, ID de registro o motivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-800 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Custom Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            options={[
              { value: 'all', label: 'Todos los usuarios' },
              ...uniqueUsers.map(([id, name]) => ({
                value: id,
                label: name,
                sublabel: `@${id}`,
              })),
            ]}
            value={selectedUserFilter}
            onChange={(val) => {
              setSelectedUserFilter(val);
              setCurrentPage(1);
            }}
            searchable={uniqueUsers.length > 5}
            className="w-48"
          />

          <CustomSelect
            options={[
              { value: 'all', label: 'Todos los módulos' },
              ...uniqueModules.map((m) => ({
                value: m,
                label: m,
              })),
            ]}
            value={selectedModuleFilter}
            onChange={(val) => {
              setSelectedModuleFilter(val);
              setCurrentPage(1);
            }}
            className="w-44"
          />

          <CustomSelect
            options={[
              { value: 'all', label: 'Todas las acciones' },
              { value: 'crear', label: 'Creación' },
              { value: 'modificar', label: 'Modificación' },
              { value: 'anular', label: 'Anulación' },
              { value: 'conciliar', label: 'Conciliación' },
              { value: 'deshacer_conciliacion', label: 'Deshacer Conciliación' },
              { value: 'cambiar_permisos', label: 'Cambio de Permisos' },
              { value: 'importar', label: 'Importación' },
              { value: 'restaurar_demo', label: 'Restaurar Demo' },
            ]}
            value={selectedActionFilter}
            onChange={(val) => {
              setSelectedActionFilter(val);
              setCurrentPage(1);
            }}
            className="w-44"
          />

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 text-xs"
            title="Fecha desde"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <span className="text-xs text-slate-500 font-medium">
            Registros encontrados: <strong>{filteredLogs.length}</strong> eventos
          </span>
          <span className="text-[11px] text-slate-400">
            Haga clic en un evento para comparar valores anteriores y nuevos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/30">
                <th className="py-2.5 px-4">Fecha y Hora</th>
                <th className="py-2.5 px-4">Usuario Responsable</th>
                <th className="py-2.5 px-4">Módulo</th>
                <th className="py-2.5 px-4">Acción</th>
                <th className="py-2.5 px-4">Registro Afectado</th>
                <th className="py-2.5 px-4">Motivo / Detalle</th>
                <th className="py-2.5 px-4">Resultado</th>
                <th className="py-2.5 px-4 text-right">Comparar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 text-slate-600 font-mono whitespace-nowrap">
                    {log.fechaHora}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {log.usuarioNombre}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium capitalize whitespace-nowrap">
                    {log.modulo}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        log.accion === 'anular' || log.accion === 'deshacer_conciliacion'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.accion === 'conciliar'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : log.accion === 'cambiar_permisos'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {log.accion}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {log.entidadTipo}: {log.entidadId}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                    {log.motivo || log.reglaEjecutada || 'Operación regular'}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {log.resultado}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalle</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination (15, 20, 25) */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          pageSizeOptions={[15, 20, 25]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          className="rounded-b-2xl"
        />
      </div>

      {/* --- MODAL: EVENT DETAILS WITH BEFORE / AFTER DIFF (FLUJO F) --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Detalle del Evento de Auditoría: {selectedLog.id}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Registrado el {selectedLog.fechaHora} por {selectedLog.usuarioNombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Event Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Módulo</span>
                  <span className="font-bold text-slate-800 capitalize">{selectedLog.modulo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Acción</span>
                  <span className="font-bold text-indigo-700 capitalize">{selectedLog.accion}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Entidad / ID</span>
                  <span className="font-mono text-slate-800 truncate block">
                    {selectedLog.entidadTipo}: {selectedLog.entidadId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Origen</span>
                  <span className="font-medium text-slate-700 capitalize">{selectedLog.origen}</span>
                </div>
              </div>

              {/* Justification note / Approver details */}
              {selectedLog.motivo && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block mb-0.5">Motivo / Justificación Ingresada:</span>
                  <p className="text-[11px]">{selectedLog.motivo}</p>
                </div>
              )}

              {selectedLog.aprobadorId && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 flex items-center justify-between text-[11px]">
                  <span>Aprobado por: <strong>{selectedLog.aprobadorId}</strong></span>
                  {selectedLog.reglaEjecutada && (
                    <span className="text-indigo-700 font-mono">Regla: {selectedLog.reglaEjecutada}</span>
                  )}
                </div>
              )}

              {/* Values Diff (Previous vs New) */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2">
                  Comparativa de Valores Anteriores y Nuevos:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Previous Values */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-1.5">
                      Valores Anteriores
                    </span>
                    {selectedLog.valoresAnteriores ? (
                      <pre className="font-mono text-[10px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.valoresAnteriores, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">
                        (Ninguno / Creación inicial de registro)
                      </span>
                    )}
                  </div>

                  {/* New Values */}
                  <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3">
                    <span className="font-semibold text-emerald-800 uppercase text-[10px] block mb-1.5">
                      Valores Nuevos Establecidos
                    </span>
                    {selectedLog.valoresNuevos ? (
                      <pre className="font-mono text-[10px] text-emerald-950 bg-white p-2.5 rounded-lg border border-emerald-200 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.valoresNuevos, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">
                        (Ninguno especificado)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
