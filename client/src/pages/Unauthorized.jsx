import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-slate-50">
      <div className="w-full max-w-xl text-center rounded-3xl bg-white border border-slate-200 shadow-lg p-10">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <ShieldAlert size={30} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Unauthorized Access</h1>
        <p className="mt-3 text-slate-600 font-medium">
          Your account does not have permission to view this page.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Back to Home
          </Link>
          <Link to="/login" className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            Go to Login
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Unauthorized;
