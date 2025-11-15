// Placeholder icon component - replace with actual SVG
// Place document.svg in src/assets/icons/ and import it here

function DocumentIcon({ className = "" }: { className?: string }) {
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
      <rect x="4" y="2" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default DocumentIcon
