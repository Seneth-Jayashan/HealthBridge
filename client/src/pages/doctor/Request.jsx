import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileUp, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDoctorProfile, updateDoctorProfile, uploadVerificationDocument } from '../../services/doctor.service';

const initialForm = {
  specialization: '',
  registrationNumber: '',
  qualifications: '',
  experienceYears: '',
  bio: '',
  consultationFee: '',
};

const DoctorRequest = () => {
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
    <section className="min-h-full rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
      <div className="max-w-3xl">
        {authLoading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Loading doctor approval status...
          </div>
        )}

        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          <ShieldAlert size={16} />
          Doctor access is pending approval
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900">Submit your Doctor Request</h1>
        <p className="mt-2 text-slate-600">
          {user?.name ? `${user.name}, ` : ''}complete your professional details and upload a verification document for admin review.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Current status: <span className="font-bold text-slate-900">{effectiveStatus}</span>
        </div>

        {effectiveStatus === 'Review' && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-700">
            You already submitted your doctor request. Wait until admin review.
          </div>
        )}

        {effectiveStatus === 'Approved' && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            Your doctor account is approved. Redirecting to the dashboard.
          </div>
        )}

        {effectiveStatus === 'Rejected' && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            Your previous request was rejected by admin. Contact admin for more information.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 inline-flex items-center gap-2">
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {!authLoading && canSubmitRequest && (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Specialization</label>
            <input
              name="specialization"
              value={form.specialization}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Cardiology"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Registration Number</label>
            <input
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={onChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="SLMC-12345"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Qualifications</label>
            <input
              name="qualifications"
              value={form.qualifications}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="MBBS, MD, FCPS"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Experience Years</label>
            <input
              type="number"
              name="experienceYears"
              value={form.experienceYears}
              onChange={onChange}
              min="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Consultation Fee</label>
            <input
              type="number"
              name="consultationFee"
              value={form.consultationFee}
              onChange={onChange}
              min="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="2500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Professional Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={onChange}
              rows="4"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Short summary of your practice and clinical focus."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Document Type</label>
            <input
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Medical License"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Verification Document</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-slate-600 hover:border-blue-600 hover:text-blue-700">
              <FileUp size={18} />
              <span>{documentFile ? documentFile.name : 'Choose file to upload'}</span>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
                required={!documentFile && !hasVerificationDocument}
              />
            </label>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-70"
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