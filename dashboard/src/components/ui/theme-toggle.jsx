import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) {
    return <div className="h-7 w-12 rounded-full bg-muted border border-border/80 opacity-50" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border/80 p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isDark ? 'bg-primary' : 'bg-muted'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark/light theme"
    >
      <span
        className={`flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ${
          isDark
            ? 'translate-x-5 bg-background text-foreground'
            : 'translate-x-0.5 bg-background text-foreground'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-primary stroke-[2.5]" />
        ) : (
          <Sun className="h-3 w-3 text-amber-500 stroke-[2.5]" />
        )}
      </span>
    </button>
  );
};
