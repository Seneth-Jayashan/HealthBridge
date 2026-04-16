import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientByIdForDoctor } from '../../services/doctor.service';
import { getPatientById } from '../../services/user.service'; 
import { 
  X, User, Mail, Phone, MapPin, Droplet, Activity, 
  HeartPulse, PhoneCall, FileSignature, Loader2, 
  AlertCircle, FileText, ExternalLink 
} from 'lucide-react';

const PatientDetailsModal = ({ isOpen, onClose, patientId, isDark }) => {
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllPatientData = async () => {
      if (!isOpen || !patientId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch the unified medical profile (which now includes reports)
        const medicalProfile = await getPatientByIdForDoctor(patientId);
        if (!medicalProfile) throw new Error("Patient not found");

        // Fetch basic User details (Name, Email, Phone)
        const userData = await getPatientById(medicalProfile.userId).catch(() => ({ 
          name: 'Unknown', 
          email: 'N/A', 
          phoneNumber: 'N/A' 
        }));

        setPatient({
          ...medicalProfile,
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber
        });
        
        // Extract reports directly from the payload instead of calling a second API
        setReports(medicalProfile.medicalReports || medicalProfile.reports || []);
        
      } catch (err) {
        console.error("Failed to fetch patient data:", err);
        setError(err.response?.data?.message || "Unable to load patient information.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPatientData();
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return 'PT';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleAddPrescription = () => {
    onClose(); 
    navigate(`/doctor/prescriptions/new?patientId=${patientId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden transform transition-all ${isDark ? 'bg-[#131C31] border border-slate-800' : 'bg-white border border-slate-200'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 lg:px-8 py-5 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <User size={24} />
            </div>
            <div>
              <h3 className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Patient Account Details</h3>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ID: {patientId}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <p className={`font-medium text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading medical records...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 font-bold">
              <AlertCircle size={28} /><p>{error}</p>
            </div>
          ) : patient ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* --- LEFT COLUMN (Profile & Vitals) --- */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Profile Overview */}
                <div className={`p-6 md:p-8 rounded-3xl border text-center flex flex-col items-center ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-blue-500/20 mb-5 border-4 border-white dark:border-slate-800">
                    {getInitials(patient.name)}
                  </div>
                  <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{patient.name}</h2>
                  
                  <div className={`mt-4 space-y-2 text-sm font-medium w-full ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <Mail size={16} className="text-blue-500" /> {patient.email}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Phone size={16} className="text-blue-500" /> {patient.phoneNumber}
                    </div>
                    {patient.address && (
                      <div className="flex items-center justify-center gap-2 pt-2 border-t mt-3 border-slate-200 dark:border-slate-800">
                        <MapPin size={16} className="text-blue-500" /> {patient.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vitals & Demographics */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#131C31] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Activity size={18} className="text-blue-500" /> Patient Vitals
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date of Birth</p>
                      <p className={`font-black text-lg ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gender</p>
                      <p className={`font-black text-lg ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{patient.gender || 'N/A'}</p>
                    </div>
                    <div className={`p-5 rounded-2xl border col-span-2 flex items-center justify-between ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-red-400/70' : 'text-red-400'}`}>Blood Group</p>
                        <p className={`text-2xl font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>{patient.bloodGroup || 'Unknown'}</p>
                      </div>
                      <Droplet size={36} className="text-red-500 opacity-20" />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                {patient.emergencyContact?.name && (
                  <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#131C31] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <PhoneCall size={18} className="text-red-500" /> Emergency Contact
                    </h4>
                    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{patient.emergencyContact.name}</p>
                      <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{patient.emergencyContact.relationship}</p>
                      <a href={`tel:${patient.emergencyContact.phoneNumber}`} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                        <Phone size={16} /> Call {patient.emergencyContact.phoneNumber}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* --- RIGHT COLUMN (Conditions & Reports) --- */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Conditions & Allergies Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-3xl border h-full ${isDark ? 'bg-[#131C31] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <AlertCircle size={18} className="text-amber-500" /> Allergies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies?.length > 0 ? patient.allergies.map((allergy, i) => (
                        <span key={i} className={`px-4 py-1.5 rounded-full text-sm font-bold ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-100 text-amber-700'}`}>{allergy}</span>
                      )) : <p className={`text-sm italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No recorded allergies.</p>}
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border h-full ${isDark ? 'bg-[#131C31] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <HeartPulse size={18} className="text-blue-500" /> Chronic Conditions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {patient.chronicConditions?.length > 0 ? patient.chronicConditions.map((condition, i) => (
                        <span key={i} className={`px-4 py-1.5 rounded-full text-sm font-bold ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-700'}`}>{condition}</span>
                      )) : <p className={`text-sm italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No chronic conditions recorded.</p>}
                    </div>
                  </div>
                </div>

                {/* Medical Reports */}
                <div className={`p-6 rounded-3xl border h-full flex flex-col ${isDark ? 'bg-[#131C31] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-5">
                    <h4 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <FileText size={18} className="text-blue-500" /> Medical Reports & Documents
                    </h4>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {reports.length} Files
                    </span>
                  </div>
                  
                  <div className={`flex-1 rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    {reports.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <FileText size={48} className={`mb-3 opacity-20 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No medical reports uploaded yet.</p>
                      </div>
                    ) : (
                      <ul className={`divide-y max-h-[350px] overflow-y-auto custom-scrollbar ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                        {reports.map((report, index) => (
                          <li key={`${report._id}-${index}`} className={`p-5 flex items-center justify-between transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-white'}`}>
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                <FileText size={20} />
                              </div>
                              <div>
                                <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{report.title || report.reportName || report.documentType || 'Medical Report'}</p>
                                <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Uploaded: {new Date(report.uploadedAt || report.uploadDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <a href={report.fileUrl || report.url || report.documentURL} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-full transition-colors flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`} title="View Document">
                              <ExternalLink size={20} />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className={`px-6 lg:px-8 py-5 border-t flex items-center justify-end gap-4 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <button 
            onClick={onClose} 
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
          >
            Close Details
          </button>
          <button 
            onClick={handleAddPrescription} 
            disabled={isLoading || error} 
            className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
          >
            <FileSignature size={18} /> Write Prescription
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;