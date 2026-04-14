import React from 'react';
import { CreditCard, FileText, Wallet } from 'lucide-react';

const Billing = () => {
  const cards = [
    { label: 'Pending Settlements', value: 'LKR 0.00', icon: Wallet },
    { label: 'Processed Invoices', value: '0', icon: FileText },
    { label: 'Payment Gateway Status', value: 'Online', icon: CreditCard },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Admin Panel</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">Financial & Billing</h1>
      <p className="mt-1 text-slate-600">Track payment health and finance pipeline status.</p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Icon size={20} className="text-blue-700" />
              <p className="mt-3 text-2xl font-black text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{card.label}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Billing;
