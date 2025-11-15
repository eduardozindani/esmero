import { useState } from 'react'
import LeftSidebar from './components/LeftSidebar'
import Canvas from './components/Canvas'
import RightSidebar from './components/RightSidebar'

function App() {
  const [canvasContent, setCanvasContent] = useState('')
  const [selectedText, setSelectedText] = useState<string | null>(null)

  return (
    <div className="h-screen flex">
      <LeftSidebar />
      <Canvas
        content={canvasContent}
        onChange={setCanvasContent}
        onSelectionChange={setSelectedText}
      />
      <RightSidebar selectedText={selectedText} />
    </div>
  )
}

export default App
