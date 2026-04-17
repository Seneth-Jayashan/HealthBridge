import React, { useEffect, useMemo, useState } from 'react';
import { 
  CreditCard, 
  FileText, 
  Wallet, 
  Search, 
  Loader2, 
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import { getAllPayments } from '../../services/payment.service';

const statusStyles = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

const Billing = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllPayments();
      // Ensure we always have an array
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load financial transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Calculate Metrics from real data
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let completedCount = 0;

    payments.forEach(payment => {
      if (payment.status === 'Completed') {
        totalRevenue += (payment.amount || 0);
        completedCount++;
      }
    });

    return {
      revenue: `LKR ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      processed: completedCount.toString(),
    };
  }, [payments]);

  // Filter Payments
  const filteredPayments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return payments;

    return payments.filter((payment) =>
      [payment.orderId, payment.status, payment.payhere_payment_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [payments, search]);

  const cards = [
    { label: 'Total Settled Revenue', value: metrics.revenue, icon: Wallet },
    { label: 'Completed Transactions', value: metrics.processed, icon: FileText },
    { label: 'Gateway Status', value: 'Online', icon: CreditCard },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      {/* Header */}
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Financial & Billing</h1>
      <p className="mt-1 text-slate-600">Track payment health and review platform transactions.</p>

      {/* Metric Cards */}
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-black text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
            </article>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mt-8">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Search Transactions</span>
          <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 transition-colors focus-within:border-blue-600 shadow-sm">
            <Search size={18} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by Order ID or PayHere Transaction ID..."
              className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>
        </label>
      </div>

      {/* Transactions Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Order ID</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Date & Time</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Amount</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Gateway ID</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Loader2 size={18} className="animate-spin text-blue-600" />
                    Loading financial records...
                  </span>
                </td>
              </tr>
            )}

            {!loading && filteredPayments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <ArrowRightLeft size={18} />
                    No transactions found.
                  </span>
                </td>
              </tr>
            )}

            {!loading && filteredPayments.map((payment) => (
              <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-900">{payment.orderId}</p>
                </td>
                <td className="px-4 py-4 text-slate-700 font-medium">
                  {new Date(payment.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-900">
                    {payment.currency} {payment.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </td>
                <td className="px-4 py-4 text-slate-600 font-mono text-xs">
                  {payment.payhere_payment_id || 'N/A'}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[payment.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
};

export default Billing;