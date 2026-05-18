const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-ink-800 rounded-lg ${className}`} />
);

export const CardSkeleton = () => (
  <div className="card space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <div className="pt-2 flex gap-2">
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

export default Skeleton;
