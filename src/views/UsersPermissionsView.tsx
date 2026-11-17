import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DemoUser, ModuleName, PermissionSet, UserPermissions } from '../types';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Save,
  UserPlus,
  KeyRound,
  Shield,
  Layers,
  Sparkles,
  CheckCheck,
  Ban,
  Search,
  Users,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';

const getInitials = (fullName: string) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const MODULE_LABELS: Record<ModuleName, string> = {
  dashboard: '1. Inicio / Dashboard',
  clientes: '2. Clientes',
  productos: '3. Productos',
  deudas: '4. Deudas / Adquisiciones',
  pagos: '5. Pagos',
  flujo_efectivo: '6. Flujo de Efectivo',
  conciliacion: '7. Conciliación Bancaria',
  facturas: '8. Facturas y Documentos',
  reportes: '9. Reportes',
  usuarios: '10. Usuarios y Permisos',
  auditoria: '11. Auditoría (Solo lectura)',
};

const ACTION_LABELS: Array<{ key: keyof PermissionSet; label: string; desc: string }> = [
  { key: 'ver', label: 'Ver', desc: 'Acceso de lectura al módulo' },
  { key: 'crear', label: 'Crear', desc: 'Registrar nuevos datos' },
  { key: 'modificar', label: 'Modificar', desc: 'Editar registros existentes' },
  { key: 'eliminar', label: 'Eliminar', desc: 'Borrar o desactivar' },
  { key: 'aprobar', label: 'Aprobar', desc: 'Conciliar, anular o autorizar' },
  { key: 'exportar', label: 'Exportar', desc: 'Descarga de datos a CSV' },
];

const ALL_MODULES: ModuleName[] = [
  'dashboard',
  'clientes',
  'productos',
  'deudas',
  'pagos',
  'flujo_efectivo',
  'conciliacion',
  'facturas',
  'reportes',
  'usuarios',
  'auditoria',
];

const generatePresetPermissions = (presetName: string): UserPermissions => {
  const result = {} as UserPermissions;

  ALL_MODULES.forEach((m) => {
    if (presetName === 'Administrador Total') {
      result[m] = {
        ver: true,
        crear: m !== 'auditoria',
        modificar: m !== 'auditoria',
        eliminar: m !== 'auditoria',
        aprobar: true,
        exportar: true,
      };
    } else if (presetName === 'Cobranzas') {
      result[m] = {
        ver: m !== 'usuarios',
        crear: m === 'clientes' || m === 'productos' || m === 'deudas' || m === 'pagos' || m === 'conciliacion' || m === 'facturas',
        modificar: m === 'clientes' || m === 'productos' || m === 'deudas' || m === 'pagos' || m === 'conciliacion' || m === 'facturas',
        eliminar: false,
        aprobar: m === 'pagos' || m === 'conciliacion' || m === 'deudas',
        exportar: true,
      };
    } else if (presetName === 'Contabilidad') {
      result[m] = {
        ver: m === 'dashboard' || m === 'pagos' || m === 'conciliacion' || m === 'facturas' || m === 'reportes' || m === 'auditoria',
        crear: m === 'pagos' || m === 'conciliacion' || m === 'facturas',
        modificar: m === 'pagos' || m === 'conciliacion' || m === 'facturas',
        eliminar: false,
        aprobar: m === 'pagos' || m === 'conciliacion',
        exportar: true,
      };
    } else if (presetName === 'Atención al cliente') {
      result[m] = {
        ver: m === 'dashboard' || m === 'clientes' || m === 'deudas',
        crear: m === 'clientes' || m === 'deudas',
        modificar: m === 'clientes',
        eliminar: false,
        aprobar: false,
        exportar: false,
      };
    } else if (presetName === 'Auditor / Solo Lectura') {
      result[m] = {
        ver: true,
        crear: false,
        modificar: false,
        eliminar: false,
        aprobar: false,
        exportar: true,
      };
    } else {
      // Personalizado / Vacío por defecto
      result[m] = {
        ver: m === 'dashboard',
        crear: false,
        modificar: false,
        eliminar: false,
        aprobar: false,
        exportar: false,
      };
    }
  });

  return result;
};

