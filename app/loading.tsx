/**
 * Skeleton matching the page shell rather than a spinner. Reserves the same
 * space the hero and content will occupy, so nothing jumps when data lands.
 */
export default function Loading() {
  return (
    <div role="status" className="px-6 pt-28 pb-24 md:pt-36" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-[900px] animate-pulse">
        <div className="mx-auto h-4 w-40 rounded bg-bg-secondary" />
        <div className="mx-auto mt-8 h-12 w-full rounded bg-bg-secondary" />
        <div className="mx-auto mt-4 h-12 w-3/4 rounded bg-bg-secondary" />
        <div className="mx-auto mt-8 h-20 w-full rounded bg-bg-secondary" />
        <div className="mx-auto mt-10 flex justify-center gap-4">
          <div className="h-12 w-36 rounded-lg bg-bg-secondary" />
          <div className="h-12 w-36 rounded-lg bg-bg-secondary" />
        </div>
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 rounded-xl bg-bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}
