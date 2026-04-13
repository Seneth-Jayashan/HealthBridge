import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Users } from 'lucide-react';
import { getPlatformUsers } from '../../services/admin.service';

const Patients = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const result = await getPlatformUsers();
        setUsers(Array.isArray(result) ? result : []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load users.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const patients = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users
      .filter((user) => user.role === 'Patient')
      .filter((patient) => {
        if (!keyword) return true;
        return [patient.name, patient.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [users, search]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Patient Directory</h1>
          <p className="mt-1 text-slate-600">View all registered patient accounts from the auth domain.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
          Total Patients: {patients.length}
        </div>
      </div>

      <div className="mt-6">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Search Patients</span>
          <div className="flex items-center rounded-xl border border-slate-300 px-3">
            <Search size={18} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by patient name or email"
              className="w-full bg-transparent px-3 py-3 text-sm outline-none"
            />
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Phone</th>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading patient directory...
                  </span>
                </td>
              </tr>
            )}

            {!loading && patients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Users size={16} />
                    No matching patients found.
                  </span>
                </td>
              </tr>
            )}

            {!loading && patients.map((patient) => (
              <tr key={patient._id}>
                <td className="px-4 py-3 font-semibold text-slate-900">{patient.name || 'N/A'}</td>
                <td className="px-4 py-3 text-slate-700">{patient.email || 'N/A'}</td>
                <td className="px-4 py-3 text-slate-700">{patient.phoneNumber || '-'}</td>
                <td className="px-4 py-3 text-slate-700">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Patients;
