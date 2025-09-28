import dynamic from 'next/dynamic'

// Dynamically import the chat component to avoid SSR issues
const AITutorChat = dynamic(() => import('@/components/AITutorChat'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading AI Tutor...</p>
      </div>
    </div>
  )
})

export default function Home() {
  return <AITutorChat />
}