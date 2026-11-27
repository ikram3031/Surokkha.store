import { useEffect, useRef } from 'react';
import { saveCheckoutLead } from '../utils/analytics';
import { LEAD_DEBOUNCE_MS } from './config';

// Saves what the customer typed once they pause, and once more when the page closes, unless an order is being placed.
// Returns a ref the caller sets to true while an order is being submitted (or uses the caller's own ref when given).
export const useCheckoutLead = (buildLead, deps, ownSubmittingRef = null) => {
  const buildRef = useRef(buildLead);
  const localRef = useRef(false);
  const submittingRef = ownSubmittingRef || localRef;
  buildRef.current = buildLead;
  const sig = JSON.stringify(deps);
  useEffect(() => {
    const lead = buildRef.current();
    if (!lead.fullName && !lead.phone && !lead.email) return undefined;
    const timer = setTimeout(() => saveCheckoutLead(buildRef.current()), LEAD_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [sig]);
  useEffect(() => {
    const flush = () => {
      if (submittingRef.current) return;
      const lead = buildRef.current();
      if (lead.fullName || lead.phone || lead.email) saveCheckoutLead(lead, true);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);
  return submittingRef;
};
