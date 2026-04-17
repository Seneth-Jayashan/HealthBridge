import React, { useEffect, useMemo, useState } from 'react';
import { 
  CheckCircle2, 
  Eye, 
  Loader2, 
  Search, 
  XCircle, 
  X, 
  FileText, 
  ExternalLink,
  Award,
  Star,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { getAllDoctors, verifyDoctor } from '../../services/admin.service';
import { getUserById } from '../../services/user.service'; // We will use getUserById to map data securely

const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];

const statusStyles = {
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

  // Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page: 1, limit: 200 };
      if (status !== 'All') {
        params.status = status;
      }
      
      // 1. Fetch the clinical profiles from the Doctor Service
      const response = await getAllDoctors(params);
      const clinicalDoctors = response?.doctors || [];

      // 2. Fetch the auth details for each doctor concurrently
      const mergedDoctors = await Promise.all(
        clinicalDoctors.map(async (doc) => {
          try {
            // Using doc.userId to get the Auth profile
            const authUser = await getUserById(doc.userId);
            return {
              ...doc,
              name: authUser.name || 'Unknown',
              email: authUser.email || 'N/A',
              phoneNumber: authUser.phoneNumber || 'N/A',
            };
          } catch (err) {
            console.error(`Failed to fetch auth data for user ${doc.userId}`);
            return {
              ...doc,
              name: 'Unknown',
              email: 'N/A',
              phoneNumber: 'N/A',
            };
          }
        })
      );

      setDoctors(mergedDoctors);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load provider queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filteredDoctors = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return doctors;

    return doctors.filter((doctor) =>
      [
        doctor.name, 
        doctor.email, 
        doctor.phoneNumber, 
        doctor.specialization, 
        doctor.registrationNumber, 
        doctor.doctorID
      ]
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
      
      // Close modal if the action was taken from inside the modal
      if (selectedDoctor && selectedDoctor._id === doctorId) {
        setSelectedDoctor(null);
      }
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
          <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 transition-colors focus-within:border-blue-600">
            <Search size={18} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, specialization, or ID"
              className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-3 text-sm outline-none focus:border-blue-600 appearance-none"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item} className="bg-white text-slate-900">
                {item}
              </option>
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
              <th className="px-4 py-3 text-left font-bold text-slate-700">Identity & Auth</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Professional Identity</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Status</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading providers & auth records...
                  </span>
                </td>
              </tr>
            )}

            {!loading && filteredDoctors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No providers found for the selected filters.</td>
              </tr>
            )}

            {!loading && filteredDoctors.map((doctor) => (
              <tr key={doctor._id} className="hover:bg-slate-50 transition-colors">
                
                {/* 1. Identity & Auth Column */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {doctor.name ? doctor.name.substring(0, 2).toUpperCase() : 'DR'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{doctor.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={12}/> {doctor.email}</p>
                    </div>
                  </div>
                </td>

                {/* 2. Professional Identity Column */}
                <td className="px-4 py-3 text-slate-700">
                  <p className="font-bold text-slate-900">{doctor.specialization || 'N/A'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Reg: {doctor.registrationNumber || 'N/A'} • ID: {doctor.doctorID || '-'}</p>
                </td>

                {/* 3. Status Column */}
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[doctor.verificationStatus] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {doctor.verificationStatus}
                  </span>
                </td>

                {/* 4. Actions Column */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(doctor)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerification(doctor._id, 'Approved')}
                      disabled={updatingId === doctor._id || doctor.verificationStatus === 'Approved'}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 disabled:opacity-60 hover:bg-emerald-100"
                    >
                      <CheckCircle2 size={14} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerification(doctor._id, 'Rejected')}
                      disabled={updatingId === doctor._id || doctor.verificationStatus === 'Rejected'}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-60 hover:bg-rose-100"
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
        Review queue tips: Use View Details to verify uploaded documents and contact info. Approve to unlock doctor dashboard access, Reject to request resubmission.
      </div>

      {/* --- DOCTOR DETAILS MODAL --- */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">Provider Application Details</h2>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Auth & Identity */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
                      <User size={16} className="text-blue-500"/> Account Identity
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Full Name</p>
                        <p className="font-semibold text-slate-900 text-lg">{selectedDoctor.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Email Address</p>
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          <Mail size={16} className="text-slate-400"/> {selectedDoctor.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</p>
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          <Phone size={16} className="text-slate-400"/> {selectedDoctor.phoneNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Current Status</p>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold mt-1 ${statusStyles[selectedDoctor.verificationStatus] || 'bg-slate-100 text-slate-700'}`}>
                          {selectedDoctor.verificationStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Professional Data */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
                      <Award size={16} className="text-emerald-500"/> Clinical Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Specialization</p>
                        <p className="font-semibold text-slate-900">{selectedDoctor.specialization || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Reg Number</p>
                        <p className="font-semibold text-slate-900">{selectedDoctor.registrationNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Doctor ID</p>
                        <p className="font-semibold text-slate-900">{selectedDoctor.doctorID || 'Pending'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-1">Experience</p>
                        <p className="font-semibold text-slate-900">{selectedDoctor.experienceYears || 0} Years</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Qualifications */}
              <div className="border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase text-slate-500 mb-2">Qualifications</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedDoctor.qualifications?.length > 0 ? (
                    selectedDoctor.qualifications.map((qual, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                        <Award size={14} /> {qual}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No qualifications listed</span>
                  )}
                </div>

                <p className="text-xs font-bold uppercase text-slate-500 mb-2">Professional Bio</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedDoctor.bio || 'No bio provided.'}
                </p>
              </div>

              {/* Verification Document Section */}
              <div className="border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2">
                  <FileText size={16} /> Verification Documents
                </p>
                
                {selectedDoctor.verificationDocuments?.documentURL ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-900">{selectedDoctor.verificationDocuments.documentType || 'Uploaded Document'}</p>
                      <p className="text-xs text-slate-500">Requires admin review</p>
                    </div>
                    <a 
                      href={selectedDoctor.verificationDocuments.documentURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
                    >
                      View Document <ExternalLink size={16} />
                    </a>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-slate-500">No verification documents uploaded by this provider.</p>
                  </div>
                )}
              </div>

              {/* Ratings Overview */}
              <div className="border-t border-slate-100 pt-6 flex items-center gap-6">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-1">Average Rating</p>
                  <p className="font-black text-2xl text-amber-500 flex items-center gap-1">
                    {selectedDoctor.averageRating || 0} <Star size={20} className="fill-amber-500" />
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-1">Total Reviews</p>
                  <p className="font-bold text-xl text-slate-700">{selectedDoctor.totalReviews || 0}</p>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleVerification(selectedDoctor._id, 'Rejected')}
                disabled={updatingId === selectedDoctor._id || selectedDoctor.verificationStatus === 'Rejected'}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-6 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60"
              >
                <XCircle size={18} /> Reject Provider
              </button>
              <button
                type="button"
                onClick={() => handleVerification(selectedDoctor._id, 'Approved')}
                disabled={updatingId === selectedDoctor._id || selectedDoctor.verificationStatus === 'Approved'}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-lg shadow-emerald-600/20"
              >
                {updatingId === selectedDoctor._id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Approve Provider
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};

export default Providers;