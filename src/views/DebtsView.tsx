import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Debt, Client, Product, Payment, ExtractedData, PaymentMethod } from '../types';
import {
  Receipt,
  Plus,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  X,
  CreditCard,
  DollarSign,
  UserCheck,
  Edit2,
  Eye,
  History,
  FileText,
  Printer,
  Download,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Ban,
  ArrowRight,
  Check,
  Banknote,
  ArrowLeftRight,
  Calendar,
  Bell,
  AlertOctagon,
  RefreshCw,
  Landmark,
} from 'lucide-react';
import { CustomSelect } from '../components/common/CustomSelect';
import { Pagination } from '../components/common/Pagination';

interface DebtsViewProps {
  onRegisterPaymentForDebt?: (debtId: string, clientId: string) => void;
  onViewVoucher?: (payment: Payment) => void;
  preselectedClientId?: string | null;
  preselectedDebtId?: string | null;
  initialTab?: 'deudas' | 'pagos';
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  onViewVoucher,
  preselectedClientId,
  preselectedDebtId,
  initialTab = 'deudas',
}) => {
  const {
    debts,
    clients,
    products,
    payments,
    addDebt,
    addClient,
    addProduct,
    importDebtsBulk,
    getDebtFinancials,
    hasPermission,
    registerPayment,
    cancelPayment,
    logAudit,
    currentUser,
  } = useApp();

  // Active Sub-Tab: "deudas" or "pagos"
  const [activeTab, setActiveTab] = useState<'deudas' | 'pagos'>(initialTab);

  // --- TAB 1 (DEUDAS) FILTERS & PAGINATION ---
  const [debtSearchQuery, setDebtSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debtMethodFilter, setDebtMethodFilter] = useState('all');
  const [debtsCurrentPage, setDebtsCurrentPage] = useState(1);
  const [debtsPageSize, setDebtsPageSize] = useState(15);

  // --- TAB 2 (PAGOS) FILTERS & PAGINATION ---
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [reconciliationFilter, setReconciliationFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentsCurrentPage, setPaymentsCurrentPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(15);

  // --- CREATE DEBT / NUEVA VENTA MODAL STATE ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
  const [clientSearchText, setClientSearchText] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchText, setProductSearchText] = useState('');
  const [precioNominal, setPrecioNominal] = useState<number>(0);
  const [precioAcordado, setPrecioAcordado] = useState<string>('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<PaymentMethod>('transferencia');
  const [saleBankOrEntity, setSaleBankOrEntity] = useState<string>('Banco Pichincha');
  const [saleRequiresFinancing, setSaleRequiresFinancing] = useState<boolean>(false);
  const [salePlazoMeses, setSalePlazoMeses] = useState<number>(3);
  const [saleDiaCorte, setSaleDiaCorte] = useState<number>(15);
  const [saleRegisterInitialPayment, setSaleRegisterInitialPayment] = useState<boolean>(false);
  const [saleInitialPayAmount, setSaleInitialPayAmount] = useState<string>('');
  const [saleInitialTxNumber, setSaleInitialTxNumber] = useState<string>('');
  const [isQuickClientOpen, setIsQuickClientOpen] = useState<boolean>(false);
  const [quickClient, setQuickClient] = useState({ cedula: '', nombres: '', apellidos: '', telefono: '', correo: '' });
  const [quickClientError, setQuickClientError] = useState('');
  const [saleVoucherFileName, setSaleVoucherFileName] = useState<string | null>(null);
  const [saleVoucherOcr, setSaleVoucherOcr] = useState<ExtractedData | null>(null);
  const [isSaleOcrScanning, setIsSaleOcrScanning] = useState<boolean>(false);
  const [observaciones, setObservaciones] = useState('');
  const [formError, setFormError] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(false);

  // --- BULK IMPORT MODAL STATE ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importProductId, setImportProductId] = useState(products[0]?.id || 'prod-01');
  const [importSampleLoaded, setImportSampleLoaded] = useState(false);
  const [importPreviewList, setImportPreviewList] = useState<Array<{
    cedula: string;
    nombres: string;
    apellidos: string;
    precioNominal: number;
    precioAcordado: number;
    observaciones?: string;
    isExistingClient: boolean;
    hasError: boolean;
    errorMsg?: string;
  }>>([]);

  // --- INLINE PAYMENT REGISTRATION MODAL STATE ---
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [debtToPay, setDebtToPay] = useState<Debt | null>(null);
  // For top-level payment registration without pre-selected debt
  const [payModalClientId, setPayModalClientId] = useState('');
  const [payModalClientSearch, setPayModalClientSearch] = useState('');
  const [payModalDebtId, setPayModalDebtId] = useState('');

  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState<Payment['metodo']>('transferencia');
  const [payBank, setPayBank] = useState<string>('Banco Pichincha');
  const [payTxNumber, setPayTxNumber] = useState<string>('');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payError, setPayError] = useState<string>('');
  const [paySuccessMsg, setPaySuccessMsg] = useState<string>('');
  const [isPayOcrScanning, setIsPayOcrScanning] = useState(false);
  const [payOcrExtracted, setPayOcrExtracted] = useState<ExtractedData | null>(null);
  const [payUploadedFileName, setPayUploadedFileName] = useState<string | null>(null);

  // --- PAYMENT HISTORY MODAL STATE ---
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [debtForHistory, setDebtForHistory] = useState<Debt | null>(null);

  // --- INVOICE MODAL STATE (FOR PAID DEBTS) ---
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [debtForInvoice, setDebtForInvoice] = useState<Debt | null>(null);

  // --- CANCEL PAYMENT MODAL STATE ---
  const [paymentToCancel, setPaymentToCancel] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelError, setCancelError] = useState<string>('');

  const canCreate = hasPermission('deudas', 'crear');
  const canPay = hasPermission('pagos', 'crear');
  const canApprove = hasPermission('pagos', 'aprobar');

  // Trigger auto-open if preselectedDebtId changes
  useEffect(() => {
    if (preselectedDebtId) {
      const found = debts.find((d) => d.id === preselectedDebtId);
      if (found) {
        handleOpenPayModal(found);
      }
    }
  }, [preselectedDebtId, debts]);

  // Product autocomplete selection
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setProductSearchText(prod.nombre);
    setPrecioNominal(prod.precioNominal);
    if (!precioAcordado) {
      setPrecioAcordado(prod.precioNominal.toString());
    }
  };

  const handleCreateNewProductOnTheFly = () => {
    if (!productSearchText.trim()) return;
    const nominal = parseFloat(precioAcordado) || 890;
    const newProd = addProduct({
      nombre: productSearchText.trim(),
      descripcion: `Programa educativo creado para asociación directa`,
      precioNominal: nominal,
      estado: 'activo',
    });
    setSelectedProductId(newProd.id);
    setPrecioNominal(newProd.precioNominal);
    setPrecioAcordado(newProd.precioNominal.toString());
  };

  // --- OVERDUE DEBTS & ALERTS CALCULATION ---
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const today = useMemo(() => new Date(), []);

  const getDebtDelayInfo = (debt: Debt) => {
    const fin = getDebtFinancials(debt.id);
    const saldo = fin?.saldoPendiente ?? debt.precioAcordado;
    if (saldo <= 0.001 || debt.estado === 'pagada' || debt.estado === 'anulada') {
      return { isOverdue: false, daysDelayed: 0, overdueReason: '', cuotaNumero: null };
    }

    const totalAbonado = fin?.validPaymentsTotal ?? 0;

    // 1. Si la deuda tiene cuotas configuradas:
    if (debt.cuotas && debt.cuotas.length > 0) {
      let acumuladoEsperado = 0;
      for (const cuota of debt.cuotas) {
        acumuladoEsperado += cuota.monto;
        // Si la cuota ya venció y el total abonado no la cubre completamente
        if (cuota.fechaVencimiento < todayStr && totalAbonado < acumuladoEsperado - 0.01) {
          const dueDate = new Date(cuota.fechaVencimiento);
          const diffTime = Math.max(0, today.getTime() - dueDate.getTime());
          const daysDelayed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          return {
            isOverdue: true,
            daysDelayed,
            overdueReason: `Cuota #${cuota.numero} ($${cuota.monto.toFixed(2)}) venció el ${cuota.fechaVencimiento}`,
            vencimiento: cuota.fechaVencimiento,
            cuotaNumero: cuota.numero,
          };
        }
      }
    }

    // 2. Si tiene día de corte mensual asignado:
    if (debt.diaCorte) {
      const currentDay = today.getDate();
      const acqDate = new Date(debt.fechaAdquisicion);
      const isPastMonth =
        today.getFullYear() > acqDate.getFullYear() ||
        (today.getFullYear() === acqDate.getFullYear() && today.getMonth() > acqDate.getMonth());

      if (isPastMonth || currentDay > debt.diaCorte) {
        const cutDate = new Date(today.getFullYear(), today.getMonth(), debt.diaCorte);
        if (today > cutDate) {
          const daysDelayed = Math.max(1, Math.floor((today.getTime() - cutDate.getTime()) / (1000 * 60 * 60 * 24)));
          return {
            isOverdue: true,
            daysDelayed,
            overdueReason: `Corte mensual (Día ${debt.diaCorte}) superado con saldo impago`,
            vencimiento: cutDate.toISOString().slice(0, 10),
            cuotaNumero: null,
          };
        }
      }
    }

    // 3. Deuda estándar de contado sin pagar tras 30 días:
    const acq = new Date(debt.fechaAdquisicion);
    const daysSinceAcq = Math.floor((today.getTime() - acq.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceAcq > 30) {
      return {
        isOverdue: true,
        daysDelayed: daysSinceAcq - 30,
        overdueReason: `Pago de contado pendiente por más de 30 días`,
        vencimiento: debt.fechaAdquisicion,
        cuotaNumero: null,
      };
    }

    return { isOverdue: false, daysDelayed: 0, overdueReason: '', cuotaNumero: null };
  };

  // Listado de todas las deudas retrasadas para la sección de alertas
  const overdueDebtsList = useMemo(() => {
    return debts
      .map((d) => ({ debt: d, delay: getDebtDelayInfo(d) }))
      .filter((item) => item.delay.isOverdue)
      .sort((a, b) => b.delay.daysDelayed - a.delay.daysDelayed);
  }, [debts, todayStr, today, payments]);

  const totalOverdueBalance = useMemo(() => {
    return overdueDebtsList.reduce((sum, item) => {
      const fin = getDebtFinancials(item.debt.id);
      return sum + (fin?.saldoPendiente || item.debt.precioAcordado);
    }, 0);
  }, [overdueDebtsList, getDebtFinancials]);

  // --- FILTERED DEBTS ---
  const filteredDebts = useMemo(() => {
    return debts.filter((debt) => {
      const client = clients.find((c) => c.id === debt.clienteId);
      const product = products.find((p) => p.id === debt.productoId);

      const matchesSearch =
        client?.nombres.toLowerCase().includes(debtSearchQuery.toLowerCase()) ||
        client?.apellidos.toLowerCase().includes(debtSearchQuery.toLowerCase()) ||
        client?.cedula.toLowerCase().includes(debtSearchQuery.toLowerCase()) ||
        product?.nombre.toLowerCase().includes(debtSearchQuery.toLowerCase());

      const matchesProduct = productFilter === 'all' || debt.productoId === productFilter;
      const matchesStatus = statusFilter === 'all' || debt.estado === statusFilter;

      const debtMethod =
        debt.metodoPago || payments.find((p) => p.deudaId === debt.id)?.metodo || 'transferencia';
      const matchesMethod = debtMethodFilter === 'all' || debtMethod === debtMethodFilter;

      const matchesOverdue = !showOverdueOnly || getDebtDelayInfo(debt).isOverdue;

      return matchesSearch && matchesProduct && matchesStatus && matchesMethod && matchesOverdue;
    });
  }, [debts, clients, products, payments, debtSearchQuery, productFilter, statusFilter, debtMethodFilter, showOverdueOnly, todayStr]);

  const debtsTotalPages = Math.ceil(filteredDebts.length / debtsPageSize) || 1;
  const paginatedDebts = useMemo(() => {
    const startIndex = (debtsCurrentPage - 1) * debtsPageSize;
    return filteredDebts.slice(startIndex, startIndex + debtsPageSize);
  }, [filteredDebts, debtsCurrentPage, debtsPageSize]);

  // --- FILTERED PAYMENTS (TAB 2) ---
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const client = clients.find((c) => c.id === payment.clienteId);
      const matchesSearch =
        client?.nombres.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
        client?.apellidos.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
        client?.cedula.includes(paymentSearchQuery) ||
        payment.numeroTransaccion?.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
        payment.bancoOrigen?.toLowerCase().includes(paymentSearchQuery.toLowerCase());

      const matchesRec =
        reconciliationFilter === 'all' || payment.estadoConciliacion === reconciliationFilter;
      const matchesStatus =
        paymentStatusFilter === 'all' || payment.estadoRegistro === paymentStatusFilter;
      const matchesMethod =
        paymentMethodFilter === 'all' || payment.metodo === paymentMethodFilter;

      return matchesSearch && matchesRec && matchesStatus && matchesMethod;
    });
  }, [payments, clients, paymentSearchQuery, reconciliationFilter, paymentStatusFilter, paymentMethodFilter]);

  const paymentsTotalPages = Math.ceil(filteredPayments.length / paymentsPageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const startIndex = (paymentsCurrentPage - 1) * paymentsPageSize;
    return filteredPayments.slice(startIndex, startIndex + paymentsPageSize);
  }, [filteredPayments, paymentsCurrentPage, paymentsPageSize]);

  // Aggregate Metrics for Header Badges
  const validPaymentsTotalSum = useMemo(() => {
    return payments
      .filter((p) => p.estadoRegistro !== 'anulado')
      .reduce((sum, p) => sum + p.monto, 0);
  }, [payments]);

  const pendingDebtsCount = useMemo(() => {
    return debts.filter((d) => d.estado !== 'pagada' && d.estado !== 'anulada').length;
  }, [debts]);

  // Search candidates for creating debt
  const clientCandidates = useMemo(() => {
    if (!clientSearchText.trim()) return clients.slice(0, 8);
    const q = clientSearchText.toLowerCase();
    return clients.filter(
      (c) =>
        c.nombres.toLowerCase().includes(q) ||
        c.apellidos.toLowerCase().includes(q) ||
        c.cedula.includes(q)
    );
  }, [clients, clientSearchText]);

  const productCandidates = useMemo(() => {
    if (!productSearchText.trim()) return products;
    const q = productSearchText.toLowerCase();
    return products.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [products, productSearchText]);

  // Candidates for top-level payment modal
  const payModalClientCandidates = useMemo(() => {
    if (!payModalClientSearch.trim()) return clients.slice(0, 8);
    const q = payModalClientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.nombres.toLowerCase().includes(q) ||
        c.apellidos.toLowerCase().includes(q) ||
        c.cedula.includes(q)
    );
  }, [clients, payModalClientSearch]);

  const debtsForSelectedPayClient = useMemo(() => {
    if (!payModalClientId) return [];
    return debts.filter((d) => d.clienteId === payModalClientId && d.estado !== 'anulada');
  }, [debts, payModalClientId]);

  // --- ACTIONS ---
  const handleOpenCreateModal = () => {
    setSelectedClientId('');
    setClientSearchText('');
    setSelectedProductId('');
    setProductSearchText('');
    setPrecioNominal(products[0]?.precioNominal || 890);
    setPrecioAcordado((products[0]?.precioNominal || 890).toString());
    setSaleRequiresFinancing(false);
    setSalePlazoMeses(3);
    setSaleDiaCorte(15);
    setSalePaymentMethod('transferencia');
    setSaleBankOrEntity('Banco Pichincha');
    setSaleRegisterInitialPayment(false);
    setSaleInitialPayAmount('');
    setSaleInitialTxNumber('');
    setSaleVoucherFileName(null);
    setSaleVoucherOcr(null);
    setObservaciones('');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleOpenPayModal = (debt: Debt) => {
    const fin = getDebtFinancials(debt.id);
    const remaining = fin?.saldoPendiente || debt.precioAcordado;
    setDebtToPay(debt);
    setPayModalClientId(debt.clienteId);
    setPayModalDebtId(debt.id);
    setPayAmount(remaining > 0 ? remaining.toFixed(2) : debt.precioAcordado.toFixed(2));
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('transferencia');
    setPayBank('Banco Pichincha');
    setPayTxNumber(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayRef(`Abono a deuda ${debt.id}`);
    setPayNotes('');
    setPayError('');
    setPayOcrExtracted(null);
    setPayUploadedFileName(null);
    setIsPayModalOpen(true);
  };

  const handlePayMethodChange = (method: Payment['metodo']) => {
    setPayMethod(method);
    if (method === 'efectivo') {
      setPayBank('Caja Principal');
      if (!payTxNumber || payTxNumber.startsWith('TX-') || payTxNumber.startsWith('AUTH-')) {
        setPayTxNumber(`REC-${Math.floor(10000 + Math.random() * 90000)}`);
      }
    } else if (method === 'tarjeta') {
      setPayBank('Visa (Datafast)');
      if (!payTxNumber || payTxNumber.startsWith('TX-') || payTxNumber.startsWith('REC-')) {
        setPayTxNumber(`AUTH-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } else if (method === 'transferencia') {
      setPayBank('Banco Pichincha');
      if (!payTxNumber || payTxNumber.startsWith('REC-') || payTxNumber.startsWith('AUTH-') || payTxNumber.startsWith('DEP-')) {
        setPayTxNumber(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    } else if (method === 'deposito') {
      setPayBank('Banco Pichincha');
      if (!payTxNumber || payTxNumber.startsWith('TX-') || payTxNumber.startsWith('REC-') || payTxNumber.startsWith('AUTH-')) {
        setPayTxNumber(`DEP-${Math.floor(100000 + Math.random() * 900000)}`);
      }
    }
  };

  const handleOpenTopLevelPayModal = () => {
    setDebtToPay(null);
    setPayModalClientId(clients[0]?.id || '');
    setPayModalClientSearch('');
    const firstClientDebts = debts.filter(
      (d) => d.clienteId === (clients[0]?.id || '') && d.estado !== 'anulada'
    );
    const firstDebt = firstClientDebts[0];
    setPayModalDebtId(firstDebt?.id || '');
    const fin = firstDebt ? getDebtFinancials(firstDebt.id) : null;
    setPayAmount(fin ? fin.saldoPendiente.toFixed(2) : '150.00');
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('transferencia');
    setPayBank('Banco Pichincha');
    setPayTxNumber(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayRef('Abono educativo cuota directa');
    setPayNotes('');
    setPayError('');
    setPayOcrExtracted(null);
    setPayUploadedFileName(null);
    setIsPayModalOpen(true);
  };

  const handleOcrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPayUploadedFileName(file.name);
    setIsPayOcrScanning(true);

    const targetDebt = debtToPay || debts.find((d) => d.id === payModalDebtId);

    setTimeout(() => {
      const fin = targetDebt ? getDebtFinancials(targetDebt.id) : null;
      const remaining = fin?.saldoPendiente || 150;
      const simulatedAmount = Math.min(remaining, remaining > 250 ? 250 : remaining);
      const randomTx = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
      const client = targetDebt ? clients.find((c) => c.id === targetDebt.clienteId) : null;

      // Detectar banco tentativo por el nombre del archivo
      let detectedBank = payBank;
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('guayaquil') || lowerName.includes('bg')) {
        detectedBank = 'Banco Guayaquil';
      } else if (lowerName.includes('produbanco')) {
        detectedBank = 'Produbanco';
      } else if (lowerName.includes('pacifico') || lowerName.includes('bp')) {
        detectedBank = 'Banco del Pacífico';
      } else if (lowerName.includes('pichincha')) {
        detectedBank = 'Banco Pichincha';
      }

      const ocr: ExtractedData = {
        banco: detectedBank,
        numeroTransaccion: randomTx,
        monto: simulatedAmount,
        fecha: new Date().toISOString().slice(0, 10),
        ordenante: client ? `${client.nombres} ${client.apellidos}`.toUpperCase() : 'ORDENANTE COMPROBANTE',
        referencia: `Depósito ${file.name.slice(0, 20)}`,
        confianza: Math.floor(95 + Math.random() * 4), // 95 - 99%
      };

      setPayOcrExtracted(ocr);
      setPayAmount(simulatedAmount.toFixed(2));
      setPayTxNumber(randomTx);
      setPayBank(detectedBank);
      setPayRef(ocr.referencia || `Váucher: ${file.name}`);
      setIsPayOcrScanning(false);
    }, 700);
  };

  const handleQuickClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cedula = quickClient.cedula.trim();
    if (!cedula || !quickClient.nombres.trim() || !quickClient.apellidos.trim()) {
      setQuickClientError('Cédula, nombres y apellidos son obligatorios.');
      return;
    }
    if (clients.some((c) => c.cedula.toLowerCase().replace(' (demo)', '').trim() === cedula.toLowerCase())) {
      setQuickClientError('Ya existe un cliente con esa cédula.');
      return;
    }
    const created = addClient({
      cedula: `${cedula} (Demo)`,
      nombres: quickClient.nombres.trim(),
      apellidos: quickClient.apellidos.trim(),
      telefono: quickClient.telefono.trim(),
      correo: quickClient.correo.trim(),
      estado: 'activo',
      notas: '',
    });
    setSelectedClientId(created.id);
    setClientSearchText(`${created.nombres} ${created.apellidos} (${created.cedula})`);
    setIsQuickClientOpen(false);
  };

  const handleSaleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaleVoucherFileName(file.name);
    setIsSaleOcrScanning(true);

    setTimeout(() => {
      const typedAmount = parseFloat(saleInitialPayAmount);
      const amount = !isNaN(typedAmount) && typedAmount > 0 ? typedAmount : 150;
      const randomTx = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
      const client = clients.find((c) => c.id === selectedClientId);

      const ocr: ExtractedData = {
        banco: saleBankOrEntity,
        numeroTransaccion: randomTx,
        monto: amount,
        fecha: new Date().toISOString().slice(0, 10),
        ordenante: client ? `${client.nombres} ${client.apellidos}`.toUpperCase() : 'ORDENANTE COMPROBANTE',
        referencia: `Abono inicial ${file.name.slice(0, 20)}`,
        confianza: Math.floor(95 + Math.random() * 4),
      };

      setSaleVoucherOcr(ocr);
      setSaleInitialPayAmount(amount.toFixed(2));
      setSaleInitialTxNumber(randomTx);
      setIsSaleOcrScanning(false);
    }, 700);
    e.target.value = '';
  };

  const handleSimulateInlineOCR = () => {
    const targetDebt = debtToPay || debts.find((d) => d.id === payModalDebtId);
    if (!targetDebt) return;
    setPayUploadedFileName('Comprobante_Transferencia_Pichincha.pdf');
    setIsPayOcrScanning(true);
    setTimeout(() => {
      const fin = getDebtFinancials(targetDebt.id);
      const remaining = fin?.saldoPendiente || 100;
      const simulatedAmount = Math.min(remaining, remaining > 200 ? 200 : remaining);
      const randomTx = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
      const client = clients.find((c) => c.id === targetDebt.clienteId);

      const ocr: ExtractedData = {
        banco: payBank,
        numeroTransaccion: randomTx,
        monto: simulatedAmount,
        fecha: new Date().toISOString().slice(0, 10),
        ordenante: client ? `${client.nombres} ${client.apellidos}`.toUpperCase() : 'ORDENANTE ALUMNO',
        referencia: `Matrícula educación ${client?.apellidos || ''}`,
        confianza: 98,
      };

      setPayOcrExtracted(ocr);
      setPayAmount(simulatedAmount.toFixed(2));
      setPayTxNumber(randomTx);
      setPayRef(ocr.referencia || '');
      setIsPayOcrScanning(false);
    }, 600);
  };

  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    const targetDebt = debtToPay || debts.find((d) => d.id === payModalDebtId);
    if (!targetDebt) {
      setPayError('Debe seleccionar una deuda o adquisición para aplicar el pago.');
      return;
    }

    const montoVal = parseFloat(payAmount);
    if (isNaN(montoVal) || montoVal <= 0) {
      setPayError('El monto del pago debe ser mayor a 0.');
      return;
    }

    const fin = getDebtFinancials(targetDebt.id);
    const saldo = fin?.saldoPendiente || targetDebt.precioAcordado;

    if (montoVal > saldo + 0.01) {
      setPayError(`El monto ($${montoVal.toFixed(2)}) no puede exceder el saldo pendiente ($${saldo.toFixed(2)}).`);
      return;
    }

    const payment = registerPayment(
      {
        deudaId: targetDebt.id,
        clienteId: targetDebt.clienteId,
        monto: montoVal,
        fechaPago: payDate,
        metodo: payMethod,
        bancoOrigen: payBank,
        numeroTransaccion: payTxNumber.trim() || undefined,
        referencia: payRef.trim() || undefined,
        observaciones: payNotes.trim() || undefined,
      },
      payOcrExtracted
        ? {
            nombreArchivo: payUploadedFileName || `Comprobante_${payTxNumber || 'TX'}.pdf`,
            tipoArchivo: payUploadedFileName?.endsWith('.png') || payUploadedFileName?.endsWith('.jpg') || payUploadedFileName?.endsWith('.jpeg')
              ? 'image/jpeg'
              : 'application/pdf',
            datosExtraidos: payOcrExtracted,
          }
        : undefined
    );

    logAudit(
      'pagos',
      'crear',
      'pago',
      payment.id,
      undefined,
      {
        deudaId: targetDebt.id,
        monto: montoVal,
        metodo: payMethod,
        bancoOrigen: payBank,
        numeroTransaccion: payTxNumber,
      },
      `Pago de $${montoVal.toFixed(2)} registrado dentro de Deudas y Cobranzas`
    );

    setPaySuccessMsg(`✓ Pago de $${montoVal.toFixed(2)} registrado exitosamente y reflejado en el historial y bitácora.`);
    setTimeout(() => {
      setIsPayModalOpen(false);
      setDebtToPay(null);
      setPaySuccessMsg('');
    }, 1200);
  };

  const handleCancelPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCancelError('');
    if (!paymentToCancel) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      setCancelError('Ingrese un motivo detallado (mínimo 5 caracteres) para auditoría.');
      return;
    }

    cancelPayment(paymentToCancel.id, cancelReason.trim());
    setPaymentToCancel(null);
    setCancelReason('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedClientId) {
      setFormError('Debe seleccionar un alumno / cliente.');
      return;
    }
    if (!selectedProductId) {
      setFormError('Debe digitar o seleccionar un programa / producto.');
      return;
    }

    const acordado = parseFloat(precioAcordado);
    if (isNaN(acordado) || acordado <= 0) {
      setFormError('Ingrese un precio acordado válido mayor a 0.');
      return;
    }

    // Generar cronograma de cuotas si el cliente acordó financiamiento / pagos diferidos
    let cuotasGeneradas: Array<{
      numero: number;
      monto: number;
      fechaVencimiento: string;
      estado: 'pendiente' | 'pagada' | 'vencida';
    }> | undefined = undefined;

    let plazoGuardado: number | undefined = undefined;
    let diaCorteGuardado: number | undefined = undefined;

    if (saleRequiresFinancing) {
      const meses = Math.max(1, salePlazoMeses || 1);
      const valorPorCuota = parseFloat((acordado / meses).toFixed(2));
      const diaCorteElegido = Math.min(30, Math.max(1, saleDiaCorte || 15));
      
      const baseDate = new Date();
      cuotasGeneradas = [];

      for (let i = 1; i <= meses; i++) {
        const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, diaCorteElegido);
        const fechaVenc = dueDate.toISOString().slice(0, 10);
        cuotasGeneradas.push({
          numero: i,
          monto: i === meses ? parseFloat((acordado - valorPorCuota * (meses - 1)).toFixed(2)) : valorPorCuota,
          fechaVencimiento: fechaVenc,
          estado: 'pendiente',
        });
      }

      plazoGuardado = salePlazoMeses;
      diaCorteGuardado = saleDiaCorte;
    }

    const newDebt = addDebt({
      clienteId: selectedClientId,
      productoId: selectedProductId,
      fechaAdquisicion: new Date().toISOString().slice(0, 10),
      precioNominalAplicado: precioNominal,
      precioAcordado: acordado,
      metodoPago: salePaymentMethod,
      plazoMeses: plazoGuardado,
      diaCorte: diaCorteGuardado,
      cuotas: cuotasGeneradas,
      observaciones: observaciones.trim() || undefined,
    });

    // Si se activó registrar pago inicial inmediato:
    if (saleRegisterInitialPayment) {
      const initAmount = parseFloat(saleInitialPayAmount);
      if (!isNaN(initAmount) && initAmount > 0) {
        const finalInitAmount = Math.min(initAmount, acordado);
        registerPayment(
          {
            deudaId: newDebt.id,
            clienteId: selectedClientId,
            monto: finalInitAmount,
            fechaPago: new Date().toISOString().slice(0, 10),
            metodo: salePaymentMethod,
            bancoOrigen: saleBankOrEntity,
            numeroTransaccion: saleInitialTxNumber.trim() || undefined,
            referencia: `Abono inicial venta ${newDebt.id}`,
            observaciones: `Abono inicial registrado en conjunto con la nueva venta (${salePaymentMethod})`,
          },
          saleVoucherFileName && saleVoucherOcr
            ? {
                nombreArchivo: saleVoucherFileName,
                tipoArchivo: /\.(png|jpe?g)$/i.test(saleVoucherFileName) ? 'image/jpeg' : 'application/pdf',
                datosExtraidos: saleVoucherOcr,
              }
            : undefined
        );
        logAudit(
          'pagos',
          'crear',
          'pago',
          `pay-init-${newDebt.id}`,
          undefined,
          {
            deudaId: newDebt.id,
            monto: finalInitAmount,
            metodo: salePaymentMethod,
          },
          `Abono inicial de $${finalInitAmount.toFixed(2)} registrado al crear la venta`
        );
      }
    }

    setIsCreateModalOpen(false);
    setSelectedClientId('');
    setClientSearchText('');
    setSelectedProductId('');
    setProductSearchText('');
    setPrecioAcordado('');
    setSaleRegisterInitialPayment(false);
    setSaleInitialPayAmount('');
    setSaleInitialTxNumber('');
    setSaleVoucherFileName(null);
    setSaleVoucherOcr(null);
    setObservaciones('');
  };

  const handleLoadImportSample = () => {
    const selectedProd = products.find((p) => p.id === importProductId);
    const nominal = selectedProd?.precioNominal || 890;

    const sample = [
      {
        cedula: '1718293041',
        nombres: 'Carlos',
        apellidos: 'Mendoza Viteri',
        precioNominal: nominal,
        precioAcordado: 790,
        observaciones: 'Nueva especialización con beca previa',
        isExistingClient: true,
        hasError: false,
      },
      {
        cedula: '1755443322',
        nombres: 'Daniela Alejandra',
        apellidos: 'Morales Cifuentes',
        precioNominal: nominal,
        precioAcordado: nominal,
        observaciones: 'Inscripción anticipada regular',
        isExistingClient: false,
        hasError: false,
      },
      {
        cedula: '1766778899',
        nombres: 'Santiago Andrés',
        apellidos: 'Gómez Játiva',
        precioNominal: nominal,
        precioAcordado: 750,
        observaciones: 'Tarifa convenio universitario',
        isExistingClient: false,
        hasError: false,
      },
      {
        cedula: '1700000000',
        nombres: 'Alonso Error',
        apellidos: 'Precio Invalido',
        precioNominal: nominal,
        precioAcordado: -50,
        observaciones: 'Monto erróneo para validar detección',
        isExistingClient: false,
        hasError: true,
        errorMsg: 'Precio acordado no puede ser negativo',
      },
    ];

    setImportPreviewList(sample);
    setImportSampleLoaded(true);
  };

  const handleFixPreviewItem = (index: number, newPrice: number) => {
    setImportPreviewList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        precioAcordado: newPrice,
        hasError: newPrice <= 0,
        errorMsg: newPrice <= 0 ? 'Precio acordado debe ser mayor a 0' : undefined,
      };
      return updated;
    });
  };

  const handleConfirmBulkImport = () => {
    const hasUnresolved = importPreviewList.some((i) => i.hasError);
    if (hasUnresolved) {
      alert('Por favor corrija los precios erróneos antes de confirmar la importación.');
      return;
    }

    const itemsToImport = importPreviewList.map((item) => {
      let client = clients.find((c) => c.cedula.includes(item.cedula));
      let cid = client?.id;
      if (!cid) {
        cid = `cli-imp-${Date.now().toString().slice(-4)}`;
      }
      return {
        clienteId: cid,
        productoId: importProductId,
        fechaAdquisicion: new Date().toISOString().slice(0, 10),
        precioNominal: item.precioNominal,
        precioAcordado: item.precioAcordado,
        observaciones: item.observaciones,
      };
    });

    importDebtsBulk(itemsToImport);
    setIsImportModalOpen(false);
    setImportSampleLoaded(false);
    setImportPreviewList([]);
  };

  return (
    <div className="space-y-6">
      {/* --- UNIFIED TABS NAVIGATION HEADER --- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('deudas')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'deudas'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Cuentas por Cobrar (Deudas)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {debts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagos')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pagos'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Histórico General de Pagos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {payments.length} (${validPaymentsTotalSum.toFixed(2)})
            </span>
          </button>
        </div>

        {/* Global Action Shortcuts: Nueva Venta y Registrar Pago (con Nueva Venta en primera posición) */}
        <div className="flex items-center gap-2 px-1">
          {canCreate && (
            <button
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Venta</span>
            </button>
          )}

          {canPay && (
            <button
              onClick={handleOpenTopLevelPayModal}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Registrar Pago</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CUENTAS POR COBRAR (DEUDAS Y ADQUISICIONES)                       */}
      {/* ========================================================================= */}
      {activeTab === 'deudas' && (
        <div className="space-y-4">
          {/* SECCIÓN DE ALERTAS DE RETRASO Y CUOTAS VENCIDAS */}
          {overdueDebtsList.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0 relative">
                    <Bell className="w-5 h-5 animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        Alertas de Cobranza: Cuotas y Pagos en Retraso
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-2xs">
                        {overdueDebtsList.length} {overdueDebtsList.length === 1 ? 'caso en mora' : 'casos en mora'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Se detectaron pagos impagos que superaron su fecha límite o día de corte mensual. Puedes ver el detalle filtrando la tabla.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-rose-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Saldo Total en Retraso
                    </span>
                    <span className="text-base font-extrabold text-rose-700 font-mono">
                      ${totalOverdueBalance.toFixed(2)} USD
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowOverdueOnly(!showOverdueOnly);
                      setDebtsCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs shrink-0 ${
                      showOverdueOnly
                        ? 'bg-rose-600 text-white ring-2 ring-rose-500/30'
                        : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-100/60'
                    }`}
                  >
                    <Bell className="w-4 h-4 text-rose-600" />
                    <span>{showOverdueOnly ? 'Mostrando solo retrasados' : 'Filtrar cuentas con retraso'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Informative Rule Note */}
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
            <Receipt className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Regla Conceptual:</strong> Cada deuda representa una venta o adquisición de un programa educativo por un alumno.
              Desde esta misma tabla puedes registrar <strong>nuevas ventas</strong> con plazos y días de corte, pulsar <strong>Pagar</strong> para registrar abonos con comprobante,
              consultar el <strong>Historial de pagos</strong> y ver la <strong>Factura oficial</strong> en adquisiciones canceladas.
            </div>
          </div>

          {/* Filter and Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por alumno, cédula o programa..."
                value={debtSearchQuery}
                onChange={(e) => {
                  setDebtSearchQuery(e.target.value);
                  setDebtsCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Custom Selectors and Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los programas' },
                  ...products.map((p) => ({
                    value: p.id,
                    label: p.nombre,
                  })),
                ]}
                value={productFilter}
                onChange={(val) => {
                  setProductFilter(val);
                  setDebtsCurrentPage(1);
                }}
                searchable={products.length > 5}
                className="w-48"
              />

              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'pendiente', label: 'Pendientes de pago' },
                  { value: 'parcial', label: 'Parcialmente pagadas' },
                  { value: 'pagada', label: 'Totalmente pagadas' },
                  { value: 'anulada', label: 'Anuladas' },
                ]}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setDebtsCurrentPage(1);
                }}
                className="w-44"
              />

              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los Tipos de Pago' },
                  { value: 'transferencia', label: 'Transferencia' },
                  { value: 'efectivo', label: 'Efectivo' },
                  { value: 'tarjeta', label: 'Tarjeta' },
                  { value: 'deposito', label: 'Depósito' },
                ]}
                value={debtMethodFilter}
                onChange={(val) => {
                  setDebtMethodFilter(val);
                  setDebtsCurrentPage(1);
                }}
                className="w-48"
              />

              {canCreate && (
                <button
                  onClick={() => {
                    setImportSampleLoaded(false);
                    setImportPreviewList([]);
                    setIsImportModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Cargar masivamente inscripciones desde Excel (Flujo A)"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Carga Masiva Excel</span>
                </button>
              )}
            </div>
          </div>

          {/* Debts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando <strong>{paginatedDebts.length}</strong> de <strong>{filteredDebts.length}</strong> deudas/adquisiciones
              </span>
              <span className="text-[11px] text-slate-400">
                Saldos recalculados automáticamente según pagos válidos en tiempo real
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Alumno / Cliente</th>
                    <th className="py-3 px-4">Programa / Producto</th>
                    <th className="py-3 px-4">Tipo de Pago</th>
                    <th className="py-3 px-4">P. Acordado</th>
                    <th className="py-3 px-4">Pagos Acumulados</th>
                    <th className="py-3 px-4">Saldo Pendiente</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDebts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                        No se encontraron registros con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedDebts.map((debt) => {
                      const fin = getDebtFinancials(debt.id);
                      const client = clients.find((c) => c.id === debt.clienteId);
                      const product = products.find((p) => p.id === debt.productoId);
                      const isPaid = (fin?.saldoPendiente || 0) <= 0.001 || debt.estado === 'pagada';
                      const hasDebtPayments = payments.some((p) => p.deudaId === debt.id);

                      return (
                        <tr key={debt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 block">
                              {client ? `${client.nombres} ${client.apellidos}` : debt.clienteId}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {client?.cedula || 'ID: ' + debt.clienteId}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                            <span>{product?.nombre || debt.productoId}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">{debt.fechaAdquisicion}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {(() => {
                              const dMethod =
                                debt.metodoPago ||
                                payments.find((p) => p.deudaId === debt.id)?.metodo ||
                                'transferencia';
                              return (
                                <div className="flex items-center gap-1.5">
                                  {dMethod === 'transferencia' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                      <ArrowLeftRight className="w-3 h-3" />
                                      Transferencia
                                    </span>
                                  )}
                                  {dMethod === 'efectivo' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Banknote className="w-3 h-3" />
                                      Efectivo
                                    </span>
                                  )}
                                  {dMethod === 'tarjeta' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                      <CreditCard className="w-3 h-3" />
                                      Tarjeta
                                    </span>
                                  )}
                                  {dMethod === 'deposito' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                      <Landmark className="w-3 h-3" />
                                      Depósito
                                    </span>
                                  )}
                                  {dMethod !== 'transferencia' && dMethod !== 'efectivo' && dMethod !== 'tarjeta' && dMethod !== 'deposito' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                      {dMethod}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 tabular-nums whitespace-nowrap">
                            <div>${debt.precioAcordado.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 font-normal line-through">${debt.precioNominalAplicado.toFixed(2)}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                            ${(fin?.validPaymentsTotal || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-bold tabular-nums whitespace-nowrap">
                            {(() => {
                              const delay = getDebtDelayInfo(debt);
                              return (
                                <div>
                                  {!isPaid ? (
                                    <span className={delay.isOverdue ? 'text-rose-700 font-extrabold' : 'text-amber-700'}>
                                      ${(fin?.saldoPendiente || 0).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Pagado ($0.00)
                                    </span>
                                  )}

                                  {delay.isOverdue && !isPaid && (
                                    <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      {delay.daysDelayed}d retraso
                                    </span>
                                  )}
                                  {debt.diaCorte && !isPaid && !delay.isOverdue && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      Corte: Día {debt.diaCorte}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {(() => {
                              const delay = getDebtDelayInfo(debt);
                              if (!isPaid && delay.isOverdue) {
                                return (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-300 flex items-center gap-1 w-fit">
                                    <Clock className="w-3 h-3 text-rose-600" />
                                    En Mora
                                  </span>
                                );
                              }
                              return (
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                    isPaid
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : debt.estado === 'parcial'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : debt.estado === 'anulada'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {isPaid
                                    ? 'Pagada'
                                    : debt.estado === 'parcial'
                                    ? 'Parcial'
                                    : debt.estado === 'anulada'
                                    ? 'Anulada'
                                    : 'Pendiente'}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Pagar (para deudas con saldo pendiente) */}
                              {!isPaid && debt.estado !== 'anulada' && canPay && (
                                <button
                                  onClick={() => handleOpenPayModal(debt)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
                                  title="Registrar pago directo para esta deuda"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pagar</span>
                                </button>
                              )}

                              {/* Botón Factura (para deudas pagadas) */}
                              {isPaid && (
                                <button
                                  onClick={() => {
                                    setDebtForInvoice(debt);
                                    setIsInvoiceModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-emerald-200"
                                  title="Ver factura oficial de esta deuda pagada"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Factura</span>
                                </button>
                              )}

                              {/* Botón Historial de Pagos de la Deuda */}
                              <button
                                onClick={() => {
                                  setDebtForHistory(debt);
                                  setIsHistoryModalOpen(true);
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 border ${
                                  hasDebtPayments
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                                }`}
                                title="Ver historial cronológico de pagos de esta adquisición"
                              >
                                <History className="w-3 h-3" />
                                <span>Historial</span>
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
              currentPage={debtsCurrentPage}
              totalPages={debtsTotalPages}
              totalItems={filteredDebts.length}
              pageSize={debtsPageSize}
              pageSizeOptions={[15, 20, 25]}
              onPageChange={setDebtsCurrentPage}
              onPageSizeChange={setDebtsPageSize}
              className="rounded-b-2xl"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTÓRICO GENERAL Y REGISTRO DE PAGOS                              */}
      {/* ========================================================================= */}
      {activeTab === 'pagos' && (
        <div className="space-y-4">
          {/* Informative Rule Note */}
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
            <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Histórico de Cobranzas y Pagos:</strong> Consulta la totalidad de pagos recibidos,
              estados de conciliación bancaria y comprobantes adjuntos con trazabilidad en la bitácora.
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por alumno, cédula o No. transacción..."
                value={paymentSearchQuery}
                onChange={(e) => {
                  setPaymentSearchQuery(e.target.value);
                  setPaymentsCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los Métodos' },
                  { value: 'transferencia', label: 'Transferencia' },
                  { value: 'efectivo', label: 'Efectivo' },
                  { value: 'tarjeta', label: 'Tarjeta' },
                  { value: 'deposito', label: 'Depósito' },
                ]}
                value={paymentMethodFilter}
                onChange={(val) => {
                  setPaymentMethodFilter(val);
                  setPaymentsCurrentPage(1);
                }}
                className="w-44"
              />

              <CustomSelect
                options={[
                  { value: 'all', label: 'Toda Conciliación' },
                  { value: 'conciliado_auto', label: 'Conciliado Automático' },
                  { value: 'conciliado_manual', label: 'Conciliado Manual' },
                  { value: 'pendiente', label: 'Pendiente de Conciliar' },
                  { value: 'con_diferencias', label: 'Con Diferencias' },
                  { value: 'revision_manual', label: 'Revisión Manual' },
                  { value: 'no_encontrado', label: 'No Encontrado en Banco' },
                ]}
                value={reconciliationFilter}
                onChange={(val) => {
                  setReconciliationFilter(val);
                  setPaymentsCurrentPage(1);
                }}
                className="w-48"
              />

              <CustomSelect
                options={[
                  { value: 'all', label: 'Todos los Registros' },
                  { value: 'registrado', label: 'Registrados Válidos' },
                  { value: 'anulado', label: 'Anulados' },
                ]}
                value={paymentStatusFilter}
                onChange={(val) => {
                  setPaymentStatusFilter(val);
                  setPaymentsCurrentPage(1);
                }}
                className="w-44"
              />

              {canPay && (
                <button
                  onClick={handleOpenTopLevelPayModal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Pago</span>
                </button>
              )}
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <span className="text-xs text-slate-500 font-medium">
                Mostrando <strong>{paginatedPayments.length}</strong> de <strong>{filteredPayments.length}</strong> pagos registrados
              </span>
              <span className="text-[11px] text-slate-400">
                Los pagos anulados liberan saldo y quedan documentados en auditoría
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Fecha / ID</th>
                    <th className="py-3 px-4">Alumno / Cédula</th>
                    <th className="py-3 px-4">Monto ($)</th>
                    <th className="py-3 px-4">Método / Banco</th>
                    <th className="py-3 px-4">No. Transacción</th>
                    <th className="py-3 px-4">Registro</th>
                    <th className="py-3 px-4">Conciliación</th>
                    <th className="py-3 px-4 text-right">Comprobante / Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No se encontraron pagos con los criterios de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((p) => {
                      const client = clients.find((c) => c.id === p.clienteId);
                      const isAnulado = p.estadoRegistro === 'anulado';

                      return (
                        <tr key={p.id} className={isAnulado ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50'}>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 block">{p.fechaPago}</span>
                            <span className="text-[10px] font-mono text-slate-400">{p.id}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 block">
                              {client ? `${client.nombres} ${client.apellidos}` : p.clienteId}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {client?.cedula || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                            <span className={isAnulado ? 'line-through text-slate-400' : 'text-emerald-700'}>
                              ${p.monto.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {p.metodo === 'transferencia' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  <ArrowLeftRight className="w-3 h-3" />
                                  Transferencia
                                </span>
                              )}
                              {p.metodo === 'efectivo' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Banknote className="w-3 h-3" />
                                  Efectivo
                                </span>
                              )}
                              {p.metodo === 'tarjeta' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  <CreditCard className="w-3 h-3" />
                                  Tarjeta
                                </span>
                              )}
                              {p.metodo === 'deposito' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Landmark className="w-3 h-3" />
                                  Depósito
                                </span>
                              )}
                              {p.metodo !== 'transferencia' && p.metodo !== 'efectivo' && p.metodo !== 'tarjeta' && p.metodo !== 'deposito' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                                  {p.metodo}
                                </span>
                              )}
                            </div>
                            {p.bancoOrigen && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{p.bancoOrigen}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                            {p.numeroTransaccion || 'S/N'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                isAnulado
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isAnulado ? 'Anulado' : 'Registrado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                p.estadoConciliacion.includes('conciliado')
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {p.estadoConciliacion.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {onViewVoucher && (
                                <button
                                  onClick={() => onViewVoucher(p)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                  title="Ver comprobante o voucher bancario"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Voucher</span>
                                </button>
                              )}

                              {!isAnulado && canApprove && (
                                <button
                                  onClick={() => {
                                    setPaymentToCancel(p);
                                    setCancelReason('');
                                    setCancelError('');
                                  }}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Anular pago y justificar en auditoría"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
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
              currentPage={paymentsCurrentPage}
              totalPages={paymentsTotalPages}
              totalItems={filteredPayments.length}
              pageSize={paymentsPageSize}
              pageSizeOptions={[15, 20, 25]}
              onPageChange={setPaymentsCurrentPage}
              onPageSizeChange={setPaymentsPageSize}
              className="rounded-b-2xl"
            />
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE INDIVIDUAL DEBT ASSOCIATION / NUEVA VENTA --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Nueva Venta (Inscripción / Adquisición de Programa)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Configure el alumno, programa, plazos diferidos, corte mensual y abono inicial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              {/* 2-Column Main Section: Client & Product Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. SELECCIONAR CLIENTE */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block font-bold text-slate-800 text-xs">
                      1. Seleccionar Alumno / Cliente *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickClient({ cedula: '', nombres: '', apellidos: '', telefono: '', correo: '' });
                        setQuickClientError('');
                        setIsQuickClientOpen(true);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nuevo cliente</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o cédula..."
                      value={clientSearchText}
                      onChange={(e) => {
                        setClientSearchText(e.target.value);
                        setSelectedClientId('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {clientCandidates.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 italic">
                        No se encontraron alumnos con ese criterio
                      </div>
                    ) : (
                      clientCandidates.map((c) => {
                        const isSelected = selectedClientId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setClientSearchText(`${c.nombres} ${c.apellidos} (${c.cedula})`);
                            }}
                            className={`p-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                              isSelected ? 'bg-indigo-50/90 font-bold text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <span className="font-semibold block">{c.nombres} {c.apellidos}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Cédula: {c.cedula}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. PROGRAMA / PRODUCTO */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <label className="block font-bold text-slate-800 text-xs">
                    2. Programa Educativo o Servicio *
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar programa o digitar uno nuevo..."
                      value={productSearchText}
                      onChange={(e) => {
                        setProductSearchText(e.target.value);
                        const exact = products.find(
                          (p) => p.nombre.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (exact) {
                          setSelectedProductId(exact.id);
                          setPrecioNominal(exact.precioNominal);
                          if (!precioAcordado) setPrecioAcordado(exact.precioNominal.toString());
                        } else {
                          setSelectedProductId('');
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {productCandidates.map((p) => {
                      const isSelected = selectedProductId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className={`p-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isSelected ? 'bg-indigo-50/90 font-bold text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">{p.nombre}</span>
                            <span className="text-[10px] text-slate-400">Precio Lista: ${p.precioNominal.toFixed(2)}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                        </div>
                      );
                    })}

                    {productSearchText.trim() && productCandidates.length === 0 && (
                      <div
                        onClick={handleCreateNewProductOnTheFly}
                        className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 cursor-pointer flex items-center gap-2 transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4 text-indigo-600" />
                        <span>
                          Crear y asociar nuevo producto: <strong>"{productSearchText.trim()}"</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Precios & Condiciones Económicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1 text-[11px]">
                    Precio Nominal de Lista (Catálogo)
                  </label>
                  <div className="font-bold text-slate-700 text-base font-mono">
                    ${precioNominal.toFixed(2)} USD
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Tarifa estándar configurada en el catálogo educativo
                  </span>
                </div>
                <div>
                  <label className="block font-bold text-indigo-700 mb-1 text-xs">
                    Precio Acordado Final de Venta ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="790.00"
                    value={precioAcordado}
                    onChange={(e) => setPrecioAcordado(e.target.value)}
                    className="w-full bg-white border border-indigo-300 rounded-lg px-3 py-2 text-slate-900 font-extrabold text-base font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Monto total acordado con descuento o beca aplicada.
                  </span>
                </div>
              </div>

              {/* SECCIÓN CONDICIONAL: ¿REQUIERE FINANCIAMIENTO / PLAZOS DE PAGO? */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={saleRequiresFinancing}
                      onChange={(e) => setSaleRequiresFinancing(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        ¿Requiere financiamiento / Pago diferido en cuotas?
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Habilitar para acordar meses a diferir, día de corte mensual y cronograma de cuotas
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    saleRequiresFinancing
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    {saleRequiresFinancing ? 'Financiamiento Activo' : 'Pago de Contado / Directo'}
                  </span>
                </label>

                {/* Si está marcado el check, se habilita el apartado de plazos y cronograma */}
                {saleRequiresFinancing && (
                  <div className="p-4 border-t border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-indigo-50/60 space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-700" />
                      <h3 className="font-bold text-indigo-950 text-xs uppercase tracking-wide">
                        Configuración de Cuotas, Meses a Diferir y Corte Mensual
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Selector de Meses a Diferir */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-xs">
                          ¿A cuántos meses se difiere el pago? (Plazo de cuotas) *
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { meses: 1, label: '1 mes' },
                            { meses: 3, label: '3 meses' },
                            { meses: 6, label: '6 meses' },
                            { meses: 9, label: '9 meses' },
                            { meses: 12, label: '12 meses' },
                          ].map((p) => {
                            const isSelected = salePlazoMeses === p.meses;
                            return (
                              <button
                                key={p.meses}
                                type="button"
                                onClick={() => setSalePlazoMeses(p.meses)}
                                className={`py-2 px-1 rounded-xl text-center font-bold text-xs border transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className="block text-sm">{p.meses}</span>
                                <span className="text-[9px] font-normal block leading-tight">Meses</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selector de Día de Corte de Cada Mes */}
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-xs">
                          ¿Qué día de cada mes se genera el corte / fecha límite? *
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                          {[5, 10, 15, 20, 25, 30].map((dia) => {
                            const isSelected = saleDiaCorte === dia;
                            return (
                              <button
                                key={dia}
                                type="button"
                                onClick={() => setSaleDiaCorte(dia)}
                                className={`py-2 px-1 rounded-xl text-center font-bold text-xs border transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className="block text-sm">Día {dia}</span>
                                <span className="text-[9px] font-normal block text-slate-400 leading-tight">de corte</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Vista previa proyectada de cuotas */}
                    {(() => {
                      const acordadoNum = parseFloat(precioAcordado) || 0;
                      const meses = Math.max(1, salePlazoMeses || 1);
                      const cuotaValor = parseFloat((acordadoNum / meses).toFixed(2));
                      const baseDate = new Date();

                      return (
                        <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              Cronograma Proyectado de Cuotas ({meses} cuota{meses > 1 ? 's' : ''} de ~${cuotaValor.toFixed(2)})
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Corte mensual: <strong>Día {saleDiaCorte}</strong> de cada mes
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                            {Array.from({ length: meses }).map((_, idx) => {
                              const num = idx + 1;
                              const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + num, saleDiaCorte);
                              const formattedDate = dueDate.toISOString().slice(0, 10);
                              const isLast = num === meses;
                              const installmentAmount = isLast ? (acordadoNum - cuotaValor * (meses - 1)) : cuotaValor;

                              return (
                                <div key={num} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                  <span className="text-[10px] font-bold text-indigo-700 block">Cuota #{num}</span>
                                  <span className="font-extrabold text-slate-900 font-mono text-xs block">
                                    ${installmentAmount > 0 ? installmentAmount.toFixed(2) : '0.00'}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block font-mono">{formattedDate}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Selector de Tipo de Pago para la Venta */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Tipo / Método de Pago Acordado *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSalePaymentMethod('transferencia');
                      setSaleBankOrEntity('Banco Pichincha');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      salePaymentMethod === 'transferencia'
                        ? 'bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    <span>Transferencia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSalePaymentMethod('efectivo');
                      setSaleBankOrEntity('Caja Principal (Campus Matriz)');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      salePaymentMethod === 'efectivo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Efectivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSalePaymentMethod('tarjeta');
                      setSaleBankOrEntity('Visa (Datafast)');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      salePaymentMethod === 'tarjeta'
                        ? 'bg-purple-50 text-purple-700 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSalePaymentMethod('deposito');
                      setSaleBankOrEntity('Banco Pichincha');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      salePaymentMethod === 'deposito'
                        ? 'bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-amber-600" />
                    <span>Depósito</span>
                  </button>
                </div>
              </div>

              {/* Entidad / Caja / Red y Checkbox de Abono Inicial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                    {salePaymentMethod === 'efectivo'
                      ? 'Punto de Cobro / Caja'
                      : salePaymentMethod === 'tarjeta'
                      ? 'Red / Terminal de Cobro'
                      : 'Banco / Entidad Financiera'}
                  </label>
                  <CustomSelect
                    options={
                      salePaymentMethod === 'efectivo'
                        ? [
                            { value: 'Caja Principal (Campus Matriz)', label: 'Caja Principal (Campus Matriz)' },
                            { value: 'Caja Ventanilla 1', label: 'Caja Ventanilla 1' },
                            { value: 'Caja Campus Norte', label: 'Caja Campus Norte' },
                            { value: 'Caja Campus Sur', label: 'Caja Campus Sur' },
                          ]
                        : salePaymentMethod === 'tarjeta'
                        ? [
                            { value: 'Visa (Datafast)', label: 'Visa (Datafast)' },
                            { value: 'Mastercard (Datafast)', label: 'Mastercard (Datafast)' },
                            { value: 'Visa (Medianet)', label: 'Visa (Medianet)' },
                            { value: 'Mastercard (Medianet)', label: 'Mastercard (Medianet)' },
                            { value: 'Diners Club', label: 'Diners Club' },
                            { value: 'Tarjeta Débito (Datafast)', label: 'Tarjeta Débito (Datafast)' },
                          ]
                        : [
                            { value: 'Banco Pichincha', label: 'Banco Pichincha' },
                            { value: 'Banco Guayaquil', label: 'Banco Guayaquil' },
                            { value: 'Produbanco', label: 'Produbanco' },
                            { value: 'Banco del Pacífico', label: 'Banco del Pacífico' },
                            { value: 'Banco Internacional', label: 'Banco Internacional' },
                            { value: 'Cooperativa JEP', label: 'Cooperativa JEP' },
                          ]
                    }
                    value={saleBankOrEntity}
                    onChange={setSaleBankOrEntity}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={saleRegisterInitialPayment}
                      onChange={(e) => {
                        setSaleRegisterInitialPayment(e.target.checked);
                        if (e.target.checked && !saleInitialPayAmount) {
                          const acordadoNum = parseFloat(precioAcordado) || 0;
                          const meses = Math.max(1, salePlazoMeses || 1);
                          const suggested = (acordadoNum / meses).toFixed(2);
                          setSaleInitialPayAmount(suggested !== '0.00' ? suggested : '150');
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>¿Registrar abono o cuota inicial ahora mismo?</span>
                  </label>
                </div>
              </div>

              {saleRegisterInitialPayment && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Datos del Abono / Primera Cuota Inmediata</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                        Monto del Abono Inicial ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ej: 150.00"
                        value={saleInitialPayAmount}
                        onChange={(e) => setSaleInitialPayAmount(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-2 text-slate-900 font-bold font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-emerald-900 mb-1 text-[11px]">
                        {salePaymentMethod === 'efectivo'
                          ? 'N° Recibo de Caja'
                          : salePaymentMethod === 'tarjeta'
                          ? 'N° Voucher / Autorización'
                          : 'N° Transacción / Comprobante'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          salePaymentMethod === 'efectivo'
                            ? 'Ej: REC-00421'
                            : salePaymentMethod === 'tarjeta'
                            ? 'Ej: AUTH-882190'
                            : 'Ej: TX-984120'
                        }
                        value={saleInitialTxNumber}
                        onChange={(e) => setSaleInitialTxNumber(e.target.value)}
                        className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-2 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-semibold text-emerald-900 text-[11px]">
                      Comprobante de pago (imagen o PDF)
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label
                        className={`cursor-pointer px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                          isSaleOcrScanning ? 'opacity-60 pointer-events-none' : ''
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{saleVoucherFileName ? 'Cambiar comprobante' : 'Subir comprobante'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          disabled={isSaleOcrScanning}
                          onChange={handleSaleVoucherUpload}
                        />
                      </label>
                      {isSaleOcrScanning && (
                        <span className="text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Leyendo comprobante...
                        </span>
                      )}
                    </div>

                    {saleVoucherFileName && !isSaleOcrScanning && (
                      <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-medium">{saleVoucherFileName}</span>
                          {saleVoucherOcr && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
                              Confianza {saleVoucherOcr.confianza}%
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSaleVoucherFileName(null);
                            setSaleVoucherOcr(null);
                          }}
                          className="text-slate-400 hover:text-red-500 text-xs ml-2 px-1"
                          title="Quitar archivo"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observaciones / Motivo de Tarifa o Beca
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Beca aprobada por dirección académica, descuento por pronto pago, pago diferido a corte mensual..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  La venta creará la cuenta por cobrar y el cronograma de cuotas correspondientes.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                  >
                    Guardar Nueva Venta
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREAR CLIENTE RAPIDO DESDE NUEVA VENTA --- */}
      {isQuickClientOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Registrar Nuevo Cliente</h2>
              <button
                type="button"
                onClick={() => setIsQuickClientOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickClientSubmit} className="p-5 space-y-3.5 text-xs">
              {quickClientError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{quickClientError}</span>
                </div>
              )}
              {([
                ['cedula', 'Cédula / Identificación *', 'Ej: 1712345678'],
                ['nombres', 'Nombres *', 'Ej: María José'],
                ['apellidos', 'Apellidos *', 'Ej: Pérez Andrade'],
                ['telefono', 'Teléfono', 'Ej: +593 99 123 4567'],
                ['correo', 'Correo electrónico', 'Ej: alumno@correo.com'],
              ] as const).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="block font-semibold text-slate-700 mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={quickClient[key]}
                    onChange={(e) => setQuickClient({ ...quickClient, [key]: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickClientOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  Registrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: REGISTRO DE PAGO INTEGRADO EN DEUDAS Y ADQUISICIONES --- */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Registrar Pago de Deuda (Módulo de Cobranzas)
                  </h2>
                  <p className="text-[11px] text-indigo-100">
                    Registre el abono o cancelación total del alumno con conciliación bancaria inmediata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Horizontal 2-Column Layout */}
            <form onSubmit={handleRegisterPaymentSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {paySuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{paySuccessMsg}</span>
                </div>
              )}

              {payError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{payError}</span>
                </div>
              )}

              {/* Panel Contenedor Unificado con 2 Columnas Estructuradas */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  
                  {/* COLUMNA IZQUIERDA: Contexto de Cuenta por Cobrar y Asistente OCR */}
                  <div className="space-y-4">
                    {/* Selector o Ficha del Alumno y Deuda */}
                    {!debtToPay ? (
                      <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div>
                          <label className="block font-bold text-slate-800 mb-1 text-xs">
                            1. Buscar y Seleccionar Alumno *
                          </label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Buscar alumno por nombre o cédula..."
                              value={payModalClientSearch}
                              onChange={(e) => setPayModalClientSearch(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                            />
                          </div>

                          <div className="mt-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                            {payModalClientCandidates.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setPayModalClientId(c.id);
                                  setPayModalClientSearch(`${c.nombres} ${c.apellidos}`);
                                  const clientDebts = debts.filter(
                                    (d) => d.clienteId === c.id && d.estado !== 'anulada'
                                  );
                                  setPayModalDebtId(clientDebts[0]?.id || '');
                                  const fin = clientDebts[0] ? getDebtFinancials(clientDebts[0].id) : null;
                                  if (fin) setPayAmount(fin.saldoPendiente.toFixed(2));
                                }}
                                className={`p-2 px-3 cursor-pointer flex justify-between text-xs transition-colors ${
                                  payModalClientId === c.id
                                    ? 'bg-indigo-50 font-bold text-indigo-900'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <span>{c.nombres} {c.apellidos}</span>
                                <span className="font-mono text-[10px] text-slate-400">{c.cedula}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-800 mb-1 text-xs">
                            2. Deuda / Adquisición con Saldo Pendiente *
                          </label>
                          {debtsForSelectedPayClient.length === 0 ? (
                            <div className="p-2.5 text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl text-center">
                              El alumno no registra deudas con saldo pendiente
                            </div>
                          ) : (
                            <CustomSelect
                              options={debtsForSelectedPayClient.map((d) => {
                                const pr = products.find((p) => p.id === d.productoId);
                                const fin = getDebtFinancials(d.id);
                                return {
                                  value: d.id,
                                  label: `${pr?.nombre || d.productoId} (Saldo: $${fin?.saldoPendiente.toFixed(2) || '0.00'})`,
                                  badge: d.estado,
                                };
                              })}
                              value={payModalDebtId}
                              onChange={(val) => {
                                setPayModalDebtId(val);
                                const fin = getDebtFinancials(val);
                                if (fin) setPayAmount(fin.saldoPendiente.toFixed(2));
                              }}
                              className="w-full"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Ficha informativa cuando se pulsó 'Pagar' directamente en una fila */
                      (() => {
                        const fin = getDebtFinancials(debtToPay.id);
                        const cl = clients.find((c) => c.id === debtToPay.clienteId);
                        const pr = products.find((p) => p.id === debtToPay.productoId);
                        return (
                          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                  Cuenta por Cobrar
                                </span>
                                <h3 className="font-bold text-slate-900 text-sm">
                                  {cl ? `${cl.nombres} ${cl.apellidos}` : debtToPay.clienteId}
                                </h3>
                                <span className="font-mono text-indigo-700 text-xs">C.I: {cl?.cedula}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                ID: {debtToPay.id}
                              </span>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                              <div className="flex justify-between text-slate-600">
                                <span>Programa Adquirido:</span>
                                <strong className="text-slate-900 truncate max-w-[200px]">{pr?.nombre || debtToPay.productoId}</strong>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Precio Acordado Total:</span>
                                <span className="font-mono font-bold text-slate-900">${debtToPay.precioAcordado.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                                <span className="text-emerald-700 font-semibold">Total Ya Abonado:</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  ${fin?.validPaymentsTotal.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                                <span className="text-amber-800 font-bold">Saldo Pendiente Actual:</span>
                                <span className="font-mono font-black text-sm text-amber-700">
                                  ${fin?.saldoPendiente.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            </div>

                            {debtToPay.diaCorte && (
                              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                                <span>Día de Corte Mensual: <strong>Día {debtToPay.diaCorte}</strong></span>
                                <span>Plazo: <strong>{debtToPay.plazoMeses ? `${debtToPay.plazoMeses} meses` : 'Directo'}</strong></span>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}

                    {/* Asistente OCR Inteligente con Carga de Váucher */}
                    <div className="p-4 bg-white border border-indigo-200 rounded-xl shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs text-indigo-950 font-bold">
                            {isPayOcrScanning ? 'Escaneando comprobante...' : 'Asistente OCR de Comprobantes'}
                          </span>
                        </div>
                        <label
                          className={`cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-2xs inline-flex items-center gap-1.5 ${
                            isPayOcrScanning ? 'opacity-60 pointer-events-none' : ''
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{payUploadedFileName ? 'Cambiar Váucher' : 'Subir Váucher'}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            disabled={isPayOcrScanning}
                            onChange={handleOcrFileUpload}
                          />
                        </label>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Sube una imagen o PDF del váucher de pago para autocompletar el monto, banco y código de transacción.
                      </p>

                      {/* Estado del archivo cargado */}
                      {payUploadedFileName && (
                        <div className="flex items-center justify-between p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-slate-700">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="truncate font-medium">{payUploadedFileName}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">Cargado</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPayUploadedFileName(null);
                              setPayOcrExtracted(null);
                            }}
                            className="text-slate-400 hover:text-red-500 text-xs ml-2 p-1 rounded-md transition-colors inline-flex items-center"
                            title="Quitar archivo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {isPayOcrScanning && (
                        <div className="p-2.5 bg-indigo-50 border border-indigo-300 rounded-lg text-xs text-indigo-900 flex items-center gap-2 animate-pulse font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>Leyendo y reconociendo datos del comprobante...</span>
                        </div>
                      )}

                      {payOcrExtracted && !isPayOcrScanning && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between font-medium">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Confianza {payOcrExtracted.confianza}% ({payOcrExtracted.banco})</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-900">${payOcrExtracted.monto?.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: Datos del Pago, Método y Parámetros Bancarios */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4">
                    <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <span>Detalles Económicos y Financieros</span>
                    </div>

                    {/* Fila 1: Monto y Fecha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-indigo-900 mb-1 text-xs">
                          Monto a Pagar ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-indigo-300 rounded-xl px-3 py-2 text-slate-900 font-extrabold text-base font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-xs">
                          Fecha Efectiva de Pago *
                        </label>
                        <input
                          type="date"
                          required
                          value={payDate}
                          onChange={(e) => setPayDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Fila 2: Selector Horizontal de Método de Pago */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Método / Forma de Pago *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePayMethodChange('transferencia')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                            payMethod === 'transferencia'
                              ? 'bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                          <span>Transferencia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePayMethodChange('efectivo')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                            payMethod === 'efectivo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <span>Efectivo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePayMethodChange('tarjeta')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                            payMethod === 'tarjeta'
                              ? 'bg-purple-50 text-purple-700 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-purple-600" />
                          <span>Tarjeta</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePayMethodChange('deposito')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                            payMethod === 'deposito'
                              ? 'bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <Landmark className="w-4 h-4 text-amber-600" />
                          <span>Depósito</span>
                        </button>
                      </div>
                    </div>

                    {/* Fila 3: Entidad Bancaria / Punto de Cobro y N° Transacción */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-xs">
                          {payMethod === 'efectivo'
                            ? 'Caja / Punto de Cobro'
                            : payMethod === 'tarjeta'
                            ? 'Red / Terminal'
                            : 'Banco Origen / Entidad'}
                        </label>
                        <CustomSelect
                          options={
                            payMethod === 'efectivo'
                              ? [
                                  { value: 'Caja Principal (Campus Matriz)', label: 'Caja Principal (Campus Matriz)' },
                                  { value: 'Caja Ventanilla 1', label: 'Caja Ventanilla 1' },
                                  { value: 'Caja Campus Norte', label: 'Caja Campus Norte' },
                                  { value: 'Caja Campus Sur', label: 'Caja Campus Sur' },
                                ]
                              : payMethod === 'tarjeta'
                              ? [
                                  { value: 'Visa (Datafast)', label: 'Visa (Datafast)' },
                                  { value: 'Mastercard (Datafast)', label: 'Mastercard (Datafast)' },
                                  { value: 'Visa (Medianet)', label: 'Visa (Medianet)' },
                                  { value: 'Mastercard (Medianet)', label: 'Mastercard (Medianet)' },
                                  { value: 'Diners Club', label: 'Diners Club' },
                                  { value: 'American Express', label: 'American Express' },
                                  { value: 'Tarjeta Débito (Datafast)', label: 'Tarjeta Débito (Datafast)' },
                                ]
                              : [
                                  { value: 'Banco Pichincha', label: 'Banco Pichincha' },
                                  { value: 'Banco Guayaquil', label: 'Banco Guayaquil' },
                                  { value: 'Banco del Pacífico', label: 'Banco del Pacífico' },
                                  { value: 'Produbanco', label: 'Produbanco' },
                                  { value: 'Banco Internacional', label: 'Banco Internacional' },
                                  { value: 'Cooperativa JEP', label: 'Cooperativa JEP' },
                                ]
                          }
                          value={payBank}
                          onChange={setPayBank}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-xs">
                          {payMethod === 'efectivo'
                            ? 'N° Recibo de Caja'
                            : payMethod === 'tarjeta'
                            ? 'N° Autorización / Lote'
                            : payMethod === 'deposito'
                            ? 'N° Papeleta de Depósito'
                            : 'N° Transacción / Comprobante'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            payMethod === 'efectivo'
                              ? 'Ej: REC-00421'
                              : payMethod === 'tarjeta'
                              ? 'Ej: AUTH-882190'
                              : payMethod === 'deposito'
                              ? 'Ej: DEP-451208'
                              : 'Ej: TX-984120'
                          }
                          value={payTxNumber}
                          onChange={(e) => setPayTxNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Fila 4: Referencia Adicional */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Referencia o Glosa Bancaria
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Matrícula cuota 1 / Depósito referencia..."
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Fila Inferior Completa: Observaciones / Justificación Contable */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Observaciones / Justificación Contable <span className="font-normal text-slate-400">(Opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Pago realizado por ventanilla, comprobante validado y cotejado con estado de cuenta..."
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  El pago ingresará automáticamente a la bitácora de auditoría y conciliación.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Confirmar y Registrar Pago</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: HISTORIAL DE PAGOS DE LA DEUDA --- */}
      {isHistoryModalOpen && debtForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Historial de Pagos y Trazabilidad de la Deuda
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID Deuda: {debtForHistory.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {(() => {
                const fin = getDebtFinancials(debtForHistory.id);
                const cl = clients.find((c) => c.id === debtForHistory.clienteId);
                const pr = products.find((p) => p.id === debtForHistory.productoId);
                const isPaid = (fin?.saldoPendiente || 0) <= 0.001;
                const delay = getDebtDelayInfo(debtForHistory);

                return (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Alumno</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {cl ? `${cl.nombres} ${cl.apellidos}` : debtForHistory.clienteId}
                        </span>
                        <span className="text-slate-500 block text-[11px] font-mono">C.I: {cl?.cedula}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Programa</span>
                        <span className="font-semibold text-slate-800">{pr?.nombre || debtForHistory.productoId}</span>
                        <span className="text-slate-500 block text-[11px]">Acordado: ${debtForHistory.precioAcordado.toFixed(2)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Saldo Actual</span>
                        {isPaid ? (
                          <span className="font-bold text-emerald-700 text-sm flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Pagado ($0.00)
                          </span>
                        ) : (
                          <span className={`text-sm font-bold ${delay.isOverdue ? 'text-rose-700 font-extrabold' : 'text-amber-700'}`}>
                            ${fin?.saldoPendiente.toFixed(2)}
                          </span>
                        )}
                        <span className="text-emerald-700 font-semibold block text-[11px]">
                          Abonado: ${fin?.validPaymentsTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Términos de Pago & Retrasos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                        <span className="text-indigo-900 font-bold block">Plazo Diferido</span>
                        <span className="text-slate-700 font-medium">
                          {debtForHistory.plazoMeses ? `${debtForHistory.plazoMeses} Meses diferidos` : 'No especificado (Directo)'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                        <span className="text-indigo-900 font-bold block">Día de Corte Mensual</span>
                        <span className="text-slate-700 font-medium">
                          {debtForHistory.diaCorte ? `Día ${debtForHistory.diaCorte} de cada mes` : 'Fecha de vencimiento estándar'}
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${
                        delay.isOverdue && !isPaid
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}>
                        <span className="font-bold block">Estado de Cobranza</span>
                        <span className="font-semibold flex items-center gap-1">
                          {delay.isOverdue && !isPaid ? (
                            <>
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                              {delay.daysDelayed} días en retraso
                            </>
                          ) : isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Al día (Totalmente pagada)
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              Al corriente / Dentro del plazo
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Desglose de Cuotas si existen */}
                    {debtForHistory.cuotas && debtForHistory.cuotas.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-[11px] flex justify-between items-center">
                          <span>Cronograma de Cuotas Acordadas</span>
                          <span className="text-slate-400 font-normal">Corte: Día {debtForHistory.diaCorte}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2.5 bg-white">
                          {debtForHistory.cuotas.map((c) => {
                            const isVencida = c.fechaVencimiento < todayStr && !isPaid;
                            return (
                              <div
                                key={c.numero}
                                className={`p-2 rounded-lg border text-center ${
                                  isPaid
                                    ? 'bg-emerald-50/50 border-emerald-200'
                                    : isVencida
                                    ? 'bg-rose-50 border-rose-300'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="text-[10px] font-bold text-slate-700">Cuota #{c.numero}</div>
                                <div className="font-mono font-extrabold text-xs text-slate-900">
                                  ${c.monto.toFixed(2)}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500">{c.fechaVencimiento}</div>
                                <div className="mt-1">
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isVencida
                                      ? 'bg-rose-200 text-rose-900'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {isPaid ? 'Cubierta' : isVencida ? 'Vencida' : 'Pendiente'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Listado Cronológico de Pagos Registrados</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Reflejados automáticamente en la bitácora de auditoría
                  </span>
                </h3>

                {(() => {
                  const debtPayments = payments.filter((p) => p.deudaId === debtForHistory.id);

                  if (debtPayments.length === 0) {
                    return (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
                        <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No hay pagos registrados aún para esta deuda</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Puedes registrar el primer pago con el botón directo de pago.
                        </p>
                        {canPay && (
                          <button
                            onClick={() => {
                              setIsHistoryModalOpen(false);
                              handleOpenPayModal(debtForHistory);
                            }}
                            className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Registrar Primer Pago</span>
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                          <tr>
                            <th className="p-2.5">Fecha</th>
                            <th className="p-2.5">Monto</th>
                            <th className="p-2.5">Método / Banco</th>
                            <th className="p-2.5">N° Transacción</th>
                            <th className="p-2.5">Estado Registro</th>
                            <th className="p-2.5">Conciliación</th>
                            <th className="p-2.5 text-right">Comprobante</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {debtPayments.map((p) => {
                            const isAnulado = p.estadoRegistro === 'anulado';
                            return (
                              <tr key={p.id} className={isAnulado ? 'bg-rose-50/50 text-slate-400' : 'hover:bg-slate-50'}>
                                <td className="p-2.5 font-medium whitespace-nowrap">{p.fechaPago}</td>
                                <td className={`p-2.5 font-bold font-mono whitespace-nowrap ${isAnulado ? 'line-through text-slate-400' : 'text-emerald-700'}`}>
                                  ${p.monto.toFixed(2)}
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    {p.metodo === 'transferencia' && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                        <ArrowLeftRight className="w-3 h-3" />
                                        Transferencia
                                      </span>
                                    )}
                                    {p.metodo === 'efectivo' && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <Banknote className="w-3 h-3" />
                                        Efectivo
                                      </span>
                                    )}
                                    {p.metodo === 'tarjeta' && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                        <CreditCard className="w-3 h-3" />
                                        Tarjeta
                                      </span>
                                    )}
                                    {p.metodo === 'deposito' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                        <Landmark className="w-3 h-3" />
                                        Depósito
                                      </span>
                                    )}
                                    {p.metodo !== 'transferencia' && p.metodo !== 'efectivo' && p.metodo !== 'tarjeta' && p.metodo !== 'deposito' && (
                                      <span className="capitalize text-slate-700 text-[11px] font-medium">{p.metodo}</span>
                                    )}
                                  </div>
                                  {p.bancoOrigen && <span className="text-[10px] text-slate-400 block mt-0.5">{p.bancoOrigen}</span>}
                                </td>
                                <td className="p-2.5 font-mono text-slate-600 whitespace-nowrap">
                                  {p.numeroTransaccion || 'S/N'}
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      isAnulado
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {isAnulado ? 'Anulado' : 'Registrado'}
                                  </span>
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                      p.estadoConciliacion.includes('conciliado')
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    {p.estadoConciliacion.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right whitespace-nowrap">
                                  {onViewVoucher && (
                                    <button
                                      onClick={() => onViewVoucher(p)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                                      title="Ver comprobante adjunto"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {(() => {
                const fin = getDebtFinancials(debtForHistory.id);
                const isPaid = (fin?.saldoPendiente || 0) <= 0.001;
                return (
                  <div>
                    {isPaid ? (
                      <button
                        onClick={() => {
                          setIsHistoryModalOpen(false);
                          setDebtForInvoice(debtForHistory);
                          setIsInvoiceModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Factura Oficial</span>
                      </button>
                    ) : (
                      canPay && (
                        <button
                          onClick={() => {
                            setIsHistoryModalOpen(false);
                            handleOpenPayModal(debtForHistory);
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Registrar Nuevo Pago</span>
                        </button>
                      )
                    )}
                  </div>
                );
              })()}

              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: FACTURA DOCUMENTAL DE ADQUISICIONES PAGADAS --- */}
      {isInvoiceModalOpen && debtForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Factura Documental de Adquisición Pagada
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Comprobante de cancelación de deuda educativa
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50/40">
              {(() => {
                const fin = getDebtFinancials(debtForInvoice.id);
                const cl = clients.find((c) => c.id === debtForInvoice.clienteId);
                const pr = products.find((p) => p.id === debtForInvoice.productoId);
                const debtPayments = payments.filter(
                  (p) => p.deudaId === debtForInvoice.id && p.estadoRegistro !== 'anulado'
                );
                const invoiceNumber = `FAC-2026-${debtForInvoice.id.replace('deb-', '')}`;

                return (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    {/* Encabezado Institucional */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-6 h-6 text-indigo-600" />
                          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                            INSTITUTO DE CAPACITACIÓN & COBRANZAS
                          </h1>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          R.U.C.: 1792458901001 • Resolución Ministerial N° 458-2024
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Av. Amazonas N24-196 y Luis Cordero • Quito, Ecuador
                        </p>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Documento Contable
                        </span>
                        <span className="text-sm font-extrabold font-mono text-indigo-700 block">
                          {invoiceNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Fecha: {debtForInvoice.fechaAdquisicion}
                        </span>
                        <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> CANCELADA (PAGADA)
                        </div>
                      </div>
                    </div>

                    {/* Datos del Cliente / Alumno */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                          Adquiriente / Alumno:
                        </span>
                        <span className="font-bold text-slate-900 text-sm block">
                          {cl ? `${cl.nombres} ${cl.apellidos}` : debtForInvoice.clienteId}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          Cédula / Identificación: {cl?.cedula || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                          Contacto:
                        </span>
                        <span className="text-slate-700 text-xs block">
                          Correo: {cl?.correo || 'correo@demo.edu.ec'}
                        </span>
                        <span className="text-slate-700 text-xs block">
                          Teléfono: {cl?.telefono || '+593 99 876 5432'}
                        </span>
                      </div>
                    </div>

                    {/* Detalle de Productos Adquiridos */}
                    <div>
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5 text-left">Descripción del Programa</th>
                            <th className="p-2.5 text-right">Precio Nominal</th>
                            <th className="p-2.5 text-right">Beca / Ajuste</th>
                            <th className="p-2.5 text-right">Precio Acordado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2.5 font-medium text-slate-800">
                              {pr?.nombre || debtForInvoice.productoId}
                              <span className="block text-[10px] text-slate-400">
                                {pr?.descripcion || 'Programa de formación técnica'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right tabular-nums text-slate-400 line-through">
                              ${debtForInvoice.precioNominalAplicado.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right tabular-nums text-indigo-600 font-semibold">
                              -${(debtForInvoice.precioNominalAplicado - debtForInvoice.precioAcordado).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right tabular-nums font-bold text-slate-900">
                              ${debtForInvoice.precioAcordado.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 font-bold bg-slate-50/50">
                          <tr>
                            <td colSpan={3} className="p-2.5 text-right text-slate-600">
                              Subtotal Acordado:
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-900">
                              ${debtForInvoice.precioAcordado.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="p-2.5 text-right text-slate-600">
                              IVA Educación (0%):
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-500">
                              $0.00
                            </td>
                          </tr>
                          <tr className="border-t border-slate-200 text-sm">
                            <td colSpan={3} className="p-2.5 text-right font-extrabold text-slate-900">
                              TOTAL FACTURA CANCELADA:
                            </td>
                            <td className="p-2.5 text-right font-extrabold font-mono text-emerald-700">
                              ${debtForInvoice.precioAcordado.toFixed(2)} USD
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="p-2.5 text-right text-slate-600">
                              Saldo Restante:
                            </td>
                            <td className="p-2.5 text-right font-extrabold font-mono text-emerald-700">
                              $0.00
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Resumen de Amortización / Pagos Vinculados */}
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                      <span className="font-bold text-emerald-900 block mb-1">
                        Amortización de Pagos Recibidos:
                      </span>
                      <div className="space-y-1 text-[11px] text-emerald-800">
                        {debtPayments.map((p, idx) => (
                          <div key={p.id} className="flex justify-between border-b border-emerald-100/60 pb-0.5 last:border-none">
                            <span>
                              Pago #{idx + 1} ({p.fechaPago}) - {p.metodo} ({p.bancoOrigen || 'Banco'}) Transacción: {p.numeroTransaccion || 'S/N'}
                            </span>
                            <span className="font-mono font-bold">${p.monto.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('La factura ha sido descargada en formato PDF como comprobante oficial.');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Factura</span>
                </button>
              </div>

              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CANCELAR PAGO (DESDE EL HISTORIAL) --- */}
      {paymentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-600 text-white">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5" />
                <h2 className="text-sm font-bold">Anulación de Pago Registrado</h2>
              </div>
              <button
                onClick={() => setPaymentToCancel(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelPaymentSubmit} className="p-5 space-y-3.5 text-xs">
              {cancelError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Pago ID: {paymentToCancel.id}</span>
                  <span className="font-mono text-rose-700 font-bold">${paymentToCancel.monto.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Transacción: {paymentToCancel.numeroTransaccion || 'S/N'} • Fecha: {paymentToCancel.fechaPago}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo detallado de anulación <span className="text-rose-500">* (Obligatorio para auditoría)</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej: Depósito duplicado por error operativo, comprobante no corresponde a la cuenta..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentToCancel(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: MASS EXCEL IMPORT (FLUJO A) --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Flujo A: Carga Inicial de Deudas desde Excel de Alumnos
                </h2>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <label className="font-semibold text-slate-700">
                  1. Elegir programa destino para la carga:
                </label>
                <CustomSelect
                  options={products.map((p) => ({
                    value: p.id,
                    label: p.nombre,
                    badge: `$${p.precioNominal}`,
                  }))}
                  value={importProductId}
                  onChange={setImportProductId}
                  className="w-64"
                />
              </div>

              {!importSampleLoaded ? (
                <div className="text-center py-8 space-y-3 border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Subir archivo Excel o cargar muestra de aspirantes
                    </h3>
                    <p className="text-slate-500 mt-1 max-w-md mx-auto">
                      Permite importar alumnos nuevos y existentes, indicando precio nominal y precio acordado con corrección previa antes de confirmar.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadImportSample}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Cargar Archivo de Muestra: Alumnos_Móviles_1.xlsx
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      2. Vista previa y corrección de errores antes de confirmar:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Detectados <strong>{importPreviewList.length}</strong> registros
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Cédula</th>
                          <th className="p-2.5">Alumno</th>
                          <th className="p-2.5">P. Nominal</th>
                          <th className="p-2.5">P. Acordado (Editable)</th>
                          <th className="p-2.5">Diagnóstico / Validación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreviewList.map((item, idx) => (
                          <tr
                            key={idx}
                            className={item.hasError ? 'bg-rose-50/70 text-rose-900' : 'hover:bg-slate-50'}
                          >
                            <td className="p-2.5 font-mono">{item.cedula}</td>
                            <td className="p-2.5 font-semibold">
                              {item.nombres} {item.apellidos}
                              {item.isExistingClient && (
                                <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded ml-1 font-normal">
                                  Existente
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-500 tabular-nums">
                              ${item.precioNominal.toFixed(2)}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.01"
                                value={item.precioAcordado}
                                onChange={(e) => handleFixPreviewItem(idx, parseFloat(e.target.value) || 0)}
                                className={`w-24 px-2 py-1 rounded border font-mono font-bold ${
                                  item.hasError
                                    ? 'border-rose-400 bg-white text-rose-700'
                                    : 'border-slate-300 bg-white text-slate-900'
                                }`}
                              />
                            </td>
                            <td className="p-2.5">
                              {item.hasError ? (
                                <span className="text-rose-600 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> {item.errorMsg}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Válido para crear deuda
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Puedes editar directamente el precio acordado en la tabla de vista previa.
                    Al confirmar, se generarán las deudas y el evento quedará registrado en la Auditoría.
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
                  onClick={handleConfirmBulkImport}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors"
                >
                  Confirmar e Importar ({importPreviewList.length} Deudas)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
