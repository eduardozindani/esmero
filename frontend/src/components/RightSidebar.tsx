interface RightSidebarProps {
  selectedText: string | null
}

function RightSidebar({ selectedText }: RightSidebarProps) {
  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
      <p className="text-sm text-gray-500 mb-4">Agent</p>
      {selectedText && (
        <div className="text-xs text-gray-400 bg-white p-2 rounded border border-gray-200">
          <p className="font-medium mb-1">Selected:</p>
          <p className="italic">{selectedText}</p>
        </div>
      )}
    </div>
  )
}

export default RightSidebar
