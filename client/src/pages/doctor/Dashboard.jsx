import React, { useEffect, useState } from 'react';
import { CalendarCheck2, Clock3, FileCheck2, UsersRound } from 'lucide-react';
import { getDoctorDashboard } from '../../services/doctor.service';

const fallbackMetrics = [
  { label: 'Today Consultations', value: '11', icon: CalendarCheck2 },
  { label: 'Waiting Patients', value: '3', icon: UsersRound },
  { label: 'Pending Notes', value: '5', icon: FileCheck2 },
  { label: 'Average Wait Time', value: '8m', icon: Clock3 },
];

const DoctorDashboard = () => {
  const [metrics, setMetrics] = useState(fallbackMetrics);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getDoctorDashboard();
        if (Array.isArray(response?.metrics) && response.metrics.length > 0) {
          setMetrics(response.metrics);
        }
      } catch {
        setMetrics(fallbackMetrics);
      }
    };

    loadDashboard();
  }, []);

  return (
    <section>
      <h1 className="text-3xl font-black text-slate-900">Doctor Dashboard</h1>
      <p className="mt-2 text-slate-600">Manage consultations, queues, and patient care workflows.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((card) => {
          const Icon = card.icon || CalendarCheck2;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon size={20} className="text-red-600" />
              <p className="mt-3 text-2xl font-black text-slate-900">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{card.label}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default DoctorDashboard;
