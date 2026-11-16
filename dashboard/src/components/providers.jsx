import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth-context';
import UserAppearance from '@/components/userAppearance';
import { ThemeProvider } from '@/components/theme-provider';
import { handleGlobalError } from '@/lib/error-handler';

export const ReactQueryProvider = ({ children }) => {
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      event.preventDefault();
      handleGlobalError(event.reason);
    };

    const handleWindowError = (event) => {
      event.preventDefault();
      handleGlobalError(event.error || event.message);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <UserAppearance />
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

