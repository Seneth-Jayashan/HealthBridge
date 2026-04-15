import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Loader2, RefreshCcw, XCircle, Calendar, Clock, Video, MapPin, CircleDashed, Ban } from 'lucide-react';
import {
	doctorDecisionRequest,
	getDoctorAppointmentsRequest,
} from '../../../services/appointment.service';
import { getDoctorProfile } from '../../../services/doctor.service';

const statusStyles = {
	pending: 'bg-amber-50 text-amber-700 border-amber-200',
	accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	rejected: 'bg-slate-50 text-slate-600 border-slate-200',
	cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
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
			<div className="flex flex-col items-center justify-center min-h-[60vh]">
				<div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 mb-6 shadow-xl shadow-blue-200">
					<CalendarClock size={48} className="text-white animate-pulse" />
				</div>
				<h2 className="text-2xl font-bold text-slate-800">Loading requests</h2>
				<p className="mt-2 text-slate-500">Just a moment…</p>
				<div className="mt-6 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
					<div className="h-full w-2/3 bg-blue-500 rounded-full animate-pulse" />
				</div>
			</div>
		);
	}

	return (
		<section className="max-w-5xl mx-auto px-4 py-6 md:py-10">
			{/* Header */}
			<div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
						Appointment <span className="text-blue-600">Requests</span>
					</h1>
					<p className="text-slate-500 mt-2 text-lg">Review and respond to pending appointment requests</p>
				</div>
			</div>

			{/* Metrics & Actions */}
			<div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
				<span className="px-4 py-2.5 bg-amber-50 text-amber-700 text-sm font-bold rounded-full border border-amber-200 flex-shrink-0">
					Pending: {pendingCount}
				</span>
				<button
					onClick={() => loadAppointments(true)}
					disabled={refreshing || !doctorId}
					className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all disabled:opacity-50 text-sm"
				>
					<RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
					{refreshing ? 'Refreshing…' : 'Refresh'}
				</button>
			</div>

			{error && (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
					{error}
				</div>
			)}

			{actionError && (
				<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
					{actionError}
				</div>
			)}

			{!error && appointments.length === 0 && (
				<div className="mt-16 flex flex-col items-center justify-center text-center">
					<div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 mb-6 shadow-xl shadow-blue-200">
						<CalendarClock size={48} className="text-white" />
					</div>
					<h2 className="text-2xl font-bold text-slate-800">No pending requests</h2>
					<p className="mt-2 text-slate-500">New appointment requests will appear here when patients book.</p>
				</div>
			)}

			{appointments.length > 0 && (
				<div className="grid grid-cols-1 gap-5">
					{appointments.map((appt) => {
						const status = normalizeStatus(appt.status);
						const isPending = status === 'pending';
						const isActing = actingOn === appt._id;
						const patientName = appt.patientName || appt.patientID || 'Patient';

						return (
							<article
								key={appt._id}
								className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 shadow-lg shadow-blue-100/30 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-200 overflow-hidden"
							>
								{/* Top accent bar based on status */}
								<div
									className={`h-1.5 w-full ${
										status === 'accepted'
											? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
											: status === 'pending'
											? 'bg-gradient-to-r from-amber-500 to-amber-400'
											: status === 'rejected'
											? 'bg-gradient-to-r from-rose-500 to-rose-400'
											: 'bg-gradient-to-r from-slate-400 to-slate-300'
									}`}
								/>

								<div className="p-5">
									<div className="flex flex-col sm:flex-row sm:items-start gap-4">
										{/* Patient Avatar & Info */}
										<div className="flex items-start gap-4 flex-1">
											<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
												{patientName.charAt(0).toUpperCase()}
											</div>
											<div className="flex-1">
												<div className="flex flex-wrap items-start justify-between gap-2">
													<div>
														<h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
															{patientName}
															<span
																className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}
															>
																{status.charAt(0).toUpperCase() + status.slice(1)}
															</span>
														</h3>
														{appt.patientPhone && (
															<p className="text-slate-500 font-medium text-sm mt-0.5">{appt.patientPhone}</p>
														)}
													</div>
												</div>

												{/* Appointment Details */}
												<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
													<div className="flex items-center gap-3 text-sm">
														<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
															<Calendar size={16} className="text-blue-600" />
														</div>
														<div>
															<p className="text-xs text-slate-400">Day</p>
															<p className="font-medium text-slate-700">{appt.dayOfWeek || '—'}</p>
														</div>
													</div>
													<div className="flex items-center gap-3 text-sm">
														<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
															<Clock size={16} className="text-blue-600" />
														</div>
														<div>
															<p className="text-xs text-slate-400">Time</p>
															<p className="font-medium text-slate-700">
																{appt.startTime && appt.endTime
																	? `${appt.startTime} - ${appt.endTime}`
																	: '—'}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-3 text-sm">
														<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
															<Video size={16} className="text-blue-600" />
														</div>
														<div>
															<p className="text-xs text-slate-400">Mode</p>
															<p className="font-medium text-slate-700">Online</p>
														</div>
													</div>
													<div className="flex items-center gap-3 text-sm">
														<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
															<MapPin size={16} className="text-blue-600" />
														</div>
														<div>
															<p className="text-xs text-slate-400">Booked</p>
															<p className="font-medium text-slate-700 text-xs">{formatDateTime(appt.createdAt)}</p>
														</div>
													</div>
												</div>

												{/* Reason */}
												{appt.reason && (
													<div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
														<p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
															Reason for visit
														</p>
														<p className="text-sm text-slate-700">{appt.reason}</p>
													</div>
												)}
											</div>
										</div>
									</div>

									{/* Notes section */}
									{appt.notes && (
										<div className="mt-4 pt-4 border-t border-slate-200/80">
											<p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
												Additional Notes
											</p>
											<p className="text-sm text-slate-600">{appt.notes}</p>
										</div>
									)}

									{/* Decision Section for Pending Appointments */}
									{isPending && (
										<div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3">
											<label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
												Decision note <span className="text-slate-300">(optional)</span>
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
												placeholder="Add a short note for this decision..."
												className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
											/>

											<div className="flex flex-wrap gap-2 pt-2">
												<button
													onClick={() => handleDecision(appt._id, 'accept')}
													disabled={isActing}
													className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
												>
													<CheckCircle2 size={16} />
													{isActing ? 'Updating…' : 'Approve'}
												</button>

												<button
													onClick={() => handleDecision(appt._id, 'reject')}
													disabled={isActing}
													className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
												>
													<XCircle size={16} />
													{isActing ? 'Updating…' : 'Reject'}
												</button>
											</div>
										</div>
									)}

									{/* Completed Decision Info */}
									{!isPending && appt.doctorDecisionNote && (
										<div className="mt-4 pt-4 border-t border-slate-200/80">
											<p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
												Decision Note
											</p>
											<p className="text-sm text-slate-600">{appt.doctorDecisionNote}</p>
										</div>
									)}
								</div>
							</article>
						);
					})}
				</div>
			)}
		</section>
	);
};

export default AppointmentList;
