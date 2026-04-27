import { CheckCircle, XCircle } from 'lucide-react';

export default function AlertMessage({ type = 'error', message }) {
  if (!message) {
    return null;
  }

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isSuccess
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
