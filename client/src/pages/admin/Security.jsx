import React from 'react';
import { Lock, Shield, UserCheck } from 'lucide-react';

const Security = () => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Security Audits</h1>
      <p className="mt-1 text-slate-600">Review access controls and authentication safety checks.</p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <Shield size={20} className="text-blue-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">Role Enforcement</h3>
          <p className="mt-1 text-sm text-slate-600">Admin, Doctor, and Patient route guards are active and scoped.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <Lock size={20} className="text-amber-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">Token Security</h3>
          <p className="mt-1 text-sm text-slate-600">JWT validation and user-context forwarding are enforced by gateway.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <UserCheck size={20} className="text-emerald-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">Verification Controls</h3>
          <p className="mt-1 text-sm text-slate-600">Doctor verification workflow and admin review rules are in place.</p>
        </article>
      </div>
    </section>
  );
};

export default Security;
