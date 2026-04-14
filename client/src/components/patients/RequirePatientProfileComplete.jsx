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

const RequirePatientProfileComplete = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 font-semibold">
        Loading patient profile...
      </div>
    );
  }

  if (isComplete) {
    return <Outlet />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-slate-50 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Complete Your Patient Profile</h2>
              <p className="text-sm font-medium text-slate-500">
                {user?.name ? `${user.name}, ` : ''}update your details and upload a medical report to continue.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date of Birth *</label>
              <input type="date" name="dateOfBirth" required value={formData.dateOfBirth} onChange={handleFieldChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Gender *</label>
              <select name="gender" required value={formData.gender} onChange={handleFieldChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 bg-white">
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleFieldChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 bg-white">
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Phone Number *</label>
              <input name="contactNumber" required value={formData.contactNumber} onChange={handleFieldChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Address *</label>
              <input name="address" required value={formData.address} onChange={handleFieldChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="123 Health Street" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Allergies</label>
              <input name="allergies" value={formData.allergies} onChange={handleFieldChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="Peanuts, Penicillin" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Chronic Conditions</label>
              <input name="chronicConditions" value={formData.chronicConditions} onChange={handleFieldChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="Asthma, Diabetes" />
            </div>
            <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
              <h3 className="mb-4 text-sm font-bold text-slate-800">Emergency Contact *</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <input name="name" required value={formData.emergencyContact.name} onChange={handleEmergencyChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="Contact Name" />
                <input name="relationship" required value={formData.emergencyContact.relationship} onChange={handleEmergencyChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="Relationship" />
                <input name="phoneNumber" required value={formData.emergencyContact.phoneNumber} onChange={handleEmergencyChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="Phone Number" />
              </div>
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
              <h3 className="mb-4 text-sm font-bold text-slate-800">Medical Report *</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Report Title</label>
                      <input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="Recent Lab Result" />
                </div>
                <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Report Type</label>
                  <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 bg-white">
                    <option value="Lab Result">Lab Result</option>
                    <option value="Scan">Scan</option>
                    <option value="General">General</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Notes</label>
                  <textarea value={reportNotes} onChange={(event) => setReportNotes(event.target.value)} rows="3" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" placeholder="Optional notes for the doctor" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Report File</label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-slate-600 hover:border-blue-600 hover:text-blue-700">
                    <FileUp size={18} />
                    <span>{reportFile ? reportFile.name : 'Choose medical report file'}</span>
                    <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReportFile(event.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white hover:bg-blue-800 disabled:opacity-70">
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