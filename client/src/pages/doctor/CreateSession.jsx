import React, { useState } from 'react';
import { PlusCircle, LoaderCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTelemedicineSession } from '../../services/telemedicine.service';

const CreateSession = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    patientId: '',
    topic: '',
    description: '',
    appointmentId: '',
    scheduledAt: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      if (!form.patientId.trim()) {
        setError('Patient ID is required to create a consultation room.');
        setSubmitting(false);
        return;
      }

      if (!form.topic.trim()) {
        setError('Topic is required for the consultation.');
        setSubmitting(false);
        return;
      }

      const payload = {
        patientId: form.patientId.trim(),
        appointmentId: form.appointmentId.trim() || undefined,
        scheduledAt: form.scheduledAt || undefined,
        metadata: {
          topic: form.topic.trim(),
          description: form.description.trim(),
        },
      };

      const created = await createTelemedicineSession(payload);
      setMessage('Consultation room created successfully! Redirecting to sessions...');
      
      setTimeout(() => {
        navigate('/doctor/telehealth', { state: { sessionId: created?._id } });
      }, 1500);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to create consultation room.');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/doctor/telehealth');
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center justify-center rounded-lg border border-teal-300 bg-teal-100 p-2 text-teal-700 hover:bg-teal-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-teal-700">Create Consultation</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">New Telehealth Session</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">Set up a new consultation room with a patient for video conferencing.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleCreateSession} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
                <PlusCircle size={20} className="text-teal-600" />
                Session Details
              </h2>
            </div>

            {/* Patient ID Field */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Patient ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="patientId"
                value={form.patientId}
                onChange={handleInputChange}
                placeholder="Enter patient's MongoDB ObjectId"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
              />
              <p className="mt-1 text-xs text-slate-500">The unique identifier of the patient from the system</p>
            </div>

            {/* Topic Field */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Consultation Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="topic"
                value={form.topic}
                onChange={handleInputChange}
                placeholder="e.g., Follow-up Checkup, Emergency Consultation"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
              />
              <p className="mt-1 text-xs text-slate-500">The main topic or reason for the consultation</p>
            </div>

            {/* Description Field */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Description <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Add any additional details about the consultation..."
                rows="4"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition resize-none"
              />
              <p className="mt-1 text-xs text-slate-500">Provide context or notes for the consultation</p>
            </div>

            {/* Appointment ID Field */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Appointment ID <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                name="appointmentId"
                value={form.appointmentId}
                onChange={handleInputChange}
                placeholder="Link to an existing appointment"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
              />
              <p className="mt-1 text-xs text-slate-500">If this is associated with a scheduled appointment</p>
            </div>

            {/* Schedule Field */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Schedule <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
              />
              <p className="mt-1 text-xs text-slate-500">Set when the consultation should take place</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-3">
                <span className="text-red-600 text-lg">⚠️</span>
                {error}
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 flex items-start gap-3">
                <span className="text-emerald-600 text-lg">✓</span>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/30 disabled:opacity-50 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-200"
              >
                {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                <span>Create Session</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
            <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <span className="text-lg">ℹ️</span> How It Works
            </h3>
            <ul className="text-xs text-blue-800 space-y-2">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Enter the patient's unique ID to create a connection</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Set the consultation topic and add context</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Optionally schedule and link to an appointment</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>Session is created and ready to use immediately</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <span className="text-lg">💡</span> Tips
            </h3>
            <ul className="text-xs text-amber-800 space-y-2">
              <li>• Keep topic descriptions clear and concise</li>
              <li>• Use metadata to track consultation context</li>
              <li>• Schedule sessions in advance when possible</li>
              <li>• Reference appointments for continuity of care</li>
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
              <span className="text-lg">✨</span> After Creation
            </h3>
            <p className="text-xs text-emerald-800">
              Once created, you can immediately start the session, join the video call, and manage the consultation from the main Telehealth console.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateSession;
