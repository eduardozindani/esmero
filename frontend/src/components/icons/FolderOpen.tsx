// Placeholder icon component - replace with actual SVG
// Place folder-open.svg in src/assets/icons/ and import it here

function FolderOpen({ className = "" }: { className?: string }) {
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
      <rect x="1" y="4" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M1 6h14" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 4V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export default FolderOpen
