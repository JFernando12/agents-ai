'use client';

import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** Breadcrumb items. Last item is the current page (bold, not a link). */
  crumbs: Crumb[];
  /** Optional secondary line shown below the breadcrumb (e.g. a description). */
  subtitle?: React.ReactNode;
  /** Optional content rendered on the right side of the header. */
  actions?: React.ReactNode;
}

/**
 * Standard page header with breadcrumb navigation and optional action area.
 * - Back arrow navigates to the second-to-last crumb's href.
 * - Intermediate crumbs are clickable links.
 * - The last crumb is the current page title (bold, not a link).
 */
export function PageHeader({ crumbs, subtitle, actions }: PageHeaderProps) {
  const router = useRouter();
  const parentCrumb = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
      {/* Left: back button + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {parentCrumb?.href && (
          <button
            onClick={() => router.push(parentCrumb.href!)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <Fragment key={i}>
                  {i > 0 && (
                    <ChevronRight
                      size={12}
                      className="text-gray-300 dark:text-gray-600 flex-shrink-0"
                    />
                  )}
                  {isLast ? (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {crumb.label}
                    </span>
                  ) : crumb.href ? (
                    <button
                      onClick={() => router.push(crumb.href!)}
                      className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap max-w-[140px] truncate"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              );
            })}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      {actions && (
        <div className="flex items-center gap-1 flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}
