import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ModuleName, Payment } from './types';
import { SidebarNav } from './components/layout/SidebarNav';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './views/DashboardView';
import { ClientsView } from './views/ClientsView';
import { ProductsView } from './views/ProductsView';
import { DebtsView } from './views/DebtsView';
import { PaymentsView } from './views/PaymentsView';
import { ReconciliationView } from './views/ReconciliationView';
import { InvoicesView } from './views/InvoicesView';
import { ReportsView } from './views/ReportsView';
import { UsersPermissionsView } from './views/UsersPermissionsView';
import { AuditView } from './views/AuditView';
import { RestrictedAccessView } from './components/common/RestrictedAccessView';
import { ValidationPendingModal } from './components/modals/ValidationPendingModal';
import { ResetDemoModal } from './components/modals/ResetDemoModal';
import { VoucherPreviewModal } from './components/modals/VoucherPreviewModal';

const AppContent: React.FC = () => {
  const { hasPermission, getVoucherById, clients, isNavPinned } = useApp();

  const [currentModule, setCurrentModule] = useState<ModuleName>('dashboard');
  const [isNavExpanded, setIsNavExpanded] = useState<boolean>(false);

  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // almacenamiento no disponible: el tema solo dura la sesion
    }
  }, [isDark]);

  // Modals state
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Cross-module voucher preview modal
  const [activeVoucherPayment, setActiveVoucherPayment] = useState<Payment | null>(null);

  // Cross-module preselection for Payments view
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);
  const [preselectedDebtId, setPreselectedDebtId] = useState<string | null>(null);

  const handleNavigateToPaymentWithTarget = (debtId: string, clientId: string) => {
    setPreselectedClientId(clientId);
    setPreselectedDebtId(debtId);
    setCurrentModule('deudas');
  };

  const handleNavigateToPaymentForClient = (clientId: string) => {
    setPreselectedClientId(clientId);
    setPreselectedDebtId(null);
    setCurrentModule('deudas');
  };

  const handleOpenVoucherModal = (payment: Payment) => {
    setActiveVoucherPayment(payment);
  };

  const activeVoucher = activeVoucherPayment?.comprobanteId
    ? getVoucherById(activeVoucherPayment.comprobanteId)
    : undefined;

  const activeVoucherClient = activeVoucherPayment
    ? clients.find((c) => c.id === activeVoucherPayment.clienteId)
    : undefined;

  // Determine whether current module is allowed
  const hasViewPermission = hasPermission(currentModule, 'ver');

  // Effective nav expanded state (pinned or hovered)
  const effectiveExpanded = isNavPinned || isNavExpanded;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative overflow-x-hidden">
      {/* 
        LEFT-HAND AUTO-COLLAPSING NAVBAR:
        Placed on the left border of the viewport as requested.
      */}
      <SidebarNav
        currentModule={currentModule}
        onSelectModule={(mod) => setCurrentModule(mod)}
        onOpenValidationModal={() => setIsValidationModalOpen(true)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        isExpanded={isNavExpanded}
        setIsExpanded={setIsNavExpanded}
      />

      {/* 
        MAIN CONTENT VIEWPORT:
        Adapts dynamically to the left navbar compact width (~72px = ml-18) vs expanded width (~288px = ml-72).
      */}
      <div
        className={`flex-1 flex flex-col transition-[margin] duration-300 ease-in-out ${
          effectiveExpanded ? 'md:ml-72' : 'md:ml-18'
        }`}
      >
        {/* Contextual Top Header */}
        <TopHeader
          currentModule={currentModule}
          onOpenValidationModal={() => setIsValidationModalOpen(true)}
          onOpenResetModal={() => setIsResetModalOpen(true)}
          onNavigateToModule={(mod) => setCurrentModule(mod)}
          isExpanded={effectiveExpanded}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!hasViewPermission ? (
            <RestrictedAccessView moduleName={currentModule} />
          ) : (
            <>
              {currentModule === 'dashboard' && (
                <DashboardView
                  onNavigate={(mod) => setCurrentModule(mod)}
                  onViewVoucher={handleOpenVoucherModal}
                  onOpenValidationModal={() => setIsValidationModalOpen(true)}
                />
              )}

              {currentModule === 'clientes' && (
                <ClientsView
                  onRegisterPaymentForClient={handleNavigateToPaymentForClient}
                  onViewVoucher={handleOpenVoucherModal}
                />
              )}

              {currentModule === 'productos' && <ProductsView />}

              {(currentModule === 'deudas' || currentModule === 'pagos') && (
                <DebtsView
                  onRegisterPaymentForDebt={handleNavigateToPaymentWithTarget}
                  onViewVoucher={handleOpenVoucherModal}
                  preselectedClientId={preselectedClientId}
                  preselectedDebtId={preselectedDebtId}
                  initialTab={currentModule === 'pagos' ? 'pagos' : 'deudas'}
                />
              )}

              {currentModule === 'conciliacion' && <ReconciliationView />}

              {currentModule === 'facturas' && <InvoicesView />}

              {currentModule === 'reportes' && <ReportsView />}

              {currentModule === 'usuarios' && <UsersPermissionsView />}

              {currentModule === 'auditoria' && <AuditView />}
            </>
          )}
        </main>
      </div>

      {/* --- GLOBAL APPLICATION MODALS --- */}
      {/* 1. Chris Business Decisions Modal (Section 13) */}
      <ValidationPendingModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
      />

      {/* 2. Reset Demo Data Confirmation Modal */}
      <ResetDemoModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* 3. Voucher & OCR Document Preview Modal */}
      <VoucherPreviewModal
        isOpen={Boolean(activeVoucherPayment)}
        onClose={() => setActiveVoucherPayment(null)}
        voucher={activeVoucher}
        payment={activeVoucherPayment || undefined}
        client={activeVoucherClient}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
