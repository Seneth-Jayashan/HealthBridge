import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import {
	Bell,
	CalendarCheck2,
	ClipboardList,
	CreditCard,
	FileHeart,
	Loader2,
	Sparkles,
	Stethoscope,
	Video,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { getMyAppointmentsRequest } from '../../services/appointment.service';
import { getNotifications } from '../../services/notification.service';
import { getPatientProfile } from '../../services/patient.service';
import { getMyPayments } from '../../services/payment.service';
import { getPatientOnlineAppointments } from '../../services/telemedicine.service';

const statusClassMap = {
	pending: 'bg-amber-100 text-amber-700',
	accepted: 'bg-emerald-100 text-emerald-700',
	cancelled: 'bg-rose-100 text-rose-700',
	completed: 'bg-blue-100 text-blue-700',
	rejected: 'bg-slate-200 text-slate-700',
};

const normalizeList = (value) => (Array.isArray(value) ? value : []);

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const formatDate = (value) => {
	if (!value) return 'Date not available';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return 'Date not available';

	return parsed.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const formatMoney = (amount, currency = 'LKR') => {
	const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(safeAmount);
};

const greetingByHour = (date = new Date()) => {
	const hour = date.getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
};

const getDoctorName = (appointment) => {
	const name =
		appointment?.doctor?.userId?.name ||
		appointment?.doctor?.user?.name ||
		appointment?.doctor?.name ||
		appointment?.doctorId?.userId?.name ||
		appointment?.doctorId?.name;

	return name ? `Dr. ${name}` : 'Doctor';
};

const PatientDashboard = () => {
	const { isDark = false } = useOutletContext() || {};
	const { user } = useAuth();
	const [now, setNow] = useState(() => new Date());

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');

	const [profile, setProfile] = useState(null);
	const [appointments, setAppointments] = useState([]);
	const [payments, setPayments] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [onlineAppointments, setOnlineAppointments] = useState([]);

	const loadDashboard = async () => {
		setIsLoading(true);
		setError('');

		const [
			profileResult,
			appointmentResult,
			paymentResult,
			notificationResult,
			onlineAppointmentResult,
		] = await Promise.allSettled([
			getPatientProfile(),
			getMyAppointmentsRequest(),
			getMyPayments(),
			getNotifications(),
			getPatientOnlineAppointments(),
		]);

		if (profileResult.status === 'fulfilled') {
			setProfile(profileResult.value || null);
		}

		if (appointmentResult.status === 'fulfilled') {
			setAppointments(normalizeList(appointmentResult.value));
		}

		if (paymentResult.status === 'fulfilled') {
			setPayments(normalizeList(paymentResult.value));
		}

		if (notificationResult.status === 'fulfilled') {
			setNotifications(normalizeList(notificationResult.value));
		}

		if (onlineAppointmentResult.status === 'fulfilled') {
			setOnlineAppointments(normalizeList(onlineAppointmentResult.value));
		}

		const hasCriticalFailure =
			profileResult.status === 'rejected' &&
			appointmentResult.status === 'rejected' &&
			paymentResult.status === 'rejected';

		if (hasCriticalFailure) {
			setError('We could not load your dashboard right now. Please try again.');
		}

		setIsLoading(false);
	};

	useEffect(() => {
		loadDashboard();
	}, []);

	useEffect(() => {
		const tick = () => setNow(new Date());
		const intervalId = window.setInterval(tick, 30000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, []);

	useEffect(() => {
		if (!isLoading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			animate('.hb-patient-dash-item', {
				y: [20, 0],
				opacity: [0, 1],
				ease: 'outCubic',
				duration: 700,
				delay: stagger(80),
			});
		}
	}, [isLoading]);

	const upcomingAppointments = useMemo(
		() => appointments.filter((item) => {
			const status = normalizeStatus(item?.status);
			return status === 'pending' || status === 'accepted';
		}),
		[appointments],
	);

	const completedAppointments = useMemo(
		() => appointments.filter((item) => normalizeStatus(item?.status) === 'completed'),
		[appointments],
	);

	const unreadNotifications = useMemo(
		() => notifications.filter((item) => !item?.isRead),
		[notifications],
	);

	const pendingPayments = useMemo(
		() => payments.filter((item) => normalizeStatus(item?.status) === 'pending'),
		[payments],
	);

	const latestPayments = useMemo(() => {
		return [...payments]
			.sort((a, b) => {
				const aDate = new Date(a?.createdAt || a?.paymentDate || 0).getTime();
				const bDate = new Date(b?.createdAt || b?.paymentDate || 0).getTime();
				return bDate - aDate;
			})
			.slice(0, 4);
	}, [payments]);

	const latestNotifications = useMemo(() => {
		return [...notifications]
			.sort((a, b) => {
				const aDate = new Date(a?.createdAt || 0).getTime();
				const bDate = new Date(b?.createdAt || 0).getTime();
				return bDate - aDate;
			})
			.slice(0, 5);
	}, [notifications]);

	if (isLoading) {
		return (
			<div className={`min-h-[60vh] flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
				<Loader2 className="animate-spin text-blue-600" size={32} />
				<p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Preparing your health dashboard...</p>
			</div>
		);
	}

	return (
		<section className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
			<div className="max-w-7xl mx-auto space-y-7">

				<div className={`hb-patient-dash-item opacity-0 p-6 md:p-8 rounded-3xl border shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
					<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<p className={`text-xs font-black uppercase tracking-[0.18em] ${isDark ? 'text-cyan-300/70' : 'text-cyan-700'}`}>
								{greetingByHour(now)}
							</p>
							<h1 className={`mt-2 text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
								{user?.name ? user.name : 'Patient'}
							</h1>
							<p className={`mt-2 max-w-2xl font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
								Keep your care plan organized. Track appointments, payments, reports, and online visits from one place.
							</p>
						</div>

						<div className="flex flex-wrap gap-3">
							<Link
								to="/patient/appointment/book"
								className="px-5 py-3 rounded-xl font-bold bg-blue-700 text-white hover:bg-blue-800 transition-colors"
							>
								Book Appointment
							</Link>
							<Link
								to="/patient/telehealth"
								className={`px-5 py-3 rounded-xl font-bold border transition-colors ${isDark ? 'border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
							>
								Open Telehealth
							</Link>
						</div>
					</div>
				</div>

				{error && (
					<div className="hb-patient-dash-item opacity-0 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
						{error}
					</div>
				)}

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<article className={`hb-patient-dash-item opacity-0 rounded-3xl border p-5 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<div className="flex items-center justify-between">
							<div>
								<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Upcoming Appointments</p>
								<p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{upcomingAppointments.length}</p>
							</div>
							<div className={`rounded-2xl p-3 ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
								<CalendarCheck2 size={23} strokeWidth={2.5} />
							</div>
						</div>
					</article>

					<article className={`hb-patient-dash-item opacity-0 rounded-3xl border p-5 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<div className="flex items-center justify-between">
							<div>
								<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Medical Reports</p>
								<p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{normalizeList(profile?.medicalReports).length}</p>
							</div>
							<div className={`rounded-2xl p-3 ${isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
								<FileHeart size={23} strokeWidth={2.5} />
							</div>
						</div>
					</article>

					<article className={`hb-patient-dash-item opacity-0 rounded-3xl border p-5 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<div className="flex items-center justify-between">
							<div>
								<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Unread Notifications</p>
								<p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{unreadNotifications.length}</p>
							</div>
							<div className={`rounded-2xl p-3 ${isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
								<Bell size={23} strokeWidth={2.5} />
							</div>
						</div>
					</article>

					<article className={`hb-patient-dash-item opacity-0 rounded-3xl border p-5 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<div className="flex items-center justify-between">
							<div>
								<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Pending Payments</p>
								<p className={`mt-2 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{pendingPayments.length}</p>
							</div>
							<div className={`rounded-2xl p-3 ${isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>
								<CreditCard size={23} strokeWidth={2.5} />
							</div>
						</div>
					</article>
				</div>

				<div className="grid gap-6 xl:grid-cols-3">
					<div className={`hb-patient-dash-item opacity-0 xl:col-span-2 rounded-3xl border p-6 md:p-7 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<div className="flex items-center justify-between gap-3">
							<div>
								<h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Upcoming Visits</h2>
								<p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Your next consultations and current request statuses.</p>
							</div>
							<Link
								to="/patient/appointment/my"
								className={`text-sm font-bold ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'}`}
							>
								Manage all
							</Link>
						</div>

						<div className="mt-5 space-y-3">
							{upcomingAppointments.length === 0 ? (
								<div className={`rounded-2xl border-2 border-dashed p-8 text-center ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
									<ClipboardList size={42} className={`mx-auto ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
									<h3 className={`mt-3 text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No upcoming appointments</h3>
									<p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Book a new consultation and it will appear here instantly.</p>
								</div>
							) : (
								upcomingAppointments.slice(0, 4).map((appointment) => {
									const status = normalizeStatus(appointment?.status);
									return (
										<article
											key={appointment?._id || `${appointment?.doctorId}-${appointment?.startTime}`}
											className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{getDoctorName(appointment)}</p>
													<p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
														{appointment?.dayOfWeek || 'Day pending'} | {appointment?.startTime || '--:--'} - {appointment?.endTime || '--:--'}
													</p>
												</div>
												<span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClassMap[status] || statusClassMap.rejected}`}>
													{status || 'unknown'}
												</span>
											</div>
											{appointment?.reason && (
												<p className={`mt-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{appointment.reason}</p>
											)}
										</article>
									);
								})
							)}
						</div>
					</div>

					<div className={`hb-patient-dash-item opacity-0 rounded-3xl border p-6 md:p-7 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Care Snapshot</h2>

						<div className={`mt-5 rounded-2xl p-4 border ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}>
							<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Profile completion</p>
							<p className={`mt-2 text-sm font-bold ${profile?.isUpdated ? 'text-emerald-500' : 'text-amber-500'}`}>
								{profile?.isUpdated ? 'Completed' : 'Incomplete'}
							</p>
						</div>

						<div className={`mt-3 rounded-2xl p-4 border ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}>
							<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Blood group</p>
							<p className={`mt-2 text-lg font-black ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>{profile?.bloodGroup || 'Not set'}</p>
						</div>

						<div className={`mt-3 rounded-2xl p-4 border ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}>
							<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Completed visits</p>
							<p className={`mt-2 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{completedAppointments.length}</p>
						</div>

						<div className={`mt-3 rounded-2xl p-4 border ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}>
							<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Online consultations</p>
							<p className={`mt-2 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{onlineAppointments.length}</p>
						</div>

						<Link
							to="/patient/profile"
							className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
						>
							Update profile details
						</Link>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div className={`hb-patient-dash-item opacity-0 rounded-3xl border p-6 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Sparkles size={18} className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
								<h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Notifications</h2>
							</div>
							<Link
								to="/patient/telehealth"
								className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'}`}
							>
								View services
							</Link>
						</div>

						<div className="mt-4 space-y-3">
							{latestNotifications.length === 0 ? (
								<p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No notifications yet.</p>
							) : (
								latestNotifications.map((item) => (
									<div
										key={item?._id || `${item?.type}-${item?.createdAt}`}
										className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}
									>
										<div className="flex items-center justify-between gap-3">
											<p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
												{item?.type || 'Notification'}
											</p>
											{!item?.isRead && (
												<span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">New</span>
											)}
										</div>
										<p className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item?.message || 'No message'}</p>
										<p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{formatDate(item?.createdAt)}</p>
									</div>
								))
							)}
						</div>
					</div>

					<div className={`hb-patient-dash-item opacity-0 rounded-3xl border p-6 shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Stethoscope size={18} className={isDark ? 'text-cyan-300' : 'text-cyan-700'} />
								<h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Latest Payments</h2>
							</div>
							<Link
								to="/patient/payments"
								className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'}`}
							>
								Open history
							</Link>
						</div>

						<div className="mt-4 space-y-3">
							{latestPayments.length === 0 ? (
								<p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No payments recorded yet.</p>
							) : (
								latestPayments.map((payment) => (
									<div
										key={payment?._id || payment?.orderId}
										className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}
									>
										<div className="flex flex-wrap items-center justify-between gap-2">
											<p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{payment?.orderId || 'Order'}</p>
											<span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClassMap[normalizeStatus(payment?.status)] || statusClassMap.rejected}`}>
												{normalizeStatus(payment?.status) || 'unknown'}
											</span>
										</div>
										<p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
											{formatMoney(payment?.amount, payment?.payhere_currency || 'LKR')}
										</p>
										<p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
											{formatDate(payment?.paymentDate || payment?.createdAt)}
										</p>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-3">
					<Link
						to="/patient/reports"
						className={`hb-patient-dash-item opacity-0 rounded-2xl border p-4 font-bold transition-colors ${isDark ? 'bg-[#131C31] border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'}`}
					>
						<div className="flex items-center gap-2">
							<FileHeart size={18} />
							Medical Reports
						</div>
					</Link>

					<Link
						to="/patient/prescriptions"
						className={`hb-patient-dash-item opacity-0 rounded-2xl border p-4 font-bold transition-colors ${isDark ? 'bg-[#131C31] border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'}`}
					>
						<div className="flex items-center gap-2">
							<ClipboardList size={18} />
							Prescriptions
						</div>
					</Link>

					<Link
						to="/patient/telehealth"
						className={`hb-patient-dash-item opacity-0 rounded-2xl border p-4 font-bold transition-colors ${isDark ? 'bg-[#131C31] border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'}`}
					>
						<div className="flex items-center gap-2">
							<Video size={18} />
							Telehealth
						</div>
					</Link>
				</div>
			</div>
		</section>
	);
};

export default PatientDashboard;
