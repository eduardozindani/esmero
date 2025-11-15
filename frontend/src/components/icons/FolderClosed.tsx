// Placeholder icon component - replace with actual SVG
// Place folder-closed.svg in src/assets/icons/ and import it here

function FolderClosed({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Placeholder - replace with actual SVG path */}
      <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M2 6h12" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export default FolderClosed
