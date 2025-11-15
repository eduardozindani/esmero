function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-dot" style={{ animationDelay: '160ms' }} />
      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-typing-dot" style={{ animationDelay: '320ms' }} />
      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        .animate-typing-dot {
          animation: typing-dot 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default TypingIndicator
