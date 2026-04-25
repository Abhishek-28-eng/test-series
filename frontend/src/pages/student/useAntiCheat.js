import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const MAX_VIOLATIONS = 3; // auto-submit after this many tab switches

/**
 * useAntiCheat (Tab switch detection only)
 * @param {Function} onAutoSubmit  - called when violations exceed MAX_VIOLATIONS
 * @param {boolean}  enabled       - pause enforcement (e.g. during loading)
 */
export const useAntiCheat = (onAutoSubmit, enabled = true) => {
  const [violations, setViolations]           = useState(0);
  const [warningVisible, setWarningVisible]   = useState(false);
  const [warningMsg, setWarningMsg]           = useState('');
  const violationsRef  = useRef(0);
  const submittedRef   = useRef(false);

  const recordViolation = useCallback((msg) => {
    if (!enabled || submittedRef.current) return;

    violationsRef.current += 1;
    setViolations(violationsRef.current);
    setWarningMsg(msg);
    setWarningVisible(true);

    const remaining = MAX_VIOLATIONS - violationsRef.current;

    if (violationsRef.current >= MAX_VIOLATIONS) {
      submittedRef.current = true;
      toast.error('⚠️ Too many violations! Auto-submitting exam...', { duration: 4000 });
      setTimeout(() => onAutoSubmit(), 1500);
    } else {
      toast.error(`⚠️ ${msg} — Warning ${violationsRef.current}/${MAX_VIOLATIONS}. ${remaining} more will auto-submit.`, { duration: 5000 });
    }
  }, [enabled, onAutoSubmit]);

  const dismissWarning = useCallback(() => setWarningVisible(false), []);

  /* ── Tab / window visibility (tab switch) ────────────────── */
  useEffect(() => {
    if (!enabled) return;

    const onVisibilityChange = () => {
      if (document.hidden && !submittedRef.current) {
        recordViolation('Switched tab or minimized window');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [enabled, recordViolation]);

  /* ── Window blur (alt+tab, other app) ───────────────────── */
  useEffect(() => {
    if (!enabled) return;

    const onBlur = () => {
      // visibilitychange already covers most cases; blur catches alt-tab
      if (!document.hidden && !submittedRef.current) {
        recordViolation('Switched to another application');
      }
    };

    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [enabled, recordViolation]);

  return { violations, maxViolations: MAX_VIOLATIONS, warningVisible, warningMsg, dismissWarning };
};
