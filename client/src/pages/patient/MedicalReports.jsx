import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Trash2, Eye, Plus, AlertCircle, Loader2 } from 'lucide-react';
import UploadReportModal from '../../components/patients/UploadReportModal';
import {getPatientProfile, deleteMedicalReport} from '../../services/patient.service';

const MedicalReports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {

      const profileData = await getPatientProfile();

      // Sort reports by uploadedAt (descending - newest first)
      const sortedReports = profileData.medicalReports.sort((a, b) => 
        new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );

      setReports(sortedReports);
      setError(null);
    } catch (err) {
      setError('Failed to fetch medical reports.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMedicalReport(reportId);
            setReports((prevReports) => prevReports.filter(report => report._id !== reportId));
    } catch (err) {
      alert('Failed to delete the report.');
    }
  };

  const formatDate = (isoString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(isoString).toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Medical Reports</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and view your uploaded medical documents.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-colors shadow-lg shadow-blue-700/20"
        >
          <Plus size={18} />
          Upload Report
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Reports Found</h3>
          <p className="text-slate-500 mb-6">You haven't uploaded any medical reports yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div 
              key={report._id} 
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-700 mt-1 md:mt-0">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {report.title}
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {report.reportType}
                    </span>
                  </h3>
                  
                  {report.notes && (
                    <p className="text-slate-500 text-sm mt-1 mb-2 line-clamp-2 max-w-2xl">
                      {report.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <Calendar size={14} />
                      {formatDate(report.uploadedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:pl-4 md:border-l border-slate-100 pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-sm transition-colors"
                >
                  <Eye size={16} />
                  View
                </a>
                <button
                  onClick={() => handleDelete(report._id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold text-sm transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUploadSuccess={fetchReports} 
      />
    </div>
  );
};

export default MedicalReports;