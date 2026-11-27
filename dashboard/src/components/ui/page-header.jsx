import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Back button shown before the title: a path renders a link, a function runs on click
const BackButton = ({ back }) =>
  typeof back === 'string' ? (
    <Button variant="outline" size="icon-lg" nativeButton={false} render={<Link to={back} />} title="Back" className="shrink-0">
      <ChevronLeft />
    </Button>
  ) : (
    <Button variant="outline" size="icon-lg" type="button" onClick={back} title="Back" className="shrink-0">
      <ChevronLeft />
    </Button>
  );

// Shared header for every dashboard page: back button, icon, title, optional badge and description on the left, page actions on the right
export const PageHeader = ({ back, icon, title, badge, description, actions, children, className }) => {
  const right = actions ?? children;
  return (
    <div className={cn('flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {back && <BackButton back={back} />}
        {icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
            {icon}
          </span>
        )}
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h1>
            {badge}
          </div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
      </div>
      {right && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{right}</div>}
    </div>
  );
};

export default PageHeader;
