import React, { useEffect, useState } from 'react';
import { CalendarDays, HeartPulse, MessageSquare, Pill } from 'lucide-react';
import { getPatientDashboard } from '../../services/patient.service';

const fallbackMetrics = [
  { label: 'Upcoming Appointments', value: '2', icon: CalendarDays },
  { label: 'Unread Care Messages', value: '4', icon: MessageSquare },
  { label: 'Active Prescriptions', value: '3', icon: Pill },
  { label: 'Health Score', value: '92%', icon: HeartPulse },
];

const PatientDashboard = () => {
  const [metrics, setMetrics] = useState(fallbackMetrics);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await getPatientDashboard();
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
      <h1 className="text-3xl font-black text-slate-900">Patient Dashboard</h1>
      <p className="mt-2 text-slate-600">Track your care plan, appointments, and messages.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((card) => {
          const Icon = card.icon || HeartPulse;
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

export default PatientDashboard;
