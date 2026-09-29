import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Search, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationBell } from './NotificationBell';
import { CacheCleanButton } from './CacheCleanButton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useDashboardStore } from '@/store/use-dashboard-store';
import { clientConfig } from '@/clientConfig';
import { BrandLogo } from '@/components/BrandLogo';

// Renders the top navigation header containing sidebar trigger, search, cache clean, theme toggle, and language selector
export const Header = () => {
  const { t } = useTranslation();
  const { searchQuery, setSearchQuery } = useDashboardStore();
  const { brandName } = clientConfig;

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur-md px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <SidebarTrigger className="h-8.5 w-8.5 rounded-lg border border-border/50 text-foreground hover:bg-muted/80 shrink-0 cursor-pointer" />
        <div className="md:hidden flex items-center">
          <BrandLogo className="w-[85px] sm:w-[110px] h-auto" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-3 min-w-0">
        <form className="flex-1 max-w-[140px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px]" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('nav.search_products', 'Search...')}
              className="pl-8 h-8 sm:h-9 text-xs sm:text-sm bg-muted/40 border-border/60 focus:bg-background rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <CacheCleanButton />
          <LanguageToggle />
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

