import type { ReactNode } from "react";
import { Button } from "@sarunyu/system-one";
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";
import type { Resource } from "@/lib/api/resource";

/**
 * The four "not the data you came for" states, and the order a screen checks
 * them in:
 *
 *   isLoading → {@link ErrorState} → {@link NotFoundState} → {@link EmptyState} → data
 *
 * {@link ResourceView} runs that order for a {@link Resource}, so a screen
 * can't show "not found" while it is still loading, or an empty list when the
 * request behind it actually failed.
 */

/**
 * `default` fills a tab or a page section (400px floor, the original look).
 * `compact` is for narrow cards and sections inside a longer page, where a
 * 400px block would push everything else off screen.
 */
type StateSize = "default" | "compact";

const SIZE_CLASS: Record<StateSize, string> = {
  default: "min-h-[400px]",
  compact: "py-8",
};

/** Shared "nothing here" placeholder — used for empty tabs and empty table results alike. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  actionSlot,
  size = "default",
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  /** Quiet text-link action. Ignored when `actionSlot` is given. */
  action?: { label: string; onClick: () => void };
  /**
   * A rendered action, for surfaces where the empty state *is* the call to
   * action and a link reads too quietly — pass a real `Button`. Kept separate
   * from `action` rather than changing what `action` renders, so the existing
   * link-style call sites are untouched.
   */
  actionSlot?: ReactNode;
  size?: StateSize;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${SIZE_CLASS[size]} text-center`}
    >
      {icon}
      <p className="type-subtitle-1 font-semibold text-[var(--text-default-secondary)]">{title}</p>
      {body && <p className="type-body-2 max-w-xs text-[var(--text-default-tertiary)]">{body}</p>}
      {actionSlot ? (
        <div className="mt-1">{actionSlot}</div>
      ) : (
        action && (
          <button
            type="button"
            onClick={action.onClick}
            className="text-primary-action mt-1 cursor-pointer text-body-sm font-medium hover:underline"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

/**
 * A load that failed. Shown instead of the data, never alongside a fallback:
 * a screen that quietly renders placeholder figures after a failed request is
 * telling the IC something false about a client's money.
 */
export function ErrorState({
  onRetry,
  title,
  body,
  size = "default",
}: {
  onRetry?: () => void;
  title?: string;
  body?: string;
  size?: StateSize;
}) {
  const t = useT();
  title ??= t.states.loadErrorTitle;
  body ??= t.states.loadErrorBody;
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 ${SIZE_CLASS[size]} text-center`}
    >
      <WarningCircleIcon size={40} weight="duotone" className="text-[var(--text-danger-primary)]" />
      <p className="type-subtitle-1 font-semibold text-[var(--text-default-secondary)]">{title}</p>
      <p className="type-body-2 max-w-xs text-[var(--text-default-tertiary)]">{body}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowClockwiseIcon size={16} />}
          onClick={onRetry}
          className="mt-1"
        >
          {t.states.retry}
        </Button>
      )}
    </div>
  );
}

/**
 * The data on screen is the last good copy; a later refresh failed. Shown
 * above the data rather than replacing it — what is there is still true as of
 * when it loaded.
 */
export function StaleBanner({ onRetry }: { onRetry?: () => void }) {
  const t = useT();
  return (
    <div
      role="status"
      className="type-body-2 flex items-center gap-2 rounded-lg border border-[var(--border-warning)] bg-[var(--bg-warning-light)] px-3 py-2 text-[var(--text-default-secondary)]"
    >
      <WarningCircleIcon
        size={18}
        weight="fill"
        className="shrink-0 text-[var(--text-warning-primary)]"
      />
      <span className="min-w-0 flex-1">{t.states.staleBanner}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-primary-action shrink-0 cursor-pointer font-medium hover:underline"
        >
          {t.states.retry}
        </button>
      )}
    </div>
  );
}

/**
 * A detail route whose id resolves to nothing.
 *
 * Detail pages are reached by id rather than by handing over the object a card
 * already had, so a stale link, a renamed record or a collection missing from
 * the lookup would otherwise render a blank page — or worse, a different
 * record — with no way out.
 */
