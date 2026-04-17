import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertCircle, FileUp, Loader2, Save, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatientProfile, updatePatientProfile, uploadMedicalReport } from '../../services/patient.service';

const emptyForm = {
  dateOfBirth: '',
  gender: 'Prefer not to say',
  bloodGroup: '',
  contactNumber: '',
  address: '',
  allergies: '',
  chronicConditions: '',
  emergencyContact: {
    name: '',
    relationship: '',
    phoneNumber: '',
  },
};

const RequirePatientProfileComplete = ({ isDark }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('General');
  const [reportNotes, setReportNotes] = useState('');
  const [reportFile, setReportFile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getPatientProfile();
        setIsComplete(Boolean(profile.isUpdated));
        setFormData({
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
          gender: profile.gender || 'Prefer not to say',
          bloodGroup: profile.bloodGroup || '',
          contactNumber: profile.contactNumber || '',
          address: profile.address || '',
          allergies: profile.allergies?.join(', ') || '',
          chronicConditions: profile.chronicConditions?.join(', ') || '',
          emergencyContact: profile.emergencyContact || emptyForm.emergencyContact,
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load patient profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleEmergencyChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      emergencyContact: {
        ...previous.emergencyContact,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const profilePayload = {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        contactNumber: formData.contactNumber,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContact.name,
          relationship: formData.emergencyContact.relationship,
          phoneNumber: formData.emergencyContact.phoneNumber,
        },
        allergies: formData.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        chronicConditions: formData.chronicConditions.split(',').map((item) => item.trim()).filter(Boolean),
      };

      await updatePatientProfile(profilePayload);

      if (reportFile) {
        if (!reportTitle.trim()) {
          throw new Error('Report title is required when uploading a medical report.');
        }

        const reportFormData = new FormData();
        reportFormData.append('reportFile', reportFile);
        reportFormData.append('title', reportTitle.trim());
        reportFormData.append('reportType', reportType);
        reportFormData.append('notes', reportNotes.trim());

        await uploadMedicalReport(reportFormData);
      }

      setIsComplete(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to complete patient profile.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper variable for input fields to keep the JSX clean
  const inputClass = `w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600 transition-colors ${
    isDark 
      ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-500 focus:bg-[#131C31]' 
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-semibold ${isDark ? 'bg-[#0B1120] text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        Loading patient profile...
      </div>
    );
  }

  if (isComplete) {
    return <Outlet />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-4xl overflow-hidden rounded-3xl border shadow-2xl transform transition-all ${isDark ? 'bg-[#131C31] border-slate-800' : 'bg-white border-slate-200'}`}>
        
        {/* Header */}
        <div className={`border-b px-8 py-6 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Complete Your Patient Profile</h2>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {user?.name ? `${user.name}, ` : ''}update your details and upload a medical report to continue.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto custom-scrollbar p-8">
          {error && (
            <div className={`mb-6 rounded-2xl border p-4 text-sm font-bold flex items-center gap-3 ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <AlertCircle size={20} /> {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelClass}>Date of Birth *</label>
              <input type="date" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleFieldChange} className={inputClass} />
            </div>
            
            <div className="space-y-2">
              <label className={labelClass}>Gender *</label>
              <select name="gender" required value={formData.gender} onChange={handleFieldChange} className={inputClass}>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className={labelClass}>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleFieldChange} className={inputClass}>
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className={labelClass}>Phone Number *</label>
              <input name="contactNumber" required value={formData.contactNumber} onChange={handleFieldChange} className={inputClass} placeholder="+1 555 000 0000" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>Address *</label>
              <input name="address" required value={formData.address} onChange={handleFieldChange} className={inputClass} placeholder="123 Health Street" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>Allergies</label>
              <input name="allergies" value={formData.allergies} onChange={handleFieldChange} className={inputClass} placeholder="Peanuts, Penicillin" />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className={labelClass}>Chronic Conditions</label>
              <input name="chronicConditions" value={formData.chronicConditions} onChange={handleFieldChange} className={inputClass} placeholder="Asthma, Diabetes" />
            </div>

            {/* Emergency Contact Section */}
            <div className={`md:col-span-2 border-t pt-4 mt-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`mb-4 text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Emergency Contact *</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <input name="name" required value={formData.emergencyContact.name} onChange={handleEmergencyChange} className={inputClass} placeholder="Contact Name" />
                <input name="relationship" required value={formData.emergencyContact.relationship} onChange={handleEmergencyChange} className={inputClass} placeholder="Relationship" />
                <input name="phoneNumber" required value={formData.emergencyContact.phoneNumber} onChange={handleEmergencyChange} className={inputClass} placeholder="Phone Number" />
              </div>
            </div>

            {/* Medical Report Section */}
            <div className={`md:col-span-2 border-t pt-4 mt-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`mb-4 text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>Medical Report *</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClass}>Report Title</label>
                  <input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} className={inputClass} placeholder="Recent Lab Result" />
                </div>
                
                <div className="space-y-2">
                  <label className={labelClass}>Report Type</label>
                  <select value={reportType} onChange={(event) => setReportType(event.target.value)} className={inputClass}>
                    <option value="Lab Result">Lab Result</option>
                    <option value="Scan">Scan</option>
                    <option value="General">General</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>Notes</label>
                  <textarea value={reportNotes} onChange={(event) => setReportNotes(event.target.value)} rows="3" className={inputClass} placeholder="Optional notes for the doctor" />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>Report File</label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors hover:border-blue-500 hover:text-blue-500 ${isDark ? 'border-slate-700 bg-slate-900/50 text-slate-400' : 'border-slate-300 bg-white text-slate-600'}`}>
                    <FileUp size={18} />
                    <span>{reportFile ? reportFile.name : 'Choose medical report file'}</span>
                    <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReportFile(event.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {submitting ? 'Saving profile...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequirePatientProfileComplete;