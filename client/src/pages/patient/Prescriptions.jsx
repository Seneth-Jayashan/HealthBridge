import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { 
  FileText, Pill, Calendar, Clock, Stethoscope, 
  Download, Printer, Loader2, AlertCircle, 
  ChevronRight, X, Hospital
} from 'lucide-react';
import { getMyPrescriptions } from '../../services/prescription.service'; // Adjust path as needed
import { useAuth } from '../../context/AuthContext';

const PatientPrescriptions = () => {
  const { isDark = false } = useOutletContext() || {};
  const { user } = useAuth(); // Logged in patient details
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setIsLoading(true);
        const data = await getMyPrescriptions();
        setPrescriptions(data || []);
      } catch (err) {
        console.error("Failed to load prescriptions:", err);
        setError("Unable to load your prescriptions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  useEffect(() => {
    if (!isLoading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.hb-rx-item', {
        y: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(100)
      });
    }
  }, [isLoading]);

  // Handles the clean printing/downloading of the prescription
  const handlePrint = () => {
    const printContent = document.getElementById('printable-prescription');
    const originalContents = document.body.innerHTML;
    
    // Replace body with just the prescription, print, then restore
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Refresh to restore React's DOM bindings cleanly
  };

  if (isLoading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Retrieving your medical records...</p>
      </div>
    );
  }

  return (
    <section className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="hb-rx-item opacity-0">
          <h1 className={`text-3xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <FileText className="text-blue-500" size={32} />
            My Prescriptions
          </h1>
          <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            View, download, and manage your digital medical prescriptions.
          </p>
        </div>

        {error && (
          <div className="hb-rx-item opacity-0 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 font-bold">
            <AlertCircle size={24} /> <p>{error}</p>
          </div>
        )}

        {/* Prescription List */}
        {!error && (
          <div className="space-y-4">
            {prescriptions.length === 0 ? (
              <div className={`hb-rx-item opacity-0 p-12 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed ${isDark ? 'bg-[#131C31]/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                  <Pill size={32} className="text-slate-400" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>No Prescriptions Found</h3>
                <p className={`max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  When a doctor issues an E-Prescription for you, it will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {prescriptions.map((rx, index) => (
                  <div 
                    key={rx._id || index}
                    onClick={() => setSelectedPrescription(rx)}
                    className={`hb-rx-item opacity-0 group p-6 rounded-3xl border transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between ${
                      isDark 
                        ? 'bg-[#131C31] border-slate-800 hover:border-blue-500/50 shadow-black/20' 
                        : 'bg-white border-slate-100 hover:border-blue-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                          <Stethoscope size={24} />
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          {new Date(rx.createdAt || rx.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Dr. {rx.doctorId?.name || 'Unknown Doctor'}
                      </h3>
                      <p className={`text-sm font-medium mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {rx.doctorId?.specialization || 'General Practitioner'}
                      </p>

                      <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Pill size={16} className="text-blue-500" /> 
                        {rx.medication?.length || 0} Prescribed Medications
                      </div>
                    </div>

                    <div className={`mt-6 pt-4 border-t flex items-center justify-between text-sm font-bold transition-colors ${
                      isDark ? 'border-slate-800 text-blue-400 group-hover:text-blue-300' : 'border-slate-100 text-blue-600 group-hover:text-blue-700'
                    }`}>
                      View E-Prescription
                      <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- E-PRESCRIPTION MODAL --- */}
        {selectedPrescription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedPrescription(null)} />
            
            <div className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#131C31] border border-slate-800' : 'bg-white border border-slate-200'}`}>
              
              {/* Modal Control Header (Not Printed) */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <FileText size={20} className="text-blue-500" /> Digital Prescription
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    <Printer size={16} /> Print / Save PDF
                  </button>
                  <button onClick={() => setSelectedPrescription(null)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                
                {/* The actual document to be printed */}
                <div id="printable-prescription" className="p-8 md:p-12 bg-white text-black max-w-4xl mx-auto">
                  
                  {/* Hospital/Clinic Header */}
                  <div className="flex justify-between items-start border-b-2 border-blue-800 pb-6 mb-8">
                    <div className="flex items-center gap-3 text-blue-800">
                      <Hospital size={40} />
                      <div>
                        <h1 className="text-2xl font-black tracking-tight">HEALTHBRIDGE</h1>
                        <p className="text-sm font-bold tracking-widest text-blue-600">CLINICAL E-PRESCRIPTION</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-xl font-black text-slate-900">Dr. {selectedPrescription.doctorId?.name || 'Doctor'}</h2>
                      <p className="text-sm font-bold text-slate-600">{selectedPrescription.doctorId?.specialization || 'Medical Practitioner'}</p>
                      <p className="text-xs text-slate-500 mt-1">Ref ID: {selectedPrescription.prescriptionId || selectedPrescription._id.substring(0,8).toUpperCase()}</p>
                      <p className="text-xs text-slate-500">Date: {new Date(selectedPrescription.createdAt || selectedPrescription.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Patient Info Row */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Patient Name</p>
                      <p className="font-bold text-slate-900">{user?.name || 'Patient'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Age/Gender</p>
                      <p className="font-bold text-slate-900">{user?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Start Date</p>
                      <p className="font-bold text-slate-900">{new Date(selectedPrescription.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">End Date</p>
                      <p className="font-bold text-slate-900">{new Date(selectedPrescription.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* The Rx Symbol */}
                  <div className="text-5xl font-serif font-bold text-slate-800 mb-6 italic">
                    Rx
                  </div>

                  {/* Medications Table */}
                  <div className="mb-10 min-h-[250px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-3 font-bold text-slate-700 uppercase text-xs tracking-wider">Medicine Name</th>
                          <th className="py-3 font-bold text-slate-700 uppercase text-xs tracking-wider">Dosage</th>
                          <th className="py-3 font-bold text-slate-700 uppercase text-xs tracking-wider">Frequency</th>
                          <th className="py-3 font-bold text-slate-700 uppercase text-xs tracking-wider text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPrescription.medication?.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 font-bold text-slate-900">{med.medicineName}</td>
                            <td className="py-4 font-medium text-slate-700">{med.dosage}</td>
                            <td className="py-4 font-medium text-slate-700">{med.frequency}</td>
                            <td className="py-4 font-medium text-slate-700 text-right">{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Doctor Notes */}
                  {selectedPrescription.notes && (
                    <div className="mb-10">
                      <h4 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-2 border-b border-slate-200 pb-2">Clinical Notes & Advice</h4>
                      <p className="text-slate-800 whitespace-pre-wrap">{selectedPrescription.notes}</p>
                    </div>
                  )}

                  {/* Footer & Signature */}
                  <div className="mt-16 pt-8 border-t-2 border-slate-200 flex justify-between items-end">
                    <div className="text-xs text-slate-400 font-medium">
                      <p>This is a digitally generated prescription.</p>
                      <p>Issued securely via HealthBridge Platform.</p>
                    </div>
                    <div className="text-center">
                      <div className="w-48 border-b border-slate-400 mb-2 border-dashed"></div>
                      <p className="text-sm font-bold text-slate-800">Dr. {selectedPrescription.doctorId?.name || 'Doctor'}</p>
                      <p className="text-xs text-slate-500">Authorized Signature</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default PatientPrescriptions;