export const UsersPermissionsView: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUserId,
    addUser,
    updateUser,
    updateUserPermissions,
    hasPermission,
  } = useApp();

  const [selectedUserForPerms, setSelectedUserForPerms] = useState<DemoUser>(
    users.find((u) => u.username === 'atencion01') || users[0]
  );

  // Local working copy of permissions for editing existing user
  const [editingPermissions, setEditingPermissions] = useState<UserPermissions>(
    selectedUserForPerms.permisos
  );

  const [justificationNote, setJustificationNote] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // --- USERS TABLE SEARCH, FILTER & PAGINATION ---
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(15);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !userSearchText.trim() ||
        u.nombre.toLowerCase().includes(userSearchText.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearchText.toLowerCase()) ||
        u.cargo.toLowerCase().includes(userSearchText.toLowerCase());

      const matchRole =
        userRoleFilter === 'all' ||
        (u.perfilBase || 'Personalizado').toLowerCase() === userRoleFilter.toLowerCase();

      return matchSearch && matchRole;
    });
  }, [users, userSearchText, userRoleFilter]);

  const userTotalPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userCurrentPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userCurrentPage, userPageSize]);

  // Executive KPI summary calculations
  const kpiData = useMemo(() => {
    const totalUsuarios = users.length;
    const usuariosActivos = users.filter((u) => u.estado === 'activo').length;
    const adminsCount = users.filter(
      (u) =>
        (u.perfilBase || '').toLowerCase().includes('admin') ||
        (u.perfilBase || '').toLowerCase().includes('superv')
    ).length;
    const operativosCount = users.filter(
      (u) =>
        (u.perfilBase || '').toLowerCase().includes('cobranza') ||
        (u.perfilBase || '').toLowerCase().includes('contab') ||
        (u.perfilBase || '').toLowerCase().includes('atenci')
    ).length;

    return [
      {
        label: 'Total de Usuarios',
        value: `${totalUsuarios}`,
        subtext: `${usuariosActivos} operadores habilitados`,
        accentClass: 'before:bg-sky-500',
        textClass: 'text-sky-700',
        bgBadge: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: Users,
      },
      {
        label: 'Administradores y Supervisión',
        value: `${adminsCount}`,
        subtext: 'Control total del sistema',
        accentClass: 'before:bg-blue-600',
        textClass: 'text-blue-700',
        bgBadge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: ShieldCheck,
      },
      {
        label: 'Operadores de Cobranzas y Caja',
        value: `${operativosCount}`,
        subtext: 'Gestión de cartera y conciliación',
        accentClass: 'before:bg-emerald-500',
        textClass: 'text-emerald-700',
        bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: UserCheck,
      },
      {
        label: 'Módulos Protegidos RBAC',
        value: '11 Módulos',
        subtext: 'Matriz granular por acción y rol',
        accentClass: 'before:bg-amber-500',
        textClass: 'text-amber-700',
        bgBadge: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: KeyRound,
      },
    ];
  }, [users]);

  const getRoleBadgeStyle = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    let dotStyles = 'bg-slate-400';

    if (normalized.includes('admin')) {
      badgeStyles = 'bg-slate-900 text-white border-slate-900';
      dotStyles = 'bg-sky-400';
    } else if (normalized.includes('cobranza')) {
      badgeStyles = 'bg-sky-50 text-sky-950 border-sky-200';
      dotStyles = 'bg-sky-500';
    } else if (normalized.includes('contab') || normalized.includes('superv')) {
      badgeStyles = 'bg-emerald-50 text-emerald-950 border-emerald-200';
      dotStyles = 'bg-emerald-600';
    } else if (normalized.includes('atenci')) {
      badgeStyles = 'bg-amber-50 text-amber-950 border-amber-200';
      dotStyles = 'bg-amber-500';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyles} shadow-2xs`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} shrink-0`} />
        <span>{role || 'Personalizado'}</span>
      </span>
    );
  };

  const countAllowedModules = (perms: UserPermissions) => {
    if (!perms) return 0;
    return ALL_MODULES.filter((m) => perms[m]?.ver).length;
  };

  // --- NEW USER MODAL STATE ---
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newCargo, setNewCargo] = useState('');
  const [newPerfilBase, setNewPerfilBase] = useState('Cobranzas');
  const [newUserPermissions, setNewUserPermissions] = useState<UserPermissions>(
    generatePresetPermissions('Cobranzas')
  );
  const [newUserError, setNewUserError] = useState('');
  const [editingPerfilBase, setEditingPerfilBase] = useState<string>(
    users[0]?.perfilBase || 'Administrador'
  );

  const canManageUsers = hasPermission('usuarios', 'modificar');

  // When selected user changes, reload their permissions
  const handleSelectUser = (user: DemoUser) => {
    setSelectedUserForPerms(user);
    setEditingPerfilBase(user.perfilBase || 'Cobranzas');
    setEditingPermissions(user.permisos);
    setSaveSuccessMessage('');
  };

  const handleTogglePerm = (module: ModuleName, action: keyof PermissionSet) => {
    // Inmutable audit rule: nobody can create/edit/delete audit logs
    if (module === 'auditoria' && action !== 'ver' && action !== 'exportar') {
      return;
    }

    setEditingPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  // Toggle permission in the New User creation modal
  const handleToggleNewUserPerm = (module: ModuleName, action: keyof PermissionSet) => {
    if (module === 'auditoria' && action !== 'ver' && action !== 'exportar') {
      return;
    }

    setNewUserPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  const handleApplyPreset = (presetName: string) => {
    const updated = generatePresetPermissions(presetName);
    setEditingPermissions(updated);
    setEditingPerfilBase(
      presetName === 'Administrador Total' ? 'Administrador'
      : presetName === 'Contabilidad' ? 'Supervisor'
      : presetName === 'Auditor / Solo Lectura' ? 'Auditor'
      : 'Cobranzas'
    );
  };

  const handleApplyPresetToNewUser = (presetName: string) => {
    setNewPerfilBase(presetName);
    setNewUserPermissions(generatePresetPermissions(presetName));
  };

  const handleSelectAllNewUserPerms = () => {
    const full = generatePresetPermissions('Administrador Total');
    setNewUserPermissions(full);
  };

  const handleClearAllNewUserPerms = () => {
    const empty = generatePresetPermissions('Personalizado');
    ALL_MODULES.forEach((m) => {
      empty[m] = { ver: false, crear: false, modificar: false, eliminar: false, aprobar: false, exportar: false };
    });
    setNewUserPermissions(empty);
  };

  const handleSavePermissions = () => {
    const targetRole = editingPerfilBase || selectedUserForPerms.perfilBase;
    updateUser(selectedUserForPerms.id, {
      perfilBase: targetRole,
      permisos: editingPermissions,
    });
    updateUserPermissions(
      selectedUserForPerms.id,
      editingPermissions,
      justificationNote.trim() || `Actualización de rol (${targetRole}) y permisos para ${selectedUserForPerms.nombre}`
    );

    setSelectedUserForPerms((prev) => ({
      ...prev,
      perfilBase: targetRole,
      permisos: editingPermissions,
    }));

    setSaveSuccessMessage(
      `Permisos y rol (${targetRole}) guardados exitosamente en la base de datos para @${selectedUserForPerms.username}.`
    );
    setJustificationNote('');
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError('');

    if (!newUsername.trim() || !newNombre.trim()) {
      setNewUserError('Usuario y nombre completo son requeridos.');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setNewUserError(`El nombre de usuario "@${newUsername.trim().toLowerCase()}" ya existe en el sistema.`);
      return;
    }

    const created = addUser({
      username: newUsername.trim().toLowerCase(),
      nombre: newNombre.trim(),
      cargo: newCargo.trim() || 'Especialista Operativo',
      estado: 'activo',
      perfilBase: newPerfilBase,
      permisos: newUserPermissions,
    });

    setIsNewUserModalOpen(false);
    setSelectedUserForPerms(created);
    setEditingPermissions(created.permisos);
    setSaveSuccessMessage(
      `Usuario @${created.username} (${created.nombre}) creado exitosamente con sus permisos personalizados. Puedes hacer clic en "Usar rol" para iniciar sesión con su perfil.`
    );

    setNewUsername('');
    setNewNombre('');
    setNewCargo('');
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

      {/* Informative Header Banner with Create User Action */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3 text-xs text-slate-700">
          <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl shrink-0 mt-0.5 border border-sky-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Administración de Usuarios y Matriz de Permisos Granulares
            </h2>
            <p className="text-slate-500 mt-0.5 max-w-2xl text-xs leading-relaxed">
              Crea nuevos operadores o administradores, asigna roles base o personaliza individualmente cada módulo (Ver, Crear, Modificar, Eliminar, Aprobar, Exportar).
              Cambia la sesión en tiempo real para verificar las restricciones normativas.
            </p>
          </div>
        </div>

        {canManageUsers && (
          <button
            onClick={() => {
              setNewUsername('');
              setNewNombre('');
              setNewCargo('');
              setNewPerfilBase('Cobranzas');
              setNewUserPermissions(generatePresetPermissions('Cobranzas'));
              setNewUserError('');
              setIsNewUserModalOpen(true);
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs hover:shadow transition-all shrink-0 self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Crear Nuevo Usuario</span>
          </button>
        )}
      </div>

      {/* Users Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, @username o cargo..."
            value={userSearchText}
            onChange={(e) => {
              setUserSearchText(e.target.value);
              setUserCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            options={[
              { value: 'all', label: 'Todos los roles base' },
              { value: 'administrador', label: 'Administrador Total' },
              { value: 'cobranzas', label: 'Cobranzas' },
              { value: 'contabilidad', label: 'Contabilidad' },
              { value: 'atención al cliente', label: 'Atención al cliente' },
              { value: 'auditor / solo lectura', label: 'Auditor / Solo lectura' },
              { value: 'personalizado', label: 'Personalizado' },
            ]}
            value={userRoleFilter}
            onChange={(val) => {
              setUserRoleFilter(val);
              setUserCurrentPage(1);
            }}
            size="sm"
            className="w-48"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/75">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span className="text-xs text-slate-800 font-bold">
              Directorio de Usuarios ({filteredUsers.length} de {users.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Haga clic en una fila para editar su matriz de permisos o cambiar de sesión
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                <th className="py-3 px-4">Usuario / Identificador</th>
                <th className="py-3 px-4">Nombre Completo y Cargo</th>
                <th className="py-3 px-4">Perfil Base / Rol</th>
                <th className="py-3 px-4 text-center">Módulos Habilitados</th>
                <th className="py-3 px-4 text-center">Sesión en Vivo</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No se encontraron usuarios</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ajuste o limpie los criterios de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isCurrentActive = currentUser.id === u.id;
                  const isSelectedToEdit = selectedUserForPerms.id === u.id;
                  const allowedCount = countAllowedModules(u.permisos);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`cursor-pointer transition-colors ${
                        isSelectedToEdit
                          ? 'bg-sky-50/70 border-l-4 border-l-sky-500'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0 border border-sky-200 shadow-2xs">
                            {getInitials(u.nombre)}
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              @{u.username}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.nombre}</div>
                        <div className="text-slate-500 text-[11px]">{u.cargo}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getRoleBadgeStyle(u.perfilBase)}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-700 text-[11px] font-mono">
                            {allowedCount} / 11
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isCurrentActive ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-900 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                            Sesión Activa
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Disponible</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 border ${
                              isSelectedToEdit
                                ? 'bg-sky-600 text-white border-sky-600 shadow-2xs font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title="Editar matriz de permisos de este usuario"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{isSelectedToEdit ? 'Editando' : 'Permisos'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCurrentUserId(u.id)}
                            disabled={isCurrentActive}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 border ${
                              isCurrentActive
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs font-bold'
                            }`}
                            title="Cambiar sesión activa a este usuario para probar sus permisos"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{isCurrentActive ? 'Activo' : 'Usar rol'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination (15, 20, 25) */}
        <Pagination
          currentPage={userCurrentPage}
          totalPages={userTotalPages}
          totalItems={filteredUsers.length}
          pageSize={userPageSize}
          pageSizeOptions={[15, 20, 25]}
          onPageChange={setUserCurrentPage}
          onPageSizeChange={setUserPageSize}
          className="rounded-b-2xl border-t border-slate-100"
        />
      </div>

      {/* Permissions Editor for Selected User */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Editor Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/75 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Matriz de Permisos para: {selectedUserForPerms.nombre} (@{selectedUserForPerms.username})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza el acceso por cada módulo y acción de forma independiente
            </p>
          </div>

          {/* Quick presets & role buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Rol / Plantilla:</span>
            {[
              { id: 'Administrador Total', label: 'Admin Total' },
              { id: 'Cobranzas', label: 'Cobranzas' },
              { id: 'Contabilidad', label: 'Contabilidad' },
              { id: 'Atención al cliente', label: 'Atención' },
            ].map((p) => {
              const isSelected =
                (p.id === 'Administrador Total' && (editingPerfilBase === 'Administrador' || editingPerfilBase === 'Administrador Total')) ||
                (p.id === 'Cobranzas' && editingPerfilBase === 'Cobranzas') ||
                (p.id === 'Contabilidad' && (editingPerfilBase === 'Supervisor' || editingPerfilBase === 'Contabilidad')) ||
                (p.id === 'Atención al cliente' && editingPerfilBase === 'Atención al cliente');

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback message */}
        {saveSuccessMessage && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMessage('')}
              className="text-emerald-700 hover:text-emerald-900 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                <th className="py-3 px-4">Módulo Funcional</th>
                {ACTION_LABELS.map((act) => (
                  <th key={act.key} className="py-3 px-4 text-center">
                    <span className="block">{act.label}</span>
                    <span className="text-[9px] font-normal text-slate-400 lowercase">{act.desc}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ALL_MODULES.map((moduleKey) => {
                const perms = editingPermissions[moduleKey] || {
                  ver: false,
                  crear: false,
                  modificar: false,
                  eliminar: false,
                  aprobar: false,
                  exportar: false,
                };

                const isAuditModule = moduleKey === 'auditoria';

                return (
                  <tr key={moduleKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {MODULE_LABELS[moduleKey]}
                    </td>
                    {ACTION_LABELS.map((act) => {
                      const isAllowed = !!perms[act.key];
                      const isBlockedAction =
                        isAuditModule && (act.key === 'crear' || act.key === 'modificar' || act.key === 'eliminar' || act.key === 'aprobar');

                      return (
                        <td key={act.key} className="py-3 px-4 text-center">
                          {isBlockedAction ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[10px] font-mono italic">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Inmutable</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTogglePerm(moduleKey, act.key)}
                              disabled={!canManageUsers}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                isAllowed
                                  ? 'bg-sky-500 text-white shadow-2xs hover:bg-sky-600'
                                  : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                              } ${!canManageUsers ? 'cursor-not-allowed opacity-50' : ''}`}
                              title={`${isAllowed ? 'Revocar' : 'Conceder'} permiso ${act.label} en ${moduleKey}`}
                            >
                              {isAllowed ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Justification & Save Button Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex-1 w-full max-w-md">
            <input
              type="text"
              placeholder="Motivo del cambio de permisos para auditoría (opcional)..."
              value={justificationNote}
              onChange={(e) => setJustificationNote(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setEditingPermissions(selectedUserForPerms.permisos)}
              className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
            >
              Revertir cambios
            </button>

            <button
              onClick={handleSavePermissions}
              disabled={!canManageUsers}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs hover:shadow transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Permisos y Auditar</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL: CREAR NUEVO USUARIO Y CONFIGURAR SUS PERMISOS --- */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold">
                  Crear Nuevo Usuario y Definir sus Permisos de Acceso
                </h2>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="p-5 overflow-y-auto space-y-4 text-xs">
              {newUserError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{newUserError}</span>
                </div>
              )}

              {/* Datos Básicos del Usuario */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Gabriela Espinoza"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre de Usuario (@login) *</label>
                  <input
                    type="text"
                    required
                    placeholder="gabriela.espinoza"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cargo Institucional</label>
                  <input
                    type="text"
                    placeholder="Ej: Oficial de Cobranzas"
                    value={newCargo}
                    onChange={(e) => setNewCargo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Selector de Perfil Base */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="font-semibold text-slate-700">Seleccionar Perfil Base:</label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllNewUserPerms}
                      className="text-sky-600 hover:text-sky-800 font-semibold"
                    >
                      Todos los permisos
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleClearAllNewUserPerms}
                      className="text-slate-500 hover:text-slate-700 font-semibold"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Administrador Total', 'Cobranzas', 'Contabilidad', 'Atención al cliente', 'Auditor / Solo Lectura'].map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleApplyPresetToNewUser(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          newPerfilBase === p
                            ? 'bg-sky-600 text-white shadow-xs font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Matriz de Permisos para el Nuevo Usuario */}
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-700 block mb-2">
                  Matriz de Permisos Individuales para este Usuario:
                </span>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Módulo</th>
                        {ACTION_LABELS.map((a) => (
                          <th key={a.key} className="py-2 px-2 text-center">
                            {a.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ALL_MODULES.map((m) => {
                        const p = newUserPermissions[m] || {
                          ver: false,
                          crear: false,
                          modificar: false,
                          eliminar: false,
                          aprobar: false,
                          exportar: false,
                        };
                        const isAudit = m === 'auditoria';

                        return (
                          <tr key={m} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 font-semibold text-slate-800 text-[11px] whitespace-nowrap">
                              {MODULE_LABELS[m]}
                            </td>
                            {ACTION_LABELS.map((a) => {
                              const allowed = !!p[a.key];
                              const blocked = isAudit && a.key !== 'ver' && a.key !== 'exportar';

                              return (
                                <td key={a.key} className="py-2 px-2 text-center">
                                  {blocked ? (
                                    <span className="text-[9px] text-slate-300 font-mono italic">
                                      Inmutable
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleNewUserPerm(m, a.key)}
                                      className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-all ${
                                        allowed
                                          ? 'bg-sky-500 text-white shadow-2xs'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                                      }`}
                                    >
                                      {allowed ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <X className="w-3 h-3" />}
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Crear y Activar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
