// import React, { useEffect, useState } from 'react';
// import { Calendar, MapPin, Clock, Phone, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
// import { getDoctorOnlineAppointmentsRequest, updateAppointmentStatusRequest } from '../../services/appointment.service';
// import { getOnlineAppointmentsWithSessions, updateSessionStatus, createTelemedicineSession } from '../../services/telemedicine.service';

// const DoctorAppointmentList = ({ onStartSession }) => {
//   const [appointments, setAppointments] = useState([]);
//   const [sessions, setSessions] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [updating, setUpdating] = useState(null);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');

//   const loadAppointments = async () => {
//     setLoading(true);
//     setError('');
    
//     try {
//       const [appts, sess] = await Promise.all([
//         getDoctorOnlineAppointmentsRequest(),
//         getOnlineAppointmentsWithSessions()
//       ]);
      
//       setAppointments(Array.isArray(appts) ? appts : []);
      
//       // Create a map of sessions by appointmentId
//       const sessionMap = {};
//       if (Array.isArray(sess)) {
//         sess.forEach(s => {
//           if (s.appointmentId) {
//             sessionMap[s.appointmentId] = s;
//           }
//         });
//       }
//       setSessions(sessionMap);
//     } catch (err) {
//       setError(err?.response?.data?.message || 'Failed to load appointments');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadAppointments();
//     // Refresh every 30 seconds
//     const interval = setInterval(loadAppointments, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleStatusUpdate = async (appointmentId, newStatus) => {
//     setUpdating(appointmentId);
//     setError('');
    
//     try {
//       const appointment = appointments.find(a => a._id === appointmentId);
//       const session = sessions[appointmentId];
      
//       // Update appointment status
//       await updateAppointmentStatusRequest(appointmentId, newStatus);
      
//       // Update video session status if it exists
//       if (session) {
//         const sessionStatus = newStatus === 'confirmed' ? 'scheduled' : 
//                              newStatus === 'completed' ? 'completed' : 'cancelled';
//         await updateSessionStatus(session._id, sessionStatus);
//       }
      
//       setMessage(`Appointment ${newStatus} successfully`);
//       setTimeout(() => {
//         setMessage('');
//         loadAppointments();
//       }, 2000);
//     } catch (err) {
//       setError(err?.response?.data?.message || 'Failed to update appointment');
//     } finally {
//       setUpdating(null);
//     }
//   };

//   const handleStartCall = async (appointmentId) => {
//     setUpdating(appointmentId);
//     setError('');
    
//     try {
//       const appointment = appointments.find(a => a._id === appointmentId);
//       let session = sessions[appointmentId];
      
//       // Create a new video session if one doesn't exist
//       if (!session) {
//         const createdSession = await createTelemedicineSession({
//           appointmentId,
//           patientId: appointment.patientId,
//           scheduledAt: appointment.appointmentDate,
//           metadata: {
//             specialty: appointment.specialty,
//             reason: appointment.reason,
//             timeSlot: appointment.timeSlot
//           }
//         });
//         session = createdSession;
//       }
      
//       // Call parent callback to switch tab and select session
//       if (onStartSession) {
//         onStartSession(session._id);
//       }
      
//       setMessage('Starting video session...');
//     } catch (err) {
//       setError(err?.response?.data?.message || 'Failed to start video call');
//     } finally {
//       setUpdating(null);
//     }
//   };

//   const getStatusBadge = (status) => {
//     const badges = {
//       pending: { icon: AlertCircle, color: 'amber', text: '⏳ Pending', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-200', textColor: 'text-amber-700' },
//       confirmed: { icon: CheckCircle, color: 'emerald', text: '✅ Confirmed', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-200', textColor: 'text-emerald-700' },
//       completed: { icon: CheckCircle, color: 'blue', text: '✅ Completed', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
//       rejected: { icon: XCircle, color: 'red', text: '❌ Rejected', bgColor: 'bg-red-500/10', borderColor: 'border-red-200', textColor: 'text-red-700' },
//       cancelled: { icon: XCircle, color: 'red', text: '❌ Cancelled', bgColor: 'bg-red-500/10', borderColor: 'border-red-200', textColor: 'text-red-700' }
//     };
//     return badges[status] || badges.pending;
//   };

//   const getSessionStatusColor = (sessionStatus) => {
//     const colors = {
//       scheduled: 'bg-blue-500/10 border-blue-200 text-blue-700',
//       active: 'bg-green-500/10 border-green-200 text-green-700',
//       completed: 'bg-gray-500/10 border-gray-200 text-gray-700',
//       cancelled: 'bg-red-500/10 border-red-200 text-red-700'
//     };
//     return colors[sessionStatus] || colors.scheduled;
//   };

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-12">
//         <Loader className="animate-spin text-teal-600 mb-4" size={32} />
//         <p className="text-slate-600 font-medium">Loading appointments...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {error && (
//         <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
//           ❌ {error}
//         </div>
//       )}
      
