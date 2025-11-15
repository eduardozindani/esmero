function App() {
  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:3001/')
      const data = await response.json()
      console.log('Backend response:', data)
      alert(JSON.stringify(data))
    } catch (error) {
      console.error('Backend error:', error)
      alert('Error: ' + error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-light text-gray-800">Esmero</h1>
      <button
        onClick={testBackend}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Backend Connection
      </button>
    </div>
  )
}

export default App
