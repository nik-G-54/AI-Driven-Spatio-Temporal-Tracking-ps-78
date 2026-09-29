import type { ReactNode, ComponentType } from 'react';
import { classNames } from './classNames';
import { ArrowRight } from 'lucide-react';

export interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon?: ComponentType<{ className?: string }>;
  description?: string;
  href?: string;
  cta?: string;
  children?: ReactNode;
}

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        'grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  children,
}: BentoCardProps) {
  return (
    <div
      key={name}
      className={classNames(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl',
        'bg-card text-card-foreground border border-border shadow-xs hover:border-primary/50',
        'transition-all duration-300 ease-out',
        className
      )}
    >
      {background && <div className="absolute inset-0 z-0 overflow-hidden">{background}</div>}

      {children && <div className="relative z-10 w-full h-full flex flex-col">{children}</div>}

      {!children && (
        <>
          <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-2 mt-auto">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-accent/80 border border-border flex items-center justify-center text-primary mb-2 shadow-xs group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5 origin-left transition-all duration-300 ease-in-out group-hover:scale-110" />
              </div>
            )}
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              {name}
            </h3>
            {description && (
              <p className="max-w-lg text-body-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>

          {cta && (
            <div
              className={classNames(
                'pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-20'
              )}
            >
              <a
                href={href || '#'}
                className="pointer-events-auto text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 cursor-pointer bg-card/90 backdrop-blur px-3 py-1.5 rounded-md border border-border shadow-sm"
              >
                <span>{cta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </>
      )}

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-primary/[0.02]" />
    </div>
  );
}
