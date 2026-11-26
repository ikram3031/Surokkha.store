import { useEffect, useRef } from 'react'
import { saveCheckoutLead, type CheckoutLeadPayload } from '@/lib/api/checkoutLeads'
import { getFbIdentifiers } from '@/lib/pixel'
import { LEAD_DEBOUNCE_MS } from './config'

type LeadInput = Omit<CheckoutLeadPayload, 'fbp' | 'fbc' | 'externalId'>

// Sends a lead with the Meta browser ids attached
const sendLead = (lead: LeadInput, keepalive = false) => {
  const { fbp, fbc, externalId } = getFbIdentifiers()
  return saveCheckoutLead({ ...lead, fbp, fbc, externalId }, keepalive)
}

// Saves what the customer typed once they pause, and once more when the page closes, unless an order is being placed
export const useCheckoutLead = (buildLead: () => LeadInput, deps: unknown[]) => {
  const buildRef = useRef(buildLead)
  const submittingRef = useRef(false)
  buildRef.current = buildLead
  const sig = JSON.stringify(deps)
  useEffect(() => {
    const lead = buildRef.current()
    if (!lead.fullName && !lead.phone && !lead.email) return undefined
    const timer = setTimeout(() => sendLead(buildRef.current()), LEAD_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [sig])
  useEffect(() => {
    const flush = () => {
      if (submittingRef.current) return
      const lead = buildRef.current()
      if (lead.fullName || lead.phone || lead.email) sendLead(lead, true)
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [])
  return submittingRef
}
