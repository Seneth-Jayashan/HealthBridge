import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Patient',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const getRedirectPath = (role) => {
    if (role === 'Admin') return '/admin/dashboard';
    if (role === 'Doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await register(form);
      navigate(getRedirectPath(user.role), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 p-6 md:p-10 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl shadow-slate-200/60">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-900 mb-6">
          <Activity size={20} className="text-blue-700" />
          <span className="text-xl font-black">HealthBridge</span>
        </Link>

        <h1 className="text-3xl font-black text-slate-900">Create Account</h1>
        <p className="text-slate-600 mt-2">Register to access your secure HealthBridge dashboard.</p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 bg-white"
            >
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-700 py-3.5 text-white font-bold hover:bg-blue-800 disabled:opacity-70 inline-flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Register;
