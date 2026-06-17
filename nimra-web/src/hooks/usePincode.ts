'use client';

import { useState, useCallback, useMemo } from 'react';
import { fetchPincodeData, ALL_STATES, INDIA_DATA } from '../utils/indiaData';
import { toast } from 'sonner';

interface FormStateLike {
  pincode: string;
  state: string;
  city: string;
}

export function usePincode<T extends FormStateLike>(
  form: T,
  setForm: React.Dispatch<React.SetStateAction<T>>,
  clearError?: (key: keyof T) => void
) {
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const handlePincodeChange = useCallback(async (raw: string) => {
    const value = raw.replace(/\D/g, '').slice(0, 6);
    setForm((cur) => ({ ...cur, pincode: value }));
    if (clearError) {
      clearError('pincode');
    }
    if (value.length === 6) {
      setPincodeLoading(true);
      const result = await fetchPincodeData(value);
      setPincodeLoading(false);
      if (result) {
        const matchedState = ALL_STATES.find(
          (s) => s.toLowerCase() === result.state.toLowerCase()
        ) || result.state;
        const cities = INDIA_DATA[matchedState] ?? [];
        const matchedCity =
          cities.find((c) => c.toLowerCase() === result.city.toLowerCase()) ||
          cities.find((c) => c.toLowerCase().includes(result.city.toLowerCase())) ||
          result.city;
        setForm((cur) => ({ ...cur, state: matchedState, city: matchedCity }));
        toast.success(`Detected: ${matchedCity}, ${matchedState}`);
      } else {
        toast.error('Could not auto-detect location. Please select manually.');
      }
    }
  }, [setForm, clearError]);

  const handleStateChange = useCallback((value: string) => {
    setForm((cur) => ({ ...cur, state: value, city: '' }));
  }, [setForm]);

  const availableCities = useMemo(() => {
    return form.state ? (INDIA_DATA[form.state] ?? []) : [];
  }, [form.state]);

  return {
    pincodeLoading,
    handlePincodeChange,
    handleStateChange,
    availableCities,
    ALL_STATES,
  };
}
