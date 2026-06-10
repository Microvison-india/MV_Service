import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * Custom hook to fetch billing details and monthly invoice summaries.
 * @param {Object} filters - Filter options (month, year, assignedCentreId, product, etc.)
 * @returns {Object} - { bills, invoice, loading, error, refresh }
 */
export default function useBilling(filters) {
  const [bills, setBills] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = () => setRefreshTick((t) => t + 1);

  useEffect(() => {
    let active = true;
    const fetchBillingData = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params[k] = v;
          }
        });

        // 1. Fetch itemized bills
        const { data: billsData } = await api.get('/api/billing/complaints', { params });
        if (active) {
          setBills(billsData.bills || []);
        }

        // 2. Fetch monthly invoice rollup if SC ID and month/year are provided
        const targetScId = filters.assignedCentreId || filters.scId;
        if (targetScId && filters.month && filters.year) {
          const { data: invoiceData } = await api.get(`/api/billing/invoice/${targetScId}`, {
            params: { month: filters.month, year: filters.year },
          });
          if (active) {
            setInvoice(invoiceData);
          }
        } else {
          if (active) setInvoice(null);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Failed to fetch billing data.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBillingData();
    return () => {
      active = false;
    };
  }, [filters, refreshTick]);

  return { bills, invoice, loading, error, refresh };
}
