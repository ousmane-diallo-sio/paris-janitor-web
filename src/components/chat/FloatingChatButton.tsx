import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { ChatOverlay } from './ChatOverlay'

export function FloatingChatButton() {
  const { user } = useAuthStore()
  const { unreadCount } = useUnreadMessages()
  const [isChatOpen, setIsChatOpen] = useState(false)

  if (!user || (user.role !== 'traveler' && user.role !== 'service_provider')) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="lg"
          onClick={() => setIsChatOpen(true)}
          className={`h-16 w-16 rounded-full bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fc3f1] hover:to-[#1e5bef] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative group ${
            unreadCount > 0 ? 'animate-pulse' : ''
          }`}
        >
          <MessageCircle className="h-6 w-6" />
          
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
              <span className="text-xs text-white font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}
          
          {unreadCount > 0 && (
            <div className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping"></div>
          )}
          
          <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            {user.role === 'traveler' ? 'Messages avec vos prestataires' : 'Messages avec vos clients'}
            {unreadCount > 0 && (
              <span className="block text-xs text-red-300 mt-1">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''} message{unreadCount > 1 ? 's' : ''}
              </span>
            )}
            <div className="absolute top-1/2 left-full transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
          </div>
        </Button>
      </div>
      
      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </>
  )
}