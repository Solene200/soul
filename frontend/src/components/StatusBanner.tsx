'use client';

interface StatusBannerProps {
  title?: string;
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

const toneClasses = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

export function StatusBanner({
  title,
  message,
  tone = 'info',
  onClose,
}: StatusBannerProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {title ? <div className="font-semibold">{title}</div> : null}
          <div className="text-sm leading-6">{message}</div>
        </div>
        {onClose ? (
          <button
            onClick={onClose}
            className="text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
          >
            关闭
          </button>
        ) : null}
      </div>
    </div>
  );
}
