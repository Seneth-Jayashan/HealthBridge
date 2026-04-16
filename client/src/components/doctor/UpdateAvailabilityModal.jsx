 import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { updateAvailability } from '../../services/doctor.service'; // Adjust path if needed

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_DAY = { dayOfWeek: 'Monday', timeSlots: [{ startTime: '09:00', endTime: '17:00' }] };

const defaultBuilder = () => ({ startTime: '09:00', endTime: '17:00', interval: 30 });

const timeToMinutes = (timeValue) => {
  const [h, m] = String(timeValue || '').split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutesValue) => {
  const h = Math.floor(minutesValue / 60);
  const m = minutesValue % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const buildSlotsInRange = (startTime, endTime, interval) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const step = Number(interval);

  if (!startTime || !endTime || Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(step)) {
    return [];
  }
  if (end <= start || step <= 0) return [];

  const slots = [];
  for (let cursor = start; cursor + step <= end; cursor += step) {
    slots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cursor + step),
    });
  }

  return slots;
};

const UpdateAvailabilityModal = ({ isOpen, onClose, onSuccess, initialAvailability = [] }) => {
  const [schedule, setSchedule] = useState(initialAvailability.length > 0 ? initialAvailability : [DEFAULT_DAY]);
  const [slotBuilderByDay, setSlotBuilderByDay] = useState({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSchedule(initialAvailability.length > 0 ? initialAvailability : [DEFAULT_DAY]);
    setSlotBuilderByDay({});
    setError('');
  }, [isOpen, initialAvailability]);

  if (!isOpen) return null;

  const getBuilder = (dayOfWeek) => slotBuilderByDay[dayOfWeek] || defaultBuilder();

  const updateBuilder = (dayOfWeek, partial) => {
    setSlotBuilderByDay((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...getBuilder(dayOfWeek),
        ...partial,
      },
    }));
  };

  const handleAddDay = () => {
    const availableDay = DAYS_OF_WEEK.find(
      day => !schedule.some(s => s.dayOfWeek === day)
    ) || 'Monday';

    setSchedule([...schedule, { dayOfWeek: availableDay, timeSlots: [{ startTime: '09:00', endTime: '17:00' }] }]);
  };

  const handleRemoveDay = (dayOfWeekToRemove) => {
    // This safely filters out the exact day, ignoring index numbers completely
    setSchedule(prevSchedule => prevSchedule.filter(day => day.dayOfWeek !== dayOfWeekToRemove));
  };

  const handleDayChange = (dayIndex, newDay) => {
    const newSchedule = [...schedule];
    const previousDay = newSchedule[dayIndex].dayOfWeek;
    newSchedule[dayIndex].dayOfWeek = newDay;
    setSchedule(newSchedule);

    if (slotBuilderByDay[previousDay]) {
      setSlotBuilderByDay((prev) => {
        const next = { ...prev, [newDay]: prev[previousDay] };
        delete next[previousDay];
        return next;
      });
    }
  };

  const handleAddTimeSlot = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots.push({ startTime: '09:00', endTime: '10:00' });
    setSchedule(newSchedule);
  };

  const handleRemoveTimeSlot = (dayIndex, slotIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const handleTimeChange = (dayIndex, slotIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
    setSchedule(newSchedule);
  };

  const handleGenerateSlots = (dayIndex) => {
    const targetDay = schedule[dayIndex].dayOfWeek;
    const builder = getBuilder(targetDay);
    const generated = buildSlotsInRange(builder.startTime, builder.endTime, builder.interval);

    if (!generated.length) {
      setError(`Invalid range for ${targetDay}. Make sure end time is after start time.`);
      return;
    }

    setError('');
    setSchedule((prev) => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        timeSlots: generated,
      };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    for (const day of schedule) {
      if (day.timeSlots.length === 0) {
        setError(`Please add at least one time slot for ${day.dayOfWeek}, or remove the day.`);
        setIsLoading(false);
        return;
      }
      for (const slot of day.timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          setError(`Please fill out all time slots for ${day.dayOfWeek}.`);
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      await updateAvailability(schedule);
      onSuccess(); 
      onClose();   
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableDays = (currentDay) => {
    const usedDays = schedule.map(s => s.dayOfWeek);
    return DAYS_OF_WEEK.filter(day => day === currentDay || !usedDays.includes(day));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Set Your Availability</h2>
            <p className="text-sm text-slate-500 mt-1">Define your weekly consultation schedule.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-xl">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {schedule.map((daySchedule, dayIndex) => (
              // CRITICAL FIX: Changed key={dayIndex} to key={daySchedule.dayOfWeek}
              <div key={daySchedule.dayOfWeek} className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <select
                    value={daySchedule.dayOfWeek}
                    onChange={(e) => handleDayChange(dayIndex, e.target.value)}
                    className="font-bold text-slate-800 bg-white border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    {getAvailableDays(daySchedule.dayOfWeek).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveDay(daySchedule.dayOfWeek)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-1.5"
                  >
                    <Trash2 size={16} /> Remove Day
                  </button>
                </div>

                <div className="mb-4 p-3 rounded-xl bg-white border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Generate Slots</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="time"
                      value={getBuilder(daySchedule.dayOfWeek).startTime}
                      onChange={(e) => updateBuilder(daySchedule.dayOfWeek, { startTime: e.target.value })}
                      className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={getBuilder(daySchedule.dayOfWeek).endTime}
                      onChange={(e) => updateBuilder(daySchedule.dayOfWeek, { endTime: e.target.value })}
                      className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm"
                    />
                    <select
                      value={getBuilder(daySchedule.dayOfWeek).interval}
                      onChange={(e) => updateBuilder(daySchedule.dayOfWeek, { interval: Number(e.target.value) })}
                      className="border border-slate-300 rounded-lg px-2.5 py-2 text-sm"
                    >
                      <option value={15}>Every 15 min</option>
                      <option value={30}>Every 30 min</option>
                      <option value={45}>Every 45 min</option>
                      <option value={60}>Every 60 min</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerateSlots(dayIndex)}
                      className="rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 px-3 py-2"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-slate-200">
                  {daySchedule.timeSlots.map((slot, slotIndex) => (
                    // Optional fix: assigning a more stable key if you eventually add IDs to timeslots. slotIndex is okay here as long as we don't do complex animations.
                    <div key={slotIndex} className="flex flex-wrap items-center gap-3">
                      <Clock size={16} className="text-slate-400 hidden sm:block" />
                      
                      <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 px-3 py-1.5">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleTimeChange(dayIndex, slotIndex, 'startTime', e.target.value)}
                          className="outline-none bg-transparent text-sm font-medium"
                          required
                        />
                        <span className="text-slate-400 text-sm">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleTimeChange(dayIndex, slotIndex, 'endTime', e.target.value)}
                          className="outline-none bg-transparent text-sm font-medium"
                          required
                        />
                      </div>

                      {daySchedule.timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(dayIndex, slotIndex)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddTimeSlot(dayIndex)}
                    className="text-blue-700 hover:text-blue-800 text-sm font-semibold flex items-center gap-1.5 mt-3"
                  >
                    <Plus size={16} /> Add another slot
                  </button>
                </div>
              </div>
            ))}
          </div>

          {schedule.length < 7 && (
            <button
              type="button"
              onClick={handleAddDay}
              className="mt-6 w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Add Day to Schedule
            </button>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 bg-white rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || schedule.length === 0}
            className="flex-1 py-3 px-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isLoading ? 'Saving...' : 'Save Availability'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UpdateAvailabilityModal;