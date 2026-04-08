import React, { useEffect, useState } from 'react';
import { useSymptomChecker } from '../../hooks/useSymptomChecker';
import { useNavigate } from 'react-router-dom';

const URGENCY_BADGE = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  moderate: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  emergency: 'bg-red-100 text-red-700 border-red-200',
};

const SymptomHistoryPage = () => {
  const navigate = useNavigate();

  const { history, historyLoading, fetchHistory, deleteRecord } = useSymptomChecker();
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchHistory(page).then((d) => d && setPagination(d.pagination));
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    await deleteRecord(id);
  };

  // Loading state
  if (historyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm text-gray-500">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Symptom History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total || 0} past check{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={() => navigate('/symptom-checker')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + New Check
        </button>
      </div>

      {/* Empty state */}
      {history.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">🩺</div>
          <p className="text-gray-700 font-semibold text-lg">No symptom checks yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            Use the AI symptom checker to get started
          </p>
          <button
            onClick={() => navigate('/symptom-checker')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Check Symptoms Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => (
            <div
              key={record._id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Summary Row */}
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border capitalize ${URGENCY_BADGE[record.aiResponse?.urgencyLevel] || URGENCY_BADGE.moderate}`}>
                      {record.aiResponse?.urgencyLevel || 'moderate'}
                    </span>

                    <span className="text-xs text-gray-400">
                      {new Date(record.createdAt).toLocaleDateString('en-LK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 truncate">
                    <span className="font-medium">Symptoms: </span>
                    {record.symptoms.slice(0, 4).join(', ')}
                    {record.symptoms.length > 4 && (
                      <span className="text-gray-400">
                        +{record.symptoms.length - 4} more
                      </span>
                    )}
                  </p>

                  {record.aiResponse?.possibleConditions?.[0] && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Top match:{' '}
                      <span className="font-medium text-gray-600">
                        {record.aiResponse.possibleConditions[0].name}
                      </span>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() =>
                      setExpanded(expanded === record._id ? null : record._id)
                    }
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        expanded === record._id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(record._id)}
                    className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Section */}
              {expanded === record._id && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">

                  {/* All Symptoms */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      All Symptoms
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {record.symptoms.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Possible Conditions */}
                  {record.aiResponse?.possibleConditions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Possible Conditions
                      </p>
                      <div className="space-y-1.5">
                        {record.aiResponse.possibleConditions.map((c, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold text-sm flex-shrink-0">
                              {i + 1}.
                            </span>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-xs text-gray-400 ml-1.5">
                                ({c.likelihood})
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialists */}
                  {record.aiResponse?.recommendedSpecialties?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Recommended Specialists
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.aiResponse.recommendedSpecialties.map((s, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-medium"
                          >
                            {s.specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advice */}
                  {record.aiResponse?.generalAdvice && (
                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">
                        General Advice
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {record.aiResponse.generalAdvice}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomHistoryPage;
