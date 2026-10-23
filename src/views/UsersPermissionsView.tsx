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
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';

const MODULE_LABELS: Record<ModuleName, string> = {
  dashboard: '1. Inicio / Dashboard',
  clientes: '2. Clientes',
  productos: '3. Productos',
  deudas: '4. Deudas / Adquisiciones',
  pagos: '5. Pagos',
  conciliacion: '6. Conciliación Bancaria',
  facturas: '7. Facturas y Documentos',
  reportes: '8. Reportes',
  usuarios: '9. Usuarios y Permisos',
  auditoria: '10. Auditoría (Solo lectura)',
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

  const getRoleBadgeStyle = (role?: string) => {
    const normalized = (role || '').toLowerCase();
    if (normalized.includes('admin')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (normalized.includes('cobranza')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (normalized.includes('contab')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (normalized.includes('atenci')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
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

  const canManageUsers = hasPermission('usuarios', 'modificar');

  // When selected user changes, reload their permissions
  const handleSelectUser = (user: DemoUser) => {
    setSelectedUserForPerms(user);
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
    updateUserPermissions(
      selectedUserForPerms.id,
      editingPermissions,
      justificationNote.trim() || `Actualización de permisos personalizados para ${selectedUserForPerms.nombre}`
    );

    setSelectedUserForPerms((prev) => ({
      ...prev,
      permisos: editingPermissions,
    }));

    setSaveSuccessMessage(
      `✓ Permisos guardados y registrados en Auditoría. Ahora puedes cambiar al usuario "${selectedUserForPerms.username}" para probar en vivo sus nuevos accesos.`
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
      `✓ Usuario @${created.username} (${created.nombre}) creado exitosamente con sus permisos personalizados. Puedes hacer clic en "Usar rol" para iniciar sesión con su perfil.`
    );

    setNewUsername('');
    setNewNombre('');
    setNewCargo('');
  };

  return (
    <div className="space-y-6">
      {/* Informative Header Banner with Create User Action */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3 text-xs text-slate-700">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Administración de Usuarios y Matriz de Permisos Granulares
            </h2>
            <p className="text-slate-500 mt-0.5 max-w-2xl">
              Crea nuevos operadores o administradores, asigna roles base o personaliza individualmente cada módulo (Ver, Crear, Modificar, Eliminar, Aprobar, Exportar).
              Cambia la sesión en tiempo real para verificar las restricciones.
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors shrink-0 self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Crear Nuevo Usuario</span>
          </button>
        )}
      </div>

      {/* Users Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, @username o cargo..."
            value={userSearchText}
            onChange={(e) => {
              setUserSearchText(e.target.value);
              setUserCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-slate-700 font-bold">
              Directorio de Usuarios ({filteredUsers.length} de {users.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Haz clic en una fila o en &quot;Editar Permisos&quot; para ajustar su matriz de acceso individual
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/30">
                <th className="py-3 px-4">Usuario / Login</th>
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
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron usuarios con los criterios de búsqueda.
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
                          ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              @{u.username}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{u.nombre}</div>
                        <div className="text-slate-500 text-[11px]">{u.cargo}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border inline-block ${getRoleBadgeStyle(
                            u.perfilBase
                          )}`}
                        >
                          {u.perfilBase || 'Personalizado'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-700 text-[11px]">
                            {allowedCount} / 10
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isCurrentActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                            Sesión Activa
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Disponible</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                              isSelectedToEdit
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title="Editar matriz de permisos de este usuario"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>{isSelectedToEdit ? 'Editando' : 'Editar Permisos'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCurrentUserId(u.id)}
                            disabled={isCurrentActive}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border ${
                              isCurrentActive
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
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
          className="rounded-b-2xl"
        />
      </div>

      {/* Permissions Editor for Selected User */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        {/* Editor Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Matriz de Permisos para: {selectedUserForPerms.nombre} (@{selectedUserForPerms.username})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza el acceso por cada módulo y acción de forma independiente
            </p>
          </div>

          {/* Quick presets buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Cargar plantilla:</span>
            <button
              onClick={() => handleApplyPreset('Administrador Total')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Admin Total
            </button>
            <button
              onClick={() => handleApplyPreset('Cobranzas')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Cobranzas
            </button>
            <button
              onClick={() => handleApplyPreset('Contabilidad')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Contabilidad
            </button>
            <button
              onClick={() => handleApplyPreset('Atención al cliente')}
              className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Atención
            </button>
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
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/50">
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
                  <tr key={moduleKey} className="hover:bg-slate-50">
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
                            <span className="text-[10px] text-slate-300 font-mono italic">
                              Inmutable
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTogglePerm(moduleKey, act.key)}
                              disabled={!canManageUsers}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                isAllowed
                                  ? 'bg-indigo-600 text-white shadow-xs'
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs rounded-b-2xl">
          <div className="flex-1 w-full max-w-md">
            <input
              type="text"
              placeholder="Motivo del cambio de permisos para auditoría (opcional)..."
              value={justificationNote}
              onChange={(e) => setJustificationNote(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Permisos y Auditar</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL: CREAR NUEVO USUARIO Y CONFIGURAR SUS PERMISOS --- */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h2 className="text-sm font-bold">
                  Crear Nuevo Usuario y Definir sus Permisos de Acceso
                </h2>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="p-5 overflow-y-auto space-y-4 text-xs">
              {newUserError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 font-medium">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre de Usuario (@login) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: gespinoza"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cargo / Función</label>
                  <input
                    type="text"
                    placeholder="Ej: Especialista de Cobranzas"
                    value={newCargo}
                    onChange={(e) => setNewCargo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Selector de Plantilla Rápida */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">
                      Plantilla Inicial de Rol / Permisos:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllNewUserPerms}
                      className="px-2 py-1 text-[11px] bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold"
                    >
                      Marcar Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllNewUserPerms}
                      className="px-2 py-1 text-[11px] bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Cobranzas',
                    'Contabilidad',
                    'Atención al cliente',
                    'Auditor / Solo Lectura',
                    'Administrador Total',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPresetToNewUser(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        newPerfilBase === preset
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matriz Granular de Permisos Elegibles para el Nuevo Usuario */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Permisos Específicos por Módulo (Haz clic en los círculos para activar/desactivar):
                </label>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5">Módulo</th>
                        {ACTION_LABELS.map((a) => (
                          <th key={a.key} className="p-2.5 text-center">{a.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {ALL_MODULES.map((modKey) => {
                        const p = newUserPermissions[modKey] || {
                          ver: false,
                          crear: false,
                          modificar: false,
                          eliminar: false,
                          aprobar: false,
                          exportar: false,
                        };
                        const isAudit = modKey === 'auditoria';

                        return (
                          <tr key={modKey} className="hover:bg-slate-50">
                            <td className="p-2.5 font-semibold text-slate-800">
                              {MODULE_LABELS[modKey]}
                            </td>
                            {ACTION_LABELS.map((act) => {
                              const active = !!p[act.key];
                              const blocked = isAudit && act.key !== 'ver' && act.key !== 'exportar';

                              return (
                                <td key={act.key} className="p-2.5 text-center">
                                  {blocked ? (
                                    <span className="text-[10px] text-slate-300 italic">N/A</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleNewUserPerm(modKey, act.key)}
                                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-colors ${
                                        active
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                                      }`}
                                      title={`${active ? 'Desactivar' : 'Activar'} ${act.label} en ${modKey}`}
                                    >
                                      {active ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <X className="w-3 h-3" />}
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  El usuario podrá ingresar de inmediato y sus permisos se aplicarán en tiempo real.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewUserModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Usuario con Permisos</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
