import React from 'react';
import { AreaChart, BarChart3, Users } from 'lucide-react';

const Analytics = () => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Platform Analytics</h1>
      <p className="mt-1 text-slate-600">Monitor usage growth, conversion trends, and traffic quality.</p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <Users size={20} className="text-cyan-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">User Growth</h3>
          <p className="mt-1 text-sm text-slate-600">Track daily registrations and role-based adoption rates.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <BarChart3 size={20} className="text-emerald-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">Engagement</h3>
          <p className="mt-1 text-sm text-slate-600">Observe completed workflows for patient and doctor journeys.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <AreaChart size={20} className="text-violet-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">Operations</h3>
          <p className="mt-1 text-sm text-slate-600">Audit queue backlog and service response-time tendencies.</p>
        </article>
      </div>
    </section>
  );
};

export default Analytics;
