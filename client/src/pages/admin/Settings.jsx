import React from 'react';
import { Bell, Globe, Save, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Global Settings</h1>
      <p className="mt-1 text-slate-600">Control platform defaults for communications, localization, and operations.</p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 p-5">
          <Bell size={20} className="text-blue-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">Notifications</h3>
          <p className="mt-1 text-sm text-slate-600">Manage default channel priorities and delivery behavior.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 p-5">
          <Globe size={20} className="text-cyan-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">Localization</h3>
          <p className="mt-1 text-sm text-slate-600">Configure timezone, region, and locale formatting preferences.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 p-5">
          <SettingsIcon size={20} className="text-violet-700" />
          <h3 className="mt-3 text-lg font-black text-slate-900">System Defaults</h3>
          <p className="mt-1 text-sm text-slate-600">Tune operational thresholds and platform-wide fallback values.</p>
        </article>
      </div>

      <div className="mt-8">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800"
        >
          <Save size={16} />
          Save Configuration
        </button>
      </div>
    </section>
  );
};

export default Settings;
