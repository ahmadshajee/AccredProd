export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 text-sm text-[#F5E7C6]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#F5E7C6]/30 border-t-[#FA8112]" />
      <span>{label}</span>
    </div>
  );
}
