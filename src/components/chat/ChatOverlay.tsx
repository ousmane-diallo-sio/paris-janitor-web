import { useState, useEffect, useCallback } from 'react'
import { X, Minimize2, ArrowLeft, MessageCircle, User, Wrench, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

interface ChatOverlayProps {
  isOpen: boolean
  onClose: () => void
}

interface ChatRoom {
  id: string
  traveler_id: string | null
  provider_id: string | null
  reservation_id: string | null
  created_at: string
  status: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number | null
  traveler_profile?: Profile | null
  provider_profile?: Profile | null
}

export function ChatOverlay({ isOpen, onClose }: ChatOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  if (!isOpen) return null

  const handleChatSelect = (user: Profile) => {
    setSelectedUser(user)
  }

  const handleBackToList = () => {
    setSelectedUser(null)
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      <div className={`fixed z-50 transition-all duration-300 transform ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 h-12' 
          : 'bottom-4 right-4 w-96 h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] sm:bottom-6 sm:right-6'
      } animate-in slide-in-from-bottom-4 slide-in-from-right-4`}>
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden h-full">
          <div className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              {selectedUser && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20 flex-shrink-0"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <MessageCircle className="h-5 w-5 flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {selectedUser ? selectedUser.full_name || 'Conversation' : 'Messages'}
              </h3>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {!isMinimized && (
            <div className="flex-1 overflow-hidden">
              {selectedUser ? (
                <div className="h-full">
                  <ChatWindow 
                    otherUser={selectedUser}
                    onClose={handleBackToList}
                  />
                </div>
              ) : (
                <div className="h-full">
                  <OverlayChatList onChatSelect={handleChatSelect} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function OverlayChatList({ onChatSelect }: { onChatSelect: (user: Profile) => void }) {
  const { user } = useAuthStore()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadChatRooms = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('chat_rooms')
        .select(`
          *,
          traveler_profile:profiles!chat_rooms_traveler_id_fkey(*),
          provider_profile:profiles!chat_rooms_provider_id_fkey(*)
        `)
        .neq('status', 'deleted')
        .order('updated_at', { ascending: false })

      if (user.role === 'service_provider') {
        query = query.eq('provider_id', user.id)
      } else if (user.role === 'traveler') {
        query = query.eq('traveler_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error
      setChatRooms(data || [])
    } catch (error) {
      console.error('Error loading chat rooms:', error)
      toast.error('Erreur lors du chargement des conversations')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user && (user.role === 'service_provider' || user.role === 'traveler')) {
      loadChatRooms()
    }
  }, [user, loadChatRooms])

  const filteredChatRooms = chatRooms.filter(room => {
    if (!searchTerm) return true
    
    const otherUser = user?.role === 'service_provider' 
      ? room.traveler_profile 
      : room.provider_profile
    
    return otherUser?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getUserInitials = (profile: Profile | undefined) => {
    if (!profile) return '?'
    return profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    }
  }

  if (!user || (user.role !== 'service_provider' && user.role !== 'traveler')) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500">
        <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chat non disponible</h3>
        <p className="text-center text-sm">
          Le chat est disponible uniquement pour les prestataires et voyageurs
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 h-full flex flex-col">
      <div className="relative mb-3 sm:mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-sm h-9"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredChatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <MessageCircle className="h-10 w-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">Aucune conversation</p>
            <p className="text-xs text-center">
              {searchTerm ? 'Aucun résultat' : 'Vos conversations apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 sm:space-y-2">
            {filteredChatRooms.map((room) => {
              const otherUser = user.role === 'service_provider' 
                ? room.traveler_profile 
                : room.provider_profile
              
              if (!otherUser) return null

              return (
                <div
                  key={room.id}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                  onClick={() => onChatSelect(otherUser)}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-xs sm:text-sm">
                      {getUserInitials(otherUser)}
                    </div>
                    {room.unread_count && room.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                        {room.unread_count > 9 ? '9+' : room.unread_count}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate text-xs sm:text-sm">
                        {otherUser.full_name}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(room.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate">
                        {room.last_message || 'Aucun message'}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-400 flex-shrink-0">
                        {otherUser.role === 'service_provider' ? (
                          <Wrench className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}