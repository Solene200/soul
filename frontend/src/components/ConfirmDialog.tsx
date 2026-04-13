'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmTone?: 'default' | 'danger';
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  confirmTone = 'default',
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmTone === 'danger'
                ? 'bg-gradient-to-r from-red-500 to-rose-600'
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
