'use client';

interface PageErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageErrorState({
  title = '加载失败',
  message,
  actionLabel,
  onAction,
}: PageErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        {actionLabel && onAction ? (
          <button
            onClick={onAction}
            className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
