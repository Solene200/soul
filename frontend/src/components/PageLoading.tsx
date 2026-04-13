'use client';

interface PageLoadingProps {
  label?: string;
  tone?: 'blue' | 'purple' | 'pink';
}

const toneClasses = {
  blue: 'border-blue-600',
  purple: 'border-purple-600',
  pink: 'border-pink-600',
};

export function PageLoading({
  label = '加载中...',
  tone = 'blue',
}: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div
          className={`inline-block h-12 w-12 animate-spin rounded-full border-4 ${toneClasses[tone]} border-t-transparent`}
        />
        <p className="mt-4 text-gray-600">{label}</p>
      </div>
    </div>
  );
}
