import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { getMyPayments } from '../../services/payment.service'; 
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Receipt,
  ChevronRight
} from 'lucide-react';
import PaymentDetailsModal from '../../components/payment/PaymentDetailsPatient'; // <-- Import the new modal

const MyPayments = () => {
  const { isDark = false } = useOutletContext() || {};
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        const data = await getMyPayments(); 
        setPayments(data || []);
      } catch (err) {
        console.error("Failed to fetch payments:", err);
        setError("Unable to load your payment history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  useEffect(() => {
    if (!isLoading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.hb-payment-item', {
        y: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(100)
      });
    }
  }, [isLoading]);

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700'}`}><CheckCircle2 size={14} /> Completed</span>;
    if (s === 'pending') return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-100 text-amber-700'}`}><Clock size={14} /> Pending</span>;
    if (s === 'failed') return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-100 text-red-700'}`}><XCircle size={14} /> Failed</span>;
    return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>Unknown</span>;
  };

  if (isLoading) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* Header */}
      <div className="hb-payment-item mb-10 opacity-0 max-w-6xl mx-auto">
        <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Payment History
        </h1>
        <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          View your consultation receipts and click on any transaction for details.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {error && (
          <div className="hb-payment-item opacity-0 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 font-bold">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        )}

        {!error && (
          <div className={`hb-payment-item rounded-3xl border opacity-0 shadow-lg overflow-hidden ${isDark ? 'border-slate-800 bg-[#131C31]' : 'border-slate-200 bg-white'}`}>
            <div className={`px-8 py-6 border-b flex items-center gap-3 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <Receipt size={24} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Transactions
              </h3>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <CreditCard size={48} className={`mb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>No payments found</h4>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Once you book and pay for a consultation, the receipt will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50 text-slate-500'}`}>
                      <th className="px-8 py-5">Order ID</th>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Amount</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {payments.map((payment) => (
                      <tr 
                        key={payment._id} 
                        onClick={() => handleRowClick(payment)}
                        className={`cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/50'}`}
                      >
                        <td className="px-8 py-5">
                          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {payment.orderId}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatCurrency(payment.amount, payment.payhere_currency)}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button className={`p-2 rounded-full transition-colors ${isDark ? 'text-slate-500 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-900'}`}>
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render the Modal */}
      <PaymentDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        payment={selectedPayment} 
        isDark={isDark}
      />
    </div>
  );
};

export default MyPayments;