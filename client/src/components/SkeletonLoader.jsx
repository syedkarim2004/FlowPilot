export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="fp-skeleton h-3 rounded"
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 'h-10 w-10', className = '' }) {
  return (
    <div className={`fp-skeleton rounded-full shrink-0 ${size} ${className}`} />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`fp-card p-5 flex flex-col gap-4 ${className}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="fp-skeleton h-4 w-1/3 rounded" />
          <div className="fp-skeleton h-5 w-2/3 rounded" />
        </div>
        <div className="fp-skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        <div className="fp-skeleton h-2 w-full rounded-full" />
        <div className="fp-skeleton h-2 w-5/6 rounded-full" />
      </div>
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
        <div className="fp-skeleton h-3 w-24 rounded" />
        <div className="flex gap-2">
          <div className="fp-skeleton h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 py-3 border-b border-border ${className}`}>
      <SkeletonCircle size="h-8 w-8" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="fp-skeleton h-3 w-1/4 rounded" />
        <div className="fp-skeleton h-2.5 w-1/2 rounded" />
      </div>
      <div className="fp-skeleton h-4 w-12 rounded" />
    </div>
  );
}
