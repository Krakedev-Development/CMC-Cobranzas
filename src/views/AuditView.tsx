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
  RotateCcw,
  Calendar,
  Copy,
  Check,
} from 'lucide-react';

import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';
import { DatePicker } from '../components/common/DatePicker';

const getInitials = (fullName: string) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const renderActionBadge = (accion: AuditAction | string) => {
  const act = (accion || '').toLowerCase();
  let colorStyles = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotStyles = 'bg-slate-400';
  let label = accion;

  if (act === 'crear') {
    colorStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotStyles = 'bg-emerald-500';
    label = 'Creación';
  } else if (act === 'modificar') {
    colorStyles = 'bg-sky-50 text-sky-800 border-sky-200';
    dotStyles = 'bg-sky-500';
    label = 'Modificación';
  } else if (act === 'anular' || act === 'deshacer_conciliacion') {
    colorStyles = 'bg-rose-50 text-rose-800 border-rose-200';
    dotStyles = 'bg-rose-500';
    label = act === 'anular' ? 'Anulación' : 'Deshacer Conciliación';
  } else if (act === 'conciliar') {
    colorStyles = 'bg-blue-50 text-blue-800 border-blue-200';
    dotStyles = 'bg-blue-500';
    label = 'Conciliación';
  } else if (act === 'cambiar_permisos') {
    colorStyles = 'bg-purple-50 text-purple-800 border-purple-200';
    dotStyles = 'bg-purple-500';
    label = 'Permisos';
  } else if (act === 'importar') {
    colorStyles = 'bg-teal-50 text-teal-800 border-teal-200';
    dotStyles = 'bg-teal-500';
    label = 'Importación';
  } else if (act === 'limpiar_cache') {
    colorStyles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotStyles = 'bg-amber-500';
    label = 'Sincronización';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorStyles} shadow-2xs whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} shrink-0`} />
      {label}
    </span>
  );
};

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
  const [copiedDiff, setCopiedDiff] = useState(false);

  const canExport = hasPermission('auditoria', 'exportar');

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedUserFilter !== 'all' ||
      selectedModuleFilter !== 'all' ||
      selectedActionFilter !== 'all' ||
      dateFrom ||
      dateTo
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedUserFilter('all');
    setSelectedModuleFilter('all');
    setSelectedActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

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

  // Unique users & modules for filters
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    auditLogs.forEach((l) => map.set(l.usuarioId, l.usuarioNombre));
    return Array.from(map.entries());
  }, [auditLogs]);

  const uniqueModules = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.modulo)));
  }, [auditLogs]);

  // Executive KPI summary calculations
  const kpiData = useMemo(() => {
    const totalEventos = auditLogs.length;
    const operacionesCriticas = auditLogs.filter(
      (l) =>
        l.accion === 'anular' ||
        l.accion === 'deshacer_conciliacion' ||
        l.accion === 'cambiar_permisos'
    ).length;
    const usuariosTrazados = uniqueUsers.length;

    return [
      {
        label: 'Total de Eventos Registrados',
        value: `${totalEventos}`,
        subtext: 'Eventos inmutables en bitácora',
        accentClass: 'before:bg-sky-500',
        textClass: 'text-sky-700',
        bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: History,
      },
      {
        label: 'Operaciones Críticas Auditadas',
        value: `${operacionesCriticas}`,
        subtext: 'Anulaciones y cambios de permisos',
        accentClass: 'before:bg-rose-500',
        textClass: 'text-rose-700',
        bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: AlertTriangle,
      },
      {
        label: 'Usuarios Operadores Trazados',
        value: `${usuariosTrazados}`,
        subtext: 'Cuentas con actividad auditada',
        accentClass: 'before:bg-blue-600',
        textClass: 'text-blue-700',
        bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: User,
      },
      {
        label: 'Garantía de Inmutabilidad',
        value: '100% Inmutable',
        subtext: 'RF-11 activa sin borrado lógico',
        accentClass: 'before:bg-emerald-500',
        textClass: 'text-emerald-700',
        bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Shield,
      },
    ];
  }, [auditLogs, uniqueUsers]);

  // Pagination state (15, 20, 25)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

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

  const handleCopyDiff = () => {
    if (!selectedLog) return;
    const jsonStr = JSON.stringify(
      {
        id: selectedLog.id,
        fechaHora: selectedLog.fechaHora,
        usuario: `${selectedLog.usuarioNombre} (${selectedLog.usuarioId})`,
        modulo: selectedLog.modulo,
        accion: selectedLog.accion,
        entidad: `${selectedLog.entidadTipo}: ${selectedLog.entidadId}`,
        motivo: selectedLog.motivo,
        valoresAnteriores: selectedLog.valoresAnteriores,
        valoresNuevos: selectedLog.valoresNuevos,
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
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

      {/* Strict Read-Only Notice (RF-11 rule) */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-slate-700 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900">Bitácora de Auditoría de Solo Lectura (RF-11):</strong> Todos los eventos de creación,
            modificación, anulación, conciliación y cambio de permisos se registran de forma inmutable.
            Ningún usuario (incluido el administrador) tiene controles para editar o borrar registros de auditoría en la interfaz.
          </div>
        </div>

        {canExport && (
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario, ID de registro o motivo..."
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
              { value: 'limpiar_cache', label: 'Sincronización del Sistema' },
            ]}
            value={selectedActionFilter}
            onChange={(val) => {
              setSelectedActionFilter(val);
              setCurrentPage(1);
            }}
            className="w-44"
          />

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Desde:</span>
            <DatePicker
              value={dateFrom}
              onChange={(val) => {
                setDateFrom(val);
                setCurrentPage(1);
              }}
              placeholder="dd/mm/aaaa"
              className="w-32 border-0 bg-transparent py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 font-semibold text-[11px]">Hasta:</span>
            <DatePicker
              value={dateTo}
              onChange={(val) => {
                setDateTo(val);
                setCurrentPage(1);
              }}
              placeholder="dd/mm/aaaa"
              className="w-32 border-0 bg-transparent py-1 text-xs"
            />
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors font-medium text-xs"
              title="Limpiar todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/75">
          <span className="text-xs text-slate-600 font-medium">
            Registros encontrados: <strong className="font-mono text-slate-900">{filteredLogs.length}</strong> eventos
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Haga clic en una fila para comparar valores anteriores y nuevos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50/50">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Registro Afectado</th>
                <th className="py-3 px-4">Motivo / Detalle</th>
                <th className="py-3 px-4 text-center">Resultado</th>
                <th className="py-3 px-4 text-right">Comparar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <History className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No se encontraron eventos de auditoría</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ajuste o limpie los criterios de búsqueda para visualizar registros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-700 font-mono whitespace-nowrap text-xs">
                      {log.fechaHora}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                          {getInitials(log.usuarioNombre)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{log.usuarioNombre}</div>
                          <div className="font-mono text-[10px] text-slate-400">@{log.usuarioId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium capitalize whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium text-[11px]">
                        {log.modulo}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderActionBadge(log.accion)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        <span className="capitalize">{log.entidadTipo}</span>
                        <span className="font-mono text-slate-500 text-[10px] block truncate max-w-[140px]">
                          {log.entidadId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.motivo || log.reglaEjecutada || 'Operación regular'}>
                      {log.motivo || log.reglaEjecutada || 'Operación regular'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {log.resultado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-slate-200/80"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalle</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
          className="rounded-b-2xl border-t border-slate-100"
        />
      </div>

      {/* --- MODAL: EVENT DETAILS WITH BEFORE / AFTER DIFF (FLUJO F) --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Detalle del Evento de Auditoría: {selectedLog.id}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Registrado el {selectedLog.fechaHora} por {selectedLog.usuarioNombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Event Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Módulo</span>
                  <span className="font-bold text-slate-800 capitalize">{selectedLog.modulo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Acción</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedLog.accion}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Entidad / ID</span>
                  <span className="font-mono text-slate-800 truncate block">
                    {selectedLog.entidadTipo}: {selectedLog.entidadId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Origen</span>
                  <span className="font-medium text-slate-700 capitalize">{selectedLog.origen}</span>
                </div>
              </div>

              {/* Justification note / Approver details */}
              {selectedLog.motivo && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block mb-0.5">Motivo / Justificación Ingresada:</span>
                  <p className="text-[11px] leading-relaxed">{selectedLog.motivo}</p>
                </div>
              )}

              {selectedLog.aprobadorId && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 flex items-center justify-between text-[11px]">
                  <span>Aprobado por: <strong className="font-bold">{selectedLog.aprobadorId}</strong></span>
                  {selectedLog.reglaEjecutada && (
                    <span className="text-slate-700 font-mono">Regla: {selectedLog.reglaEjecutada}</span>
                  )}
                </div>
              )}

              {/* Values Diff (Previous vs New) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Comparativa de Valores Anteriores y Nuevos:
                  </h4>
                  <button
                    onClick={handleCopyDiff}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copiedDiff ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Previous Values */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-1.5 tracking-wider">
                      Valores Anteriores
                    </span>
                    {selectedLog.valoresAnteriores ? (
                      <pre className="font-mono text-[10px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
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
                    <span className="font-semibold text-emerald-800 uppercase text-[10px] block mb-1.5 tracking-wider">
                      Valores Nuevos Establecidos
                    </span>
                    {selectedLog.valoresNuevos ? (
                      <pre className="font-mono text-[10px] text-emerald-950 bg-white p-2.5 rounded-lg border border-emerald-200 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
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
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
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
