import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Two-column in-page navigation: a menu of sections on the left, the active section's panel on the right.
// sections: [{ id, label, icon?, group?, badge? }]; on small screens the menu becomes a horizontal scroller.
export function InpageSectionNav({ sections, activeId, onChange, children, className }) {
  const navRef = useRef(null);

  // Keep the active item visible when the menu is a horizontal scroller (small screens)
  useEffect(() => {
    const nav = navRef.current;
    const btn = nav?.querySelector('[aria-current="page"]');
    if (!nav || !btn || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = btn.offsetLeft - (nav.clientWidth - btn.offsetWidth) / 2;
  }, [activeId, sections.length]);

  const groups = [];
  for (const section of sections) {
    const key = section.group || '';
    let group = groups.find((g) => g.key === key);
    if (!group) groups.push((group = { key, items: [] }));
    group.items.push(section);
  }

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[240px_1fr] lg:items-start', className)}>
      <nav
        ref={navRef}
        aria-label="Section navigation"
        className="relative flex flex-row gap-1 overflow-x-auto pb-1 lg:sticky lg:top-2 lg:flex-col lg:overflow-visible lg:rounded-xl lg:border lg:border-border/60 lg:bg-card lg:p-2 lg:pb-2"
      >
        {groups.map((group) => (
          <div key={group.key || 'default'} className="contents lg:flex lg:flex-col lg:gap-1 lg:[&:not(:first-child)]:mt-2">
            {group.key && (
              <span className="hidden px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80 lg:block">
                {group.key}
              </span>
            )}
            {group.items.map((section) => {
              const isActive = section.id === activeId;
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onChange(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{section.label}</span>
                  {section.badge ? (
                    <span className={cn('ml-auto rounded-full px-1.5 text-[10px] font-semibold', isActive ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary')}>
                      {section.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default InpageSectionNav;
