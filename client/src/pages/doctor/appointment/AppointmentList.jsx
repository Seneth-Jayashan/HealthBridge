import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Loader2, RefreshCcw, XCircle } from 'lucide-react';
import {
	doctorDecisionRequest,
	getDoctorAppointmentsRequest,
} from '../../../services/appointment.service';
import { getDoctorProfile } from '../../../services/doctor.service';

const statusBadgeClass = {
	pending: 'bg-amber-100 text-amber-700 border-amber-200',
	accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
	rejected: 'bg-rose-100 text-rose-700 border-rose-200',
	cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const normalizeStatus = (value) => String(value || '').toLowerCase();

const formatDateTime = (value) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const AppointmentList = () => {
	const [doctorId, setDoctorId] = useState('');
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState('');
	const [actionError, setActionError] = useState('');
	const [actingOn, setActingOn] = useState('');
	const [noteById, setNoteById] = useState({});

	const loadAppointments = async (isRefresh = false) => {
		if (!doctorId) return;
		if (isRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}

		setError('');
		setActionError('');

		try {
			const list = await getDoctorAppointmentsRequest(doctorId);
			setAppointments(Array.isArray(list) ? list : []);
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to load appointments.');
			setAppointments([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		const init = async () => {
			setLoading(true);
			setError('');
			try {
				const profile = await getDoctorProfile();
				if (!profile?._id) {
					throw new Error('Doctor profile not found. Complete profile setup first.');
				}
				setDoctorId(String(profile._id));
			} catch (err) {
				setError(err?.response?.data?.message || err?.message || 'Failed to load doctor profile.');
				setLoading(false);
			}
		};

		init();
	}, []);

	useEffect(() => {
		if (doctorId) loadAppointments(false);
	}, [doctorId]);

	const pendingCount = useMemo(
		() => appointments.filter((appt) => normalizeStatus(appt.status) === 'pending').length,
		[appointments]
	);

	const handleDecision = async (appointmentId, decision) => {
		if (!doctorId) return;
		setActionError('');
		setActingOn(appointmentId);

		try {
			await doctorDecisionRequest(appointmentId, {
				decision,
				doctorId,
				note: noteById[appointmentId] || '',
			});

			setAppointments((prev) =>
				prev.map((appt) =>
					appt._id === appointmentId
						? {
								...appt,
								status: decision === 'accept' ? 'Accepted' : 'Rejected',
								doctorDecisionNote: noteById[appointmentId] || appt.doctorDecisionNote,
								decidedAt: new Date().toISOString(),
							}
						: appt
				)
			);
		} catch (err) {
			setActionError(err?.response?.data?.message || err?.message || 'Failed to update appointment status.');
		} finally {
			setActingOn('');
		}
	};

	if (loading) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
				<Loader2 className="animate-spin text-blue-600" size={32} />
				<p className="text-slate-500">Loading appointments...</p>
			</div>
		);
	}

	return (
		<section className="max-w-6xl mx-auto p-6 md:p-10 space-y-6">
			<div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-3xl font-black text-slate-900">Appointment Requests</h1>
						<p className="mt-1 text-slate-600">
							Review and decide pending appointment requests from patients.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 border border-amber-200">
							Pending: {pendingCount}
						</span>
						<button
							onClick={() => loadAppointments(true)}
							disabled={refreshing || !doctorId}
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
						>
							<RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
							Refresh
						</button>
					</div>
				</div>
			</div>

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
					{error}
				</div>
			)}

			{actionError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
					{actionError}
				</div>
			)}

			{!error && appointments.length === 0 && (
				<div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
					<CalendarClock className="mx-auto text-slate-300" size={44} />
					<h2 className="mt-4 text-xl font-bold text-slate-800">No appointments found</h2>
					<p className="mt-2 text-slate-500">New requests will appear here as soon as patients book them.</p>
				</div>
			)}

			{appointments.length > 0 && (
				<div className="grid gap-4">
					{appointments.map((appt) => {
						const status = normalizeStatus(appt.status);
						const isPending = status === 'pending';
						const isActing = actingOn === appt._id;

						return (
							<article key={appt._id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="space-y-1">
										<p className="text-lg font-black text-slate-900">
											{appt.patientName || 'Patient'}
										</p>
										<p className="text-sm text-slate-600">
											{appt.dayOfWeek || 'N/A'} • {appt.startTime || '--:--'} - {appt.endTime || '--:--'}
										</p>
										<p className="text-xs text-slate-500">Booked: {formatDateTime(appt.createdAt)}</p>
										{appt.patientPhone && (
											<p className="text-xs text-slate-500">Phone: {appt.patientPhone}</p>
										)}
									</div>

									<span
										className={`inline-flex h-fit items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${
											statusBadgeClass[status] || 'bg-slate-100 text-slate-700 border-slate-200'
										}`}
									>
										{status || 'unknown'}
									</span>
								</div>

								{(appt.reason || appt.notes) && (
									<div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
										{appt.reason && <p><span className="font-bold">Reason:</span> {appt.reason}</p>}
										{appt.notes && <p className="mt-1"><span className="font-bold">Notes:</span> {appt.notes}</p>}
									</div>
								)}

								{isPending && (
									<div className="mt-4 space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
										<label className="block text-xs font-bold uppercase tracking-wide text-blue-700">
											Decision note (optional)
										</label>
										<textarea
											value={noteById[appt._id] || ''}
											onChange={(e) =>
												setNoteById((prev) => ({
													...prev,
													[appt._id]: e.target.value,
												}))
											}
											rows={2}
											placeholder="Add a short note for this decision"
											className="w-full resize-none rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>

										<div className="flex flex-wrap gap-2">
											<button
												onClick={() => handleDecision(appt._id, 'accept')}
												disabled={isActing}
												className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
											>
												<CheckCircle2 size={16} />
												{isActing ? 'Updating...' : 'Approve'}
											</button>

											<button
												onClick={() => handleDecision(appt._id, 'reject')}
												disabled={isActing}
												className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
											>
												<XCircle size={16} />
												{isActing ? 'Updating...' : 'Reject'}
											</button>
										</div>
									</div>
								)}

								{!isPending && appt.doctorDecisionNote && (
									<p className="mt-3 text-sm text-slate-600">
										<span className="font-bold">Decision note:</span> {appt.doctorDecisionNote}
									</p>
								)}
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
};

export default AppointmentList;
