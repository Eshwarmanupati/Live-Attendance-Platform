const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-ink-800/80 rounded-lg ${className}`} aria-hidden="true" />
);

export const CardSkeleton = () => (
  <div className="card space-y-3" aria-hidden="true">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="pt-3 flex gap-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

export const RowSkeleton = ({ count = 4 }) => (
  <div className="space-y-2" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

export default Skeleton;