export function NotFoundState({
  message,
  onBack,
  backLabel,
}: {
  message: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  const t = useT();
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <MagnifyingGlassIcon size={40} weight="duotone" className="text-muted-foreground/40" />
      <p className="type-subtitle-1 font-semibold text-[var(--text-default-secondary)]">
        {message}
      </p>
      {onBack && (
        <Button variant="plain" size="sm" leftIcon={<ArrowLeftIcon size={16} />} onClick={onBack}>
          {backLabel ?? t.common.back}
        </Button>
      )}
    </div>
  );
}

/** Height floor a table's container needs so {@link TableEmptyOverlay} has room to
 *  fill. The container must also be `relative` — unconditionally, so that dropping
 *  it never moves the containing block of anything else positioned inside. */
export const TABLE_EMPTY_MIN_HEIGHT = "min-h-[448px]";

/**
 * Empty-table state: absolutely positioned over the table body (from just
 * under the ~48px header row down), so the real header — and its column
 * widths — stay visible behind it.
 *
 * `variant` keeps the two meanings apart. `"no-result"` (the default, and the
 * only meaning this had before) is "your search or filter matched nothing" and
 * offers to clear it. `"empty"` is "there is nothing yet" — saying "ไม่พบข้อมูล
 * ที่ค้นหา" to someone who never searched sends them looking for a filter that
 * isn't there.
 *
 * The container needs `relative` plus {@link TABLE_EMPTY_MIN_HEIGHT} for this to lay out.
 */
export function TableEmptyOverlay({
  body,
  title,
  onClearFilters,
  variant = "no-result",
  icon,
}: {
  body?: string;
  title?: string;
  onClearFilters?: () => void;
  variant?: "no-result" | "empty";
  icon?: ReactNode;
}) {
  const isEmpty = variant === "empty";
  const t = useT();
  return (
    <div className="absolute inset-x-0 top-12 bottom-0 flex items-center justify-center bg-[var(--bg-default-primary,white)]">
      <EmptyState
        icon={
          icon ?? (
            <MagnifyingGlassIcon size={40} className="text-[var(--text-default-placeholder)]" />
          )
        }
        title={title ?? (isEmpty ? t.states.empty : t.states.noResultTitle)}
        body={body ?? (isEmpty ? undefined : t.states.noResultBody)}
        action={
          !isEmpty && onClearFilters
            ? { label: t.states.clearFilters, onClick: onClearFilters }
            : undefined
        }
      />
    </div>
  );
}

/**
 * Renders a {@link Resource} in the one order every screen should follow:
 * loading → error → not found → empty → data.
 *
 * - `notFound` is shown when `data` is `null`/`undefined` after loading — the
 *   lookup resolved to nothing. Omit it for list resources, which are never
 *   null.
 * - `isEmpty` decides whether loaded data counts as empty; `empty` is what to
 *   show then.
 * - A stale resource still renders its data, with a {@link StaleBanner} above.
 */
export function ResourceView<T>({
  resource,
  skeleton,
  notFound,
  isEmpty,
  empty,
  errorSize = "default",
  children,
}: {
  resource: Resource<T>;
  skeleton: ReactNode;
  notFound?: ReactNode;
  isEmpty?: (data: NonNullable<T>) => boolean;
  empty?: ReactNode;
  errorSize?: StateSize;
  children: (data: NonNullable<T>) => ReactNode;
}) {
  const { data, isLoading, error, isStale, retry } = resource;
  if (isLoading) return <>{skeleton}</>;
  if (error) return <ErrorState onRetry={retry} size={errorSize} />;
  if (data === null || data === undefined) return <>{notFound ?? null}</>;
  const value = data as NonNullable<T>;
  if (isEmpty?.(value)) return <>{empty ?? null}</>;
  return (
    <>
      {isStale && <StaleBanner onRetry={retry} />}
      {children(value)}
    </>
  );
}
