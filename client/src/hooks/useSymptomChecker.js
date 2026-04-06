import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5007/api/ai';

export const useSymptomChecker = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);


    const checkSymptoms = useCallback(async (symptoms, additionalInfo) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
        const { data } = await axios.post(
        `${API_BASE}/symptoms/check`,
        { symptoms, additionalInfo },
        {
            withCredentials: true // ✅ send cookie
        }
        );

        setResult(data.data);
        return data.data;
    } catch (err) {
        const msg = err.response?.data?.message || 'Failed to analyze symptoms.';
        setError(msg);
        throw new Error(msg);
    } finally {
        setLoading(false);
    }
    }, []);

  // ─── Fetch History ────────────────────────────────────────────
  const fetchHistory = useCallback(async (page = 1, limit = 10) => {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/history?page=${page}&limit=${limit}`,
        getAuthHeader()
      );
      setHistory(data.data.records);
      return data.data;
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ─── Delete Record ────────────────────────────────────────────
  const deleteRecord = useCallback(async (id) => {
    await axios.delete(`${API_BASE}/history/${id}`, getAuthHeader());
    setHistory((prev) => prev.filter((r) => r._id !== id));
  }, []);

  // ─── Reset ────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    loading,
    result,
    error,
    history,
    historyLoading,
    checkSymptoms,
    fetchHistory,
    deleteRecord,
    reset,
  };
};