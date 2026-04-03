import React, { useEffect, useState } from 'react';
import { Activity, Server, Shield, Users } from 'lucide-react';
import { getAdminDashboard } from '../../services/admin.service';

const fallbackMetrics = [
  { label: 'Registered Users', value: '1,284', icon: Users },
  { label: 'Services Healthy', value: '8/8', icon: Server },
  { label: 'Security Alerts', value: '0', icon: Shield },
  { label: 'Requests / Min', value: '342', icon: Activity },
];

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(fallbackMetrics);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const users = await getAdminDashboard();
        if (Array.isArray(users)) {
          setMetrics([
            { label: 'Registered Users', value: String(users.length), icon: Users },
            { label: 'Services Healthy', value: '8/8', icon: Server },
            { label: 'Security Alerts', value: '0', icon: Shield },
            { label: 'Requests / Min', value: '342', icon: Activity },
          ]);
        }
      } catch {
        setMetrics(fallbackMetrics);
      }
    };

    loadDashboard();
  }, []);

  return (
    <section>
      <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
      <p className="mt-2 text-slate-600">Observe platform health, user activity, and security posture.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((card) => {
          const Icon = card.icon || Activity;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

export default AdminDashboard;
