function DetailSectionHeading({ title }: { title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 type-subtitle-1 font-bold text-foreground">
      <span
        aria-hidden
        className="h-5 w-1 shrink-0 rounded-full bg-primary-action"
      />
      {title}
    </h2>
  );
}

/** One titled block inside a shared card — no border of its own. */
export function DetailSubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="not-first:mt-6 not-first:border-t not-first:border-border/50 not-first:pt-6">
      <DetailSectionHeading title={title} />
      {children}
    </div>
  );
}

/** Standalone card for a single section (events, tables, etc.). */
export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
      <DetailSectionHeading title={title} />
      {children}
    </section>
  );
}

/** Outer shell when several subsections share one frame. */
export function DetailSectionGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
      {children}
    </section>
  );
}
