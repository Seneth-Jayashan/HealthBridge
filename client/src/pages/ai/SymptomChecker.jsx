import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSymptomChecker } from '../../hooks/useSymptomChecker';

// ─── Config ───────────────────────────────────────────────────
const URGENCY_CONFIG = {
  low:       { label: 'Low Urgency',       bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', icon: '✓',  badge: 'bg-emerald-100 text-emerald-700' },
  moderate:  { label: 'Moderate Urgency',  bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-700',   icon: '⚠',  badge: 'bg-amber-100 text-amber-700'   },
  high:      { label: 'High Urgency',      bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-700',  icon: '!',  badge: 'bg-orange-100 text-orange-700' },
  emergency: { label: 'EMERGENCY',         bg: 'bg-red-50',     border: 'border-red-400',     text: 'text-red-700',     icon: '🚨', badge: 'bg-red-100 text-red-700'       },
};

const LIKELIHOOD_STYLE = {
  high:     'bg-red-100 text-red-700 border border-red-200',
  moderate: 'bg-amber-100 text-amber-700 border border-amber-200',
  low:      'bg-blue-100 text-blue-700 border border-blue-200',
};

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Chest pain',
  'Shortness of breath', 'Nausea', 'Dizziness', 'Sore throat',
  'Body aches', 'Stomach pain', 'Vomiting',
];

// ─── Small reusable pieces ────────────────────────────────────

const SymptomTag = ({ symptom, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-sm font-medium">
    {symptom}
    <button
      onClick={() => onRemove(symptom)}
      className="ml-1 text-blue-400 hover:text-red-500 transition-colors text-base leading-none"
    >
      ×
    </button>
  </span>
);

const ConditionCard = ({ condition, index }) => (
  <div className="flex gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
      {index + 1}
    </div>
    <div className="flex-1">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="font-semibold text-gray-800">{condition.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LIKELIHOOD_STYLE[condition.likelihood] || LIKELIHOOD_STYLE.low}`}>
          {condition.likelihood} likelihood
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{condition.description}</p>
    </div>
  </div>
);

const SpecialtyCard = ({ specialty }) => (
  <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
    <div>
      <p className="font-semibold text-blue-900 text-sm">{specialty.specialty}</p>
      <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{specialty.reason}</p>
    </div>
  </div>
);

const ResultView = ({ result, onReset }) => {
  const { result: res, symptoms } = result;
  const urgency = URGENCY_CONFIG[res.urgencyLevel] || URGENCY_CONFIG.moderate;
  const navigate = useNavigate();

  const handleBooking = () => {
    navigate('/patient/appointment/book');
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">AI Analysis Result</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Based on {symptoms.length} symptom{symptoms.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          New Check
        </button>
      </div>

      {/* Urgency Banner */}
      <div className={`p-4 rounded-2xl border-2 ${urgency.bg} ${urgency.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Urgency Level</p>
            <span className={`inline-flex items-center gap-2 text-lg font-bold ${urgency.text}`}>
              <span>{urgency.icon}</span>
              {urgency.label}
            </span>
          </div>
          {res.urgencyLevel === 'emergency' && (
            <div className="text-right">
              <p className="text-sm font-bold text-red-700">Go to ER immediately!</p>
              <p className="text-xs text-red-600 mt-0.5">Call 1990 (Sri Lanka)</p>
            </div>
          )}
        </div>
      </div>

      {/* Symptoms */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Symptoms</p>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((s) => (
            <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Red Flags */}
      {res.redFlags?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">⚠ Red Flags — Seek Immediate Care</p>
          <ul className="space-y-1">
            {res.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="flex-shrink-0 mt-0.5">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Possible Conditions */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Possible Conditions</p>
        <div className="space-y-3">
          {res.possibleConditions.map((c, i) => (
            <div key={i} className="flex gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LIKELIHOOD_STYLE[c.likelihood] || LIKELIHOOD_STYLE.low}`}>
                    {c.likelihood} likelihood
                  </span>
                  {c.confidenceScore !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {c.confidenceScore}% confidence
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Specialists */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recommended Specialists</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {res.recommendedSpecialties.map((s, i) => (
            <div key={i} className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900 text-sm">{s.specialty}</p>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{s.reason}</p>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={handleBooking}
          className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm">
          Book Appointment with Specialist →
        </button>
      </div>

      {/* Next Steps */}
      {res.nextSteps?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Next Steps</p>
          <ol className="space-y-2">
            {res.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Home Care Advice */}
      {res.homeCareAdvice?.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">🏠 Home Care Advice</p>
          <ul className="space-y-2">
            {res.homeCareAdvice.map((advice, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                <span className="flex-shrink-0 mt-0.5">✓</span>
                <span>{advice}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* General Advice */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">General Advice</p>
        <p className="text-sm text-gray-700 leading-relaxed">{res.generalAdvice}</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-xs text-amber-700 flex gap-2 leading-relaxed">
          <span className="flex-shrink-0">⚠️</span>
          <span>{res.disclaimer}</span>
        </p>
      </div>

    </div>
  );
};

// ─── Main Input Screen ────────────────────────────────────────
const SymptomChecker = () => {
  const { loading, result, error, checkSymptoms, reset } = useSymptomChecker();

  const [symptoms, setSymptoms] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    age: '', gender: '', duration: '', severity: '', medicalHistory: '',
  });
  const inputRef = useRef(null);

  const addSymptom = (val) => {
    const trimmed = val.trim();
    if (!trimmed || symptoms.includes(trimmed) || symptoms.length >= 20) return;
    setSymptoms((prev) => [...prev, trimmed]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeSymptom = (val) => setSymptoms((prev) => prev.filter((s) => s !== val));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSymptom(inputValue); }
    if (e.key === 'Backspace' && !inputValue && symptoms.length) {
      setSymptoms((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (!symptoms.length) return;
    const info = Object.fromEntries(Object.entries(additionalInfo).filter(([, v]) => v !== ''));
    await checkSymptoms(symptoms, info);
  };

  const handleReset = () => {
    reset();
    setSymptoms([]);
    setInputValue('');
    setAdditionalInfo({ age: '', gender: '', duration: '', severity: '', medicalHistory: '' });
    setShowExtra(false);
  };

  // Show result screen
  if (result) return <ResultView result={result} onReset={handleReset} />;

  // Input screen
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">AI Symptom Checker</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto leading-relaxed">
          Enter your symptoms below and get AI-powered health suggestions and recommended specialists instantly.
        </p>
      </div>

      {/* Symptom Input Box */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          What symptoms are you experiencing?
          <span className="text-gray-400 font-normal ml-1">(press Enter to add each one)</span>
        </label>

        {/* Tag input */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="min-h-[90px] flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50 cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
        >
          {symptoms.map((s) => (
            <SymptomTag key={s} symptom={s} onRemove={removeSymptom} />
          ))}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputValue && addSymptom(inputValue)}
            placeholder={symptoms.length === 0 ? 'e.g. headache, fever, cough...' : ''}
            className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
            disabled={symptoms.length >= 20}
          />
        </div>

        {/* Symptom count */}
        <p className="text-right text-xs text-gray-400 mt-1">{symptoms.length}/20 symptoms</p>

        {/* Quick add suggestions */}
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.filter((s) => !symptoms.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addSymptom(s)}
                className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowExtra((v) => !v)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className={`w-4 h-4 transition-transform ${showExtra ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showExtra ? 'Hide' : 'Add'} more details (optional — improves accuracy)
        </button>

        {showExtra && (
          <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Age</label>
                <input
                  type="number" min={0} max={150}
                  value={additionalInfo.age}
                  onChange={(e) => setAdditionalInfo((p) => ({ ...p, age: e.target.value }))}
                  placeholder="e.g. 28"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gender</label>
                <select
                  value={additionalInfo.gender}
                  onChange={(e) => setAdditionalInfo((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">How long?</label>
                <input
                  type="text"
                  value={additionalInfo.duration}
                  onChange={(e) => setAdditionalInfo((p) => ({ ...p, duration: e.target.value }))}
                  placeholder="e.g. 3 days"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Severity</label>
                <select
                  value={additionalInfo.severity}
                  onChange={(e) => setAdditionalInfo((p) => ({ ...p, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not specified</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>

              {/* Medical History */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Relevant Medical History
                </label>
                <textarea
                  value={additionalInfo.medicalHistory}
                  onChange={(e) => setAdditionalInfo((p) => ({ ...p, medicalHistory: e.target.value }))}
                  placeholder="e.g. diabetes, hypertension, allergies..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-right text-xs text-gray-400 mt-1">
                  {additionalInfo.medicalHistory.length}/500
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-red-500 text-lg">✕</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={symptoms.length === 0 || loading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Analyzing your symptoms...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {symptoms.length > 0
              ? `Analyze ${symptoms.length} Symptom${symptoms.length > 1 ? 's' : ''}`
              : 'Analyze Symptoms'}
          </>
        )}
      </button>

      {/* Bottom disclaimer */}
      <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-4">
        ⚠️ This AI tool provides suggestions only — it is not a substitute for professional medical advice.
        Always consult a qualified doctor for proper diagnosis and treatment.
      </p>

    </div>
  );
};

export default SymptomChecker;