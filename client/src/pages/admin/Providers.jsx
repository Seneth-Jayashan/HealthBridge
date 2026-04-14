import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Eye, Loader2, Search, XCircle } from 'lucide-react';
import { getAllDoctors, verifyDoctor } from '../../services/admin.service';

const statusOptions = ['All', 'Review', 'Pending', 'Approved', 'Rejected'];

const statusStyles = {
  Review: 'bg-amber-50 text-amber-700 border-amber-200',
  Pending: 'bg-slate-100 text-slate-700 border-slate-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const Providers = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page: 1, limit: 200 };
      if (status !== 'All') {
        params.status = status;
      }
      const response = await getAllDoctors(params);
      setDoctors(response?.doctors || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load provider queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [status]);

  const filteredDoctors = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return doctors;

    return doctors.filter((doctor) =>
      [doctor.specialization, doctor.registrationNumber, doctor.doctorID]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [doctors, search]);

  const handleVerification = async (doctorId, action) => {
    try {
      setSuccess('');
      setError('');
      setUpdatingId(doctorId);
      await verifyDoctor(doctorId, action);
      setSuccess(`Doctor status updated to ${action}.`);
      await loadDoctors();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update verification status.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Provider Network</h1>
          <p className="mt-1 text-slate-600">Review doctor verification requests and manage approvals.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Search</span>
          <div className="flex items-center rounded-xl border border-slate-300 px-3">
            <Search size={18} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by specialization, registration number, or doctor ID"
              className="w-full bg-transparent px-3 py-3 text-sm outline-none"
            />
          </div>
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Doctor</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Registration</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Doctor ID</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Status</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading providers...
                  </span>
                </td>
              </tr>
            )}

            {!loading && filteredDoctors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No providers found for the selected filters.</td>
              </tr>
            )}

            {!loading && filteredDoctors.map((doctor) => (
              <tr key={doctor._id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{doctor.specialization || 'N/A'}</p>
                  <p className="text-xs text-slate-500">Experience: {doctor.experienceYears ?? 0} years</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{doctor.registrationNumber || 'N/A'}</td>
                <td className="px-4 py-3 text-slate-700">{doctor.doctorID || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[doctor.verificationStatus] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {doctor.verificationStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerification(doctor._id, 'Review')}
                      disabled={updatingId === doctor._id}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 disabled:opacity-60"
                    >
                      <Eye size={14} />
                      Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerification(doctor._id, 'Approved')}
                      disabled={updatingId === doctor._id}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 size={14} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerification(doctor._id, 'Rejected')}
                      disabled={updatingId === doctor._id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-60"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
        Review queue tips: Use Review for under-assessment cases, Approve to unlock doctor dashboard access, Reject to request resubmission.
      </div>
    </section>
  );
};

export default Providers;
