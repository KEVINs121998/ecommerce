export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5" role="status">
      <span className="spinner-border spinner-border-sm text-primary" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  )
}
