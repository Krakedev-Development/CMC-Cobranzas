import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  FileSpreadsheet,
  Calendar,
  Users,
  CreditCard,
  Scale,
  Receipt,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    clients,
    products,
    debts,
    payments,
    bankMovements,
    invoices,
    getDebtFinancials,
    getClientFinancials,
    exportToCSV,
    hasPermission,
  } = useApp();

  type ReportType =
    | 'cartera'
    | 'pagos'
    | 'conciliacion'
    | 'sin_coincidencia'
    | 'diferencias'
    | 'facturas'
    | 'trazabilidad';

  const [activeReport, setActiveReport] = useState<ReportType>('cartera');

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');

  const canExport = hasPermission('reportes', 'exportar');

  // Compute reports datasets
  // 1. Cartera por cliente y producto
  const carteraRows = useMemo(() => {
    return debts
      .filter((d) => d.estado !== 'anulada')
      .map((debt) => {
        const client = clients.find((c) => c.id === debt.clienteId);
        const product = products.find((p) => p.id === debt.productoId);
        const fin = getDebtFinancials(debt.id);

        return {
          id: debt.id,
          cliente: client ? `${client.nombres} ${client.apellidos}` : debt.clienteId,
          cedula: client?.cedula || '',
          telefono: client?.telefono || '',
          producto: product?.nombre || debt.productoId,
          fecha: debt.fechaAdquisicion,
          precioNominal: debt.precioNominalAplicado,
          precioAcordado: debt.precioAcordado,
          pagado: fin?.validPaymentsTotal || 0,
          saldo: fin?.saldoPendiente || 0,
          estado: fin?.calculatedStatus || debt.estado,
        };
      })
      .filter((row) => {
        const matchesClient = filterClient === 'all' || row.cliente.toLowerCase().includes(filterClient.toLowerCase());
        return matchesClient;
      });
  }, [debts, clients, products, getDebtFinancials, filterClient]);

  // 2. Historial de Pagos
  const pagosRows = useMemo(() => {
    return payments
      .filter((p) => p.estadoRegistro !== 'anulado')
      .map((p) => {
        const client = clients.find((c) => c.id === p.clienteId);
        const debt = debts.find((d) => d.id === p.deudaId);
        const prod = products.find((pr) => pr.id === debt?.productoId);

        return {
          id: p.id,
          fecha: p.fechaPago,
          cliente: client ? `${client.nombres} ${client.apellidos}` : p.clienteId,
          cedula: client?.cedula || '',
          producto: prod?.nombre || '',
          monto: p.monto,
          metodo: p.metodo,
          banco: p.bancoOrigen || '',
          tx: p.numeroTransaccion || 'Sin TX',
          estadoConciliacion: p.estadoConciliacion,
        };
      })
      .filter((row) => {
        const matchesClient = filterClient === 'all' || row.cliente.toLowerCase().includes(filterClient.toLowerCase());
        const matchesFrom = !filterDateFrom || row.fecha >= filterDateFrom;
        const matchesTo = !filterDateTo || row.fecha <= filterDateTo;
        return matchesClient && matchesFrom && matchesTo;
      });
  }, [payments, clients, debts, products, filterClient, filterDateFrom, filterDateTo]);

  // 3. Pagos con Diferencias
  const diferenciasRows = useMemo(() => {
    return payments
      .filter((p) => p.estadoConciliacion === 'con_diferencias')
      .map((p) => {
        const client = clients.find((c) => c.id === p.clienteId);
        const bm = bankMovements.find((m) => m.pagoRelacionadoId === p.id || m.numeroTransaccion === p.numeroTransaccion);
        return {
          pagoId: p.id,
          fecha: p.fechaPago,
          cliente: client ? `${client.nombres} ${client.apellidos}` : p.clienteId,
          tx: p.numeroTransaccion || '',
          montoPago: p.monto,
          montoBanco: bm?.monto || 0,
          diferencia: p.monto - (bm?.monto || 0),
          banco: p.bancoOrigen || bm?.banco || '',
          observaciones: p.observaciones || 'Diferencia detectada en conciliación',
        };
      });
  }, [payments, clients, bankMovements]);

  // 4. Movimientos Bancarios sin coincidencia
  const sinCoincidenciaRows = useMemo(() => {
    return bankMovements
      .filter((m) => m.estado === 'sin_asignar')
      .map((m) => ({
        id: m.id,
        fecha: m.fecha,
        banco: m.banco,
        tx: m.numeroTransaccion,
        ordenante: m.ordenante,
        referencia: m.referencia,
        monto: m.monto,
      }));
  }, [bankMovements]);

  // 5. Facturas Registradas
  const facturasRows = useMemo(() => {
    return invoices.map((inv) => {
      const client = clients.find((c) => c.id === inv.clienteId);
      return {
        numero: inv.numeroFactura,
        fecha: inv.fechaFactura,
        cliente: client ? `${client.nombres} ${client.apellidos}` : inv.clienteId,
        cedula: client?.cedula || '',
        monto: inv.monto || 0,
        archivo: inv.nombreArchivo || '',
        estado: inv.estadoDocumental,
      };
    });
  }, [invoices, clients]);

  // Handle Real Functional CSV Export
  const handleExportCSV = () => {
    if (!canExport) return;

    if (activeReport === 'cartera') {
      const headers = ['ID Deuda', 'Cliente', 'Cédula', 'Teléfono', 'Programa', 'Fecha', 'P. Nominal', 'P. Acordado', 'Pagado', 'Saldo Pendiente', 'Estado'];
      const rows = carteraRows.map((r) => [
        r.id,
        r.cliente,
        r.cedula,
        r.telefono,
        r.producto,
        r.fecha,
        r.precioNominal,
        r.precioAcordado,
        r.pagado,
        r.saldo,
        r.estado,
      ]);
      exportToCSV('Reporte_Cartera_Por_Cliente', headers, rows);
    } else if (activeReport === 'pagos') {
      const headers = ['ID Pago', 'Fecha', 'Cliente', 'Cédula', 'Programa', 'Monto', 'Método', 'Banco', 'No. Transacción', 'Conciliación'];
      const rows = pagosRows.map((r) => [
        r.id,
        r.fecha,
        r.cliente,
        r.cedula,
        r.producto,
        r.monto,
        r.metodo,
        r.banco,
        r.tx,
        r.estadoConciliacion,
      ]);
      exportToCSV('Reporte_Historial_Pagos', headers, rows);
    } else if (activeReport === 'diferencias') {
      const headers = ['ID Pago', 'Fecha', 'Cliente', 'No. Transacción', 'Monto Pago', 'Monto Banco', 'Diferencia', 'Banco', 'Observaciones'];
      const rows = diferenciasRows.map((r) => [
        r.pagoId,
        r.fecha,
        r.cliente,
        r.tx,
        r.montoPago,
        r.montoBanco,
        r.diferencia,
        r.banco,
        r.observaciones,
      ]);
      exportToCSV('Reporte_Pagos_Con_Diferencias', headers, rows);
    } else if (activeReport === 'sin_coincidencia') {
      const headers = ['ID Movimiento', 'Fecha', 'Banco', 'No. Transacción', 'Ordenante', 'Referencia', 'Monto'];
      const rows = sinCoincidenciaRows.map((r) => [
        r.id,
        r.fecha,
        r.banco,
        r.tx,
        r.ordenante,
        r.referencia,
        r.monto,
      ]);
      exportToCSV('Reporte_Movimientos_Bancarios_Sin_Coincidencia', headers, rows);
    } else if (activeReport === 'facturas') {
      const headers = ['No. Factura', 'Fecha', 'Cliente', 'Cédula', 'Monto', 'Archivo', 'Estado'];
      const rows = facturasRows.map((r) => [
        r.numero,
        r.fecha,
        r.cliente,
        r.cedula,
        r.monto,
        r.archivo,
        r.estado,
      ]);
      exportToCSV('Reporte_Facturas_Registradas', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-medium">
        <button
          onClick={() => setActiveReport('cartera')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeReport === 'cartera'
              ? 'bg-white text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cartera por Cliente ({carteraRows.length})
        </button>
        <button
          onClick={() => setActiveReport('pagos')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeReport === 'pagos'
              ? 'bg-white text-indigo-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Historial de Pagos ({pagosRows.length})
        </button>
        <button
          onClick={() => setActiveReport('diferencias')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeReport === 'diferencias'
              ? 'bg-white text-rose-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pagos con Diferencias ({diferenciasRows.length})
        </button>
        <button
          onClick={() => setActiveReport('sin_coincidencia')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeReport === 'sin_coincidencia'
              ? 'bg-white text-amber-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Movimientos sin Asignar ({sinCoincidenciaRows.length})
        </button>
        <button
          onClick={() => setActiveReport('facturas')}
          className={`px-3.5 py-2 rounded-xl transition-all ${
            activeReport === 'facturas'
              ? 'bg-white text-purple-700 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Facturas Registradas ({facturasRows.length})
        </button>
      </div>

      {/* Filter and Export Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Cliente:</span>
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={filterClient === 'all' ? '' : filterClient}
              onChange={(e) => setFilterClient(e.target.value || 'all')}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Desde:</span>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Hasta:</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Real Export Button */}
        {canExport && (
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Reporte a CSV</span>
          </button>
        )}
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* REPORT 1: CARTERA */}
        {activeReport === 'cartera' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">Alumno</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Programa</th>
                  <th className="py-3 px-4">P. Nominal</th>
                  <th className="py-3 px-4">P. Acordado</th>
                  <th className="py-3 px-4">Total Pagado</th>
                  <th className="py-3 px-4">Saldo Pendiente</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carteraRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{r.cliente}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{r.cedula}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{r.producto}</td>
                    <td className="py-2.5 px-4 text-slate-400 line-through tabular-nums">
                      ${r.precioNominal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 tabular-nums">
                      ${r.precioAcordado.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700 tabular-nums">
                      ${r.pagado.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-bold tabular-nums">
                      {r.saldo > 0 ? (
                        <span className="text-amber-700">${r.saldo.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-700">$0.00</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 2: PAGOS */}
        {activeReport === 'pagos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">ID / Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Programa</th>
                  <th className="py-3 px-4">Monto ($)</th>
                  <th className="py-3 px-4">Método / Banco</th>
                  <th className="py-3 px-4">Transacción</th>
                  <th className="py-3 px-4">Conciliación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagosRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      <span className="font-semibold block">{r.fecha}</span>
                      <span className="font-mono text-[10px] text-slate-400">{r.id}</span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{r.cliente}</td>
                    <td className="py-2.5 px-4 text-slate-600">{r.producto}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700 tabular-nums">
                      ${r.monto.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-slate-700">
                      {r.metodo} ({r.banco || 'S/D'})
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{r.tx}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                        {r.estadoConciliacion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 3: DIFERENCIAS */}
        {activeReport === 'diferencias' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">Fecha / Pago</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">No. Transacción</th>
                  <th className="py-3 px-4">Monto Pago ($)</th>
                  <th className="py-3 px-4">Monto Banco ($)</th>
                  <th className="py-3 px-4">Diferencia</th>
                  <th className="py-3 px-4">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diferenciasRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {r.fecha} ({r.pagoId})
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{r.cliente}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{r.tx}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700 tabular-nums">
                      ${r.montoPago.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-indigo-700 tabular-nums">
                      ${r.montoBanco.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-rose-700 tabular-nums">
                      ${r.diferencia.toFixed(2)} USD
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{r.observaciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 4: MOVIMIENTOS SIN COINCIDENCIA */}
        {activeReport === 'sin_coincidencia' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Banco</th>
                  <th className="py-3 px-4">No. Transacción</th>
                  <th className="py-3 px-4">Ordenante</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Monto ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sinCoincidenciaRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-600">{r.fecha}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{r.banco}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{r.tx}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{r.ordenante}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.referencia}</td>
                    <td className="py-2.5 px-4 font-bold text-indigo-700 tabular-nums">
                      ${r.monto.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 5: FACTURAS */}
        {activeReport === 'facturas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4">No. Factura</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Cédula</th>
                  <th className="py-3 px-4">Monto ($)</th>
                  <th className="py-3 px-4">Archivo</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facturasRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{r.numero}</td>
                    <td className="py-2.5 px-4 text-slate-600">{r.fecha}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{r.cliente}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{r.cedula}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 tabular-nums">
                      ${r.monto.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-indigo-600">{r.archivo || 'Sin archivo'}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
