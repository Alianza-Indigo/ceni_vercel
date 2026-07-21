import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail for every internal view. The last item is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted-ink">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden="true" className="px-1">
                  /
                </li>
              )}
              <li>
                {item.href && !last ? (
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-indigo"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className="inline-flex min-h-11 items-center font-bold text-ink"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