//       {message && (
//         <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
//           ✅ {message}
//         </div>
//       )}

//       {appointments.length === 0 ? (
//         <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
//           <Phone size={32} className="mx-auto mb-3 text-slate-400" />
//           <p className="text-slate-600 font-bold">No online appointments</p>
//           <p className="text-sm text-slate-500 mt-1">Online appointments will appear here</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {appointments.map((appointment) => {
//             const session = sessions[appointment._id];
//             const statusBadge = getStatusBadge(appointment.status);
//             const appointmentDate = new Date(appointment.appointmentDate);
//             const isUpcoming = appointmentDate > new Date();
            
//             return (
//               <div
//                 key={appointment._id}
//                 className="rounded-xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5 hover:border-white/20 transition-all duration-200"
//               >
//                 <div className="flex flex-col gap-4">
//                   {/* Header */}
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="flex-1">
//                       <h3 className="font-bold text-slate-900">
//                         👨‍⚕️ Consultation - {appointment.specialty}
//                       </h3>
//                       <p className="text-xs text-slate-500 mt-1">
//                         Patient: {appointment.patientId}
//                       </p>
//                     </div>
//                     <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${getSessionStatusColor(session?.status || 'scheduled')}`}>
//                       {session?.status || 'scheduled'}
//                     </div>
//                   </div>

//                   {/* Details */}
//                   <div className="space-y-2 text-sm">
//                     <div className="flex items-center gap-2 text-slate-600">
//                       <Calendar size={14} className="text-teal-600" />
//                       <span>{appointmentDate.toLocaleDateString()}</span>
//                     </div>
//                     <div className="flex items-center gap-2 text-slate-600">
//                       <Clock size={14} className="text-teal-600" />
//                       <span>{appointment.timeSlot}</span>
//                     </div>
//                     {appointment.reason && (
//                       <div className="flex gap-2 text-slate-600">
//                         <span className="text-xs font-medium">Reason:</span>
//                         <span className="text-xs">{appointment.reason}</span>
//                       </div>
//                     )}
//                   </div>

//                   {/* Status Badge */}
//                   <div>
//                     <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-bold text-sm ${statusBadge.bgColor} ${statusBadge.borderColor} ${statusBadge.textColor}`}>
//                       {statusBadge.icon === CheckCircle && <CheckCircle size={14} />}
//                       {statusBadge.icon === AlertCircle && <AlertCircle size={14} />}
//                       {statusBadge.icon === XCircle && <XCircle size={14} />}
//                       <span>{statusBadge.text}</span>
//                     </div>
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="flex flex-wrap gap-2 pt-2">
//                     {appointment.status === 'pending' && (
//                       <>
//                         <button
//                           onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
//                           disabled={updating === appointment._id}
//                           className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 transition-all"
//                         >
//                           {updating === appointment._id ? (
//                             <Loader size={16} className="animate-spin" />
//                           ) : (
//                             <CheckCircle size={16} />
//                           )}
//                           Confirm
//                         </button>
//                         <button
//                           onClick={() => handleStatusUpdate(appointment._id, 'rejected')}
//                           disabled={updating === appointment._id}
//                           className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 transition-all"
//                           >
//                           {updating === appointment._id ? (
//                             <Loader size={16} className="animate-spin" />
//                           ) : (
//                             <XCircle size={16} />
//                           )}
//                           Reject
//                         </button>
//                       </>
//                     )}
                    
//                     {appointment.status === 'confirmed' && isUpcoming && (
//                       <button
//                         onClick={() => handleStartCall(appointment._id)}
//                         disabled={updating === appointment._id}
//                         className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all"
//                       >
//                         {updating === appointment._id ? (
//                           <Loader size={16} className="animate-spin" />
//                         ) : (
//                           <Phone size={16} />
//                         )}
//                         Start Session
//                       </button>
//                     )}

//                     {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
//                       <button
//                         onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
//                         disabled={updating === appointment._id}
//                         className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-50 transition-all"
//                       >
//                         {updating === appointment._id ? (
//                           <Loader size={16} className="animate-spin" />
//                         ) : (
//                           <XCircle size={16} />
//                         )}
//                         Cancel
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default DoctorAppointmentList;


import React from 'react'

export default function DoctorAppointmentList() {
  return (
    <div>DoctorAppointmentList</div>
  )
}
