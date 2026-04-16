import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CheckCircle2, FileUp, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDoctorProfile, updateDoctorProfile, uploadVerificationDocument } from '../../services/doctor.service';
import { SPECIALIZATION } from '@healthbridge/shared/src/constants/specialization.js';

const initialForm = {
  specialization: '',
  registrationNumber: '',
  qualifications: '',
  experienceYears: '',
  bio: '',
  consultationFee: '',
};

const DoctorRequest = () => {
  const { isDark = false } = useOutletContext() || {};
  const navigate = useNavigate();
  const { user, doctorStatus, refreshDoctorStatus, loading: authLoading } = useAuth();
  
  const [form, setForm] = useState(initialForm);
  const [documentType, setDocumentType] = useState('Medical License');
  const [documentFile, setDocumentFile] = useState(null);
  const [hasVerificationDocument, setHasVerificationDocument] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const effectiveStatus = profileStatus || doctorStatus || 'Pending';
  const canSubmitRequest = effectiveStatus === 'Pending' || effectiveStatus === 'Rejected';

  useEffect(() => {
    const loadDoctorProfile = async () => {
      try {
        const profile = await getDoctorProfile();
        setForm({
          specialization: profile.specialization || '',
          registrationNumber: profile.registrationNumber || '',
          qualifications: Array.isArray(profile.qualifications) ? profile.qualifications.join(', ') : '',
          experienceYears: profile.experienceYears ?? '',
          bio: profile.bio || '',
          consultationFee: profile.consultationFee ?? '',
        });
        setProfileStatus(profile.verificationStatus || 'Pending');
        if (profile.verificationDocuments?.documentType) {
          setDocumentType(profile.verificationDocuments.documentType);
        }
        setHasVerificationDocument(Boolean(profile.verificationDocuments?.documentURL));
      } catch (requestError) {
        if (requestError.response?.status !== 404) {
          setError(requestError.response?.data?.message || 'Unable to load doctor request details.');
        } else {
          setProfileStatus('Pending');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDoctorProfile();
  }, []);

  useEffect(() => {
    if (effectiveStatus === 'Approved') {
      navigate('/doctor/dashboard', { replace: true });
    }
  }, [effectiveStatus, navigate]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const profilePayload = {
        specialization: form.specialization.trim(),
        registrationNumber: form.registrationNumber.trim(),
        qualifications: form.qualifications
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        experienceYears: form.experienceYears === '' ? 0 : Number(form.experienceYears),
        bio: form.bio.trim(),
        consultationFee: form.consultationFee === '' ? 0 : Number(form.consultationFee),
      };

      await updateDoctorProfile(profilePayload);

      if (documentFile) {
        await uploadVerificationDocument(documentFile, documentType);
      }

      const refreshedUser = await refreshDoctorStatus();
      setSuccess('Doctor request submitted. Admin review is now pending.');

      if (refreshedUser?.doctorStatus === 'Approved') {
        navigate('/doctor/dashboard', { replace: true });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit doctor request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`min-h-full rounded-3xl border p-6 md:p-10 shadow-sm transition-colors duration-300 ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-200'}`}>
      <div className="max-w-3xl">
        
        {authLoading && (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            Loading doctor approval status...
          </div>
        )}

        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-transparent'}`}>
          <ShieldAlert size={16} />
          Doctor access is pending approval
        </div>

        <h1 className={`mt-5 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Submit your Doctor Request
        </h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {user?.name ? `${user.name}, ` : ''}complete your professional details and upload a verification document for admin review.
        </p>

        <div className={`mt-6 rounded-2xl border p-4 text-sm ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
          Current status: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{effectiveStatus}</span>
        </div>

        {effectiveStatus === 'Review' && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-medium ${isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            You already submitted your doctor request. Wait until admin review.
          </div>
        )}

        {effectiveStatus === 'Approved' && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-medium ${isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            Your doctor account is approved. Redirecting to the dashboard.
          </div>
        )}

        {effectiveStatus === 'Rejected' && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-medium ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
            Your previous request was rejected by admin. Contact admin for more information.
          </div>
        )}

        {error && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-medium ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {error}
          </div>
        )}

        {success && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-medium inline-flex items-center gap-2 ${isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {!authLoading && canSubmitRequest && (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          
          <div className="space-y-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Specialization</label>
            <select
              name="specialization"
              value={form.specialization}
              onChange={onChange}
              required
              className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'}`}
            >
              <option value="" disabled>
                Select Specialization
              </option>
              {Object.values(SPECIALIZATION).map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Registration Number</label>
            <input
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={onChange}
              required
              className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'}`}
              placeholder="SLMC-12345"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Qualifications</label>
            <input
              name="qualifications"
              value={form.qualifications}
              onChange={onChange}
              className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'}`}
              placeholder="MBBS, MD, FCPS"
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Experience Years</label>
            <input
              type="number"
              name="experienceYears"
              value={form.experienceYears}
              onChange={onChange}
              min="0"
              className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'}`}
              placeholder="10"
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Consultation Fee</label>
            <input
              type="number"
              name="consultationFee"
              value={form.consultationFee}
              onChange={onChange}
              min="0"
              className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'}`}
              placeholder="2500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Professional Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={onChange}
              rows="4"
              className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'}`}
              placeholder="Short summary of your practice and clinical focus."
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Document Type</label>
            <input
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'}`}
              placeholder="Medical License"
            />
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Verification Document</label>
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${isDark ? 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 text-slate-600 hover:border-blue-600 hover:text-blue-700'}`}>
              <FileUp size={18} />
              <span className="truncate">{documentFile ? documentFile.name : 'Choose file to upload'}</span>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                required={!documentFile && !hasVerificationDocument}
              />
            </label>
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={submitting || loading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold transition-all disabled:opacity-70 ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {submitting ? 'Submitting request...' : 'Submit Doctor Request'}
            </button>
          </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default DoctorRequest;