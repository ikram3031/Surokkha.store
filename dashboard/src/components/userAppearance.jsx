import { useLayoutEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { applyAppearance, clearAppearance, readStoredAppearance } from '@/lib/appearance';

// Applies the signed-in user's own colour and roundness, and drops it again once they log out
const UserAppearance = () => {
  const { user, isLoading } = useAuth();
  const saved = user?.preferences?.appearance;
  const appearance = saved ?? (isLoading ? readStoredAppearance() : null);

  useLayoutEffect(() => {
    if (appearance) applyAppearance(appearance);
    else clearAppearance();
  }, [appearance?.primaryColor, appearance?.radius]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default UserAppearance;
