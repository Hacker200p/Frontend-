import { memo } from 'react'

// Memoized loading component to prevent unnecessary re-renders
const Loading = memo(({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4',
  }

  const containerClass = fullScreen 
    ? 'flex items-center justify-center min-h-screen bg-gray-50'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div 
          className={`animate-spin rounded-full border-blue-600 border-b-transparent mx-auto mb-4 ${sizeClasses[size]}`}
        />
        {message && (
          <p className="text-gray-600 text-sm md:text-base">{message}</p>
        )}
      </div>
    </div>
  )
})

Loading.displayName = 'Loading'

export default Loading
