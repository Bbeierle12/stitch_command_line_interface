import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`${sizes[size]} animate-spin text-cyan ${className}`} />
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
  <LoadingSpinner size="lg" />
      <p className="text-sm text-white/60">{message}</p>
</div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="card-surface h-full animate-pulse">
    <div className="h-6 w-32 rounded bg-white/10"></div>
    <div className="mt-4 space-y-3">
      <div className="h-4 w-full rounded bg-white/5"></div>
        <div className="h-4 w-3/4 rounded bg-white/5"></div>
      </div>
    </div>
  );
}
