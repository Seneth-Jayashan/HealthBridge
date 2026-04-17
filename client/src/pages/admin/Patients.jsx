import React, { useEffect, useMemo, useState } from 'react';
import { 
  Loader2, 
  Search, 
  Users, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react';
import { 
  getPlatformUsers, 
  updatePlatformUser, 
  deletePlatformUser 
} from '../../services/admin.service';

const Patients = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal & Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phoneNumber: '' });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getPlatformUsers();
      setUsers(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const patients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users
      .filter((user) => user.role === 'Patient')
      .filter((patient) => {
        if (!keyword) return true;
        return [patient.name, patient.email, patient.phoneNumber]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [users, search]);

  // --- Action Handlers ---

  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setEditForm({
      name: patient.name || '',
      phoneNumber: patient.phoneNumber || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await updatePlatformUser(selectedPatient._id, editForm);
      setSuccess(`${editForm.name}'s profile has been updated successfully.`);
      setIsEditModalOpen(false);
      await loadUsers(); // Refresh table
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update patient.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (patientId, patientName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete the account for ${patientName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await deletePlatformUser(patientId);
      setSuccess(`${patientName}'s account was successfully deleted.`);
      await loadUsers(); // Refresh table
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete patient account.');
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Patient Management</h1>
          <p className="mt-1 text-slate-600">Modify, update, or remove registered patient accounts.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          Total Patients: {patients.length}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-8">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Search Directory</span>
          <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 transition-colors focus-within:border-blue-600 shadow-sm">
            <Search size={18} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by patient name, email, or phone..."
              className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>
        </label>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      {/* Data Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Patient Details</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Contact Info</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Registered On</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Loader2 size={18} className="animate-spin text-blue-600" />
                    Loading patient records...
                  </span>
                </td>
              </tr>
            )}

            {!loading && patients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Users size={18} />
                    No matching patients found.
                  </span>
                </td>
              </tr>
            )}

            {!loading && patients.map((patient) => (
              <tr key={patient._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-900">{patient.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">ID: {patient._id.substring(0, 8)}...</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1 text-slate-700">
                    <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400"/> {patient.email || 'N/A'}</span>
                    <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {patient.phoneNumber || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-700 font-medium">
                  {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(patient)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors shadow-sm"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(patient._id, patient.name)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-black text-slate-900">Modify Patient</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6">
              <div className="space-y-4">
                
                {/* Read-only Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-500">Email Address (Read Only)</label>
                  <input
                    type="email"
                    value={selectedPatient.email}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>

                {/* Editable Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Editable Phone */}
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default Patients;