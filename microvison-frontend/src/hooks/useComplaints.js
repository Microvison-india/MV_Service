import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * Custom hook to fetch complaints with support for filters, pagination, and sorting.
 * @param {Object} filters - All active filter parameters (status, product, search, pagination etc.)
 * @returns {Object} - { complaints, loading, error, pagination, refresh }
 */
export default function useComplaints(filters) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10,
  });
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = () => setRefreshTick((t) => t + 1);

  useEffect(() => {
    let active = true;
    const fetchComplaints = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            if (k === 'status' && Array.isArray(v)) {
              if (v.length > 0) {
                params.append(k, v.join(','));
              }
            } else {
              params.append(k, v);
            }
          }
        });

        const { data } = await api.get(`/api/complaints?${params.toString()}`);
        if (active) {
          setComplaints(data.complaints || []);
          setPagination({
            total: data.total || 0,
            page: data.page || 1,
            totalPages: data.totalPages || 1,
            limit: data.limit || 10,
          });
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Failed to fetch complaints.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchComplaints();
    return () => {
      active = false;
    };
  }, [filters, refreshTick]);

  return { complaints, loading, error, pagination, refresh };
}
