import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationBell } from './NotificationBell';
import { CacheCleanButton } from './CacheCleanButton';
import { useDashboardStore } from '@/store/use-dashboard-store';

// Renders the top navigation header containing search, cache clean, theme toggle, and language selector
export const Header = () => {
  const { t } = useTranslation();
  const { searchQuery, setSearchQuery } = useDashboardStore();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <form className="ml-auto flex-1 sm:flex-initial" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('nav.search_products', 'Search products...')}
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <div className="flex items-center gap-2.5">
          <CacheCleanButton />
          <LanguageToggle />
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

