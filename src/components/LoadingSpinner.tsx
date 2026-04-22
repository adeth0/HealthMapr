export default function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const inner = (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-10 h-10 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: '#0A84FF',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!fullScreen) return inner

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      {inner}
    </div>
  )
}
