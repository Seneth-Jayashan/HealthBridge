import React, { useEffect, useState } from 'react';
import { 
  X, 
  Receipt, 
  User, 
  Calendar, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Hash
} from 'lucide-react';
import { getDoctorByIdForPatient } from '../../services/patient.service';
import { getDoctorById } from '../../services/user.service';
// Note: Adjust this import to match wherever your appointment fetching logic lives
// import { getAppointmentById } from '../../services/appointment.service'; 

const PaymentDetailsModal = ({ isOpen, onClose, payment, isDark }) => {
  const [doctor, setDoctor] = useState(null);
  const [docData, setDocData] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!payment || !isOpen) return;
      
      setIsLoading(true);
      try {
        const docData = await getDoctorByIdForPatient(payment.doctorId);
        const doctor = await getDoctorById(docData.userId); // To get specialization and other details
        setDoctor(doctor);
        setDocData(docData);
        setAppointment(apptData);
      } catch (error) {
        console.error("Failed to fetch payment details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  // Helper for formatting currency
  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  // Helper for Status Badge
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={14} /> Completed</span>;
    if (s === 'pending') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500"><Clock size={14} /> Pending</span>;
    if (s === 'failed') return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500"><XCircle size={14} /> Failed</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-500">Unknown</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transform transition-all ${isDark ? 'bg-[#131C31] border border-slate-800' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <Receipt size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Transaction Details</h3>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{payment.orderId}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading related records...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Payment Info */}
              <div className="space-y-6">
                <div>
                  <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Amount Paid</p>
                  <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(payment.amount, payment.payhere_currency)}
                  </p>
                  <div className="mt-2">{getStatusBadge(payment.status)}</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date & Time</p>
                    <p className={`font-medium flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Clock size={16} className="text-blue-500" />
                      {new Date(payment.paymentDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gateway Transaction ID</p>
                    <p className={`font-medium flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Hash size={16} className="text-blue-500" />
                      {payment.payhere_payment_id || payment.transactionId || 'Pending Gateway Confirmation'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctor & Appointment Info */}
              <div className={`p-6 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-100 bg-slate-50'}`}>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'}`}>Consultation Details</h4>
                
                <div className="space-y-5">
                  <div>
                    <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Doctor</p>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                        <User size={18} className="text-blue-500" />
                      </div>
                      <div>
                        <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {doctor ? `Dr. ${doctor.lastName || doctor.name}` : 'Unknown Doctor'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {docData?.specialization || 'Medical Specialist'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Appointment</p>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                        <Calendar size={18} className="text-blue-500" />
                      </div>
                      <div>
                        <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {appointment ? new Date(appointment.date).toLocaleDateString() : 'View Calendar'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {appointment?.timeSlot || `Ref ID: ${payment.appointmentId.substring(0,8)}...`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-8 py-5 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentDetailsModal;