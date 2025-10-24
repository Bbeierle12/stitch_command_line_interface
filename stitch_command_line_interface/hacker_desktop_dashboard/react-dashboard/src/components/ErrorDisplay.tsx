import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  severity?: 'error' | 'warning';
}

export function ErrorDisplay({ 
  title,
  message, 
  onRetry,
  severity = 'error'
}: ErrorDisplayProps) {
  const Icon = severity === 'error' ? XCircle : AlertTriangle;
  const colorClass = severity === 'error' ? 'text-danger' : 'text-warn';
  const bgClass = severity === 'error' ? 'bg-danger/10' : 'bg-warn/10';
  const borderClass = severity === 'error' ? 'border-danger/30' : 'border-warn/30';

  return (
    <div className={`${bgClass} border ${borderClass} rounded-lg p-6 text-center max-w-md mx-auto my-8`}>
      <Icon className={`w-12 h-12 ${colorClass} mx-auto mb-3`} />
      {title && (
        <h3 className="text-lg font-semibold text-white/90 mb-2">{title}</h3>
      )}
    <p className="text-sm text-white/70 mb-4">{message}</p>
      {onRetry && (
      <button
          onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan hover:bg-cyan/90 text-ink rounded transition-colors font-medium text-sm"
        >
      <RefreshCw className="w-4 h-4" />
          Try Again
      </button>
      )}
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
}

export function InlineError({ message, onDismiss }: InlineErrorProps) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded p-3 flex items-start gap-2">
    <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
      <div className="flex-1">
      <p className="text-sm text-danger">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
      className="text-danger/60 hover:text-danger transition-colors"
    aria-label="Dismiss"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
