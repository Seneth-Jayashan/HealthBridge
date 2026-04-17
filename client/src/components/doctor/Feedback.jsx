import React, { useState, useEffect } from 'react';
import { Star, Loader2, Trash2, X, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
// Adjust the import path to wherever you saved the API functions
import { submitDoctorReview, deleteDoctorReview } from '../../services/patient.service'; 

const Feedback = ({ 
  isOpen, 
  onClose, 
  doctorId, 
  doctorName, 
  existingReview = null, // Pass this if the patient has already reviewed this doctor
  onSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill the form if an existing review is passed in
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError('');
    setSuccess('');
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await submitDoctorReview(doctorId, rating, comment);
      setSuccess("Thank you! Your review has been published.");
      
      // Wait a moment so the user sees the success message before closing
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    setIsDeleting(true);
    setError('');

    try {
      await deleteDoctorReview(doctorId);
      setSuccess("Your review has been deleted.");
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete review. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden zoom-in-95 animate-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2 text-slate-900">
            <MessageSquare size={20} className="text-blue-600" />
            <h2 className="text-xl font-black">Doctor Feedback</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting || isDeleting}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-center text-slate-600 font-medium mb-6">
            How was your experience with <span className="font-bold text-slate-900">{doctorName || 'this doctor'}</span>?
          </p>

          {/* Alerts */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={18} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Interactive Star Rating */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      size={36} 
                      className={`transition-colors duration-200 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400' 
                          : 'fill-transparent text-slate-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold uppercase text-slate-400">
                {rating === 0 ? 'Select a rating' : `${rating} out of 5 Stars`}
              </p>
            </div>

            {/* Comment Box */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Leave a comment (Optional)
              </label>
              <textarea
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience to help other patients..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              
              {/* Only show delete button if they have an existing review */}
              {existingReview ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete Review
                </button>
              ) : (
                <div className="hidden sm:block"></div> // Spacer to push submit to the right
              )}

              <div className="w-full sm:w-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isDeleting}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting || rating === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {existingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;