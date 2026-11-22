import { useEffect, useState } from 'react'

const STORAGE_KEY = 'surokkha-18'

export function useAgeGate() {
  const [verified, setVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (verified) {
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore storage errors */
      }
    }
  }, [verified])

  const confirm = () => setVerified(true)

  return { verified, confirm }
}
