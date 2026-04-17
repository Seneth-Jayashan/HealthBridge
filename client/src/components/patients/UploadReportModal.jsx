import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { uploadMedicalReport } from '../../services/patient.service';
import { MEDICAL_REPORT_TYPES } from '@healthbridge/shared/src/constants/medicalReportType.js';

const UploadReportModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    // Default to the first type in your enum (e.g., 'Scan')
    reportType: MEDICAL_REPORT_TYPES.scan || 'Scan', 
    notes: '',
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('reportType', formData.reportType);
      uploadData.append('notes', formData.notes);
      
      // Successfully mapping 'reportFile' for the backend Multer middleware
      uploadData.append('reportFile', formData.file);

      await uploadMedicalReport(uploadData);
      
      // Simulate API delay for demonstration (Remove this in production)
      await new Promise(resolve => setTimeout(resolve, 1000));

      onUploadSuccess(); 
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload report.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Upload Medical Report</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Report Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="e.g., Blood Test Results"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Report Type</label>
            <select
              name="reportType"
              value={formData.reportType}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 bg-white"
            >
              {/* Dynamically map options from the shared enum */}
              {Object.values(MEDICAL_REPORT_TYPES).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Upload File</label>
            <input
              type="file"
              name="file"
              required
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (Optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Any additional information..."
            ></textarea>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-3 px-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {isUploading ? 'Uploading...' : 'Upload Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadReportModal;