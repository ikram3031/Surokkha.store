import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Renders the 404 page when a route is not found
const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full p-6 text-center space-y-6 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="h-24 w-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
          <FileQuestion className="h-12 w-12 text-primary" />
        </div>
        <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-mono font-bold shadow-md">
          404 ERROR
        </span>
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-mono">
          {t('errors.not_found_title', 'Page Not Found')}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('errors.not_found_desc', 'The requested URL does not exist, has been moved, or you might not have the required permissions to view it.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          asChild
          size="sm"
          className="gap-2 text-xs font-semibold cursor-pointer h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
        >
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> {t('common.back', 'Go Back')}
          </Link>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2 text-xs font-semibold cursor-pointer h-9 px-4 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/40 hover:border-destructive/60 shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {t('errors.reload_page', 'Reload')}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
