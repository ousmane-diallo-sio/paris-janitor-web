import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, MessageCircle, User, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

interface ChatMessage {
  id: string
  content: string
  sender_id: string | null
  chat_room_id: string | null
  created_at: string
  sender_type: string
  sender_profile?: Profile | null
}

interface ChatRoom {
  id: string
  traveler_id: string | null
  provider_id: string | null
  reservation_id: string | null
  created_at: string
  status: string | null
}

interface ChatWindowProps {
  otherUser: Profile
  reservationId?: string
  onClose?: () => void
}

export function ChatWindow({ otherUser, reservationId, onClose }: ChatWindowProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const createOrGetChatRoom = useCallback(async (): Promise<string | null> => {
    if (!user) return null

    try {
      const isProvider = user.role === 'service_provider'
      const isTraveler = user.role === 'traveler'

      let query = supabase
        .from('chat_rooms')
        .select('*')

      if (isProvider) {
        query = query
          .eq('provider_id', user.id)
          .eq('traveler_id', otherUser.id)
      } else if (isTraveler) {
        query = query
          .eq('traveler_id', user.id)
          .eq('provider_id', otherUser.id)
      }

      if (reservationId) {
        query = query.eq('reservation_id', reservationId)
      }

      const { data: existingRoom, error: findError } = await query.single()

      if (findError && findError.code !== 'PGRST116') {
        throw findError
      }

      if (existingRoom) {
        setChatRoom(existingRoom)
        return existingRoom.id
      }

      const roomData = {
        status: 'active' as const,
        provider_id: isProvider ? user.id : otherUser.id,
        traveler_id: isTraveler ? user.id : otherUser.id,
        reservation_id: reservationId || null
      }

      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert(roomData)
        .select()
        .single()

      if (createError) throw createError

      setChatRoom(newRoom)
      return newRoom.id
    } catch (error) {
      console.error('Error creating/getting chat room:', error)
      toast.error('Erreur lors de la création du chat')
      return null
    }
  }, [user, otherUser, reservationId])

  const loadMessages = useCallback(async () => {
    if (!chatRoom) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender_profile:profiles!chat_messages_sender_id_fkey(*)
        `)
        .eq('chat_room_id', chatRoom.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Erreur lors du chargement des messages')
    } finally {
      setLoading(false)
    }
  }, [chatRoom])

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !chatRoom) return

    setSendingMessage(true)
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          chat_room_id: chatRoom.id,
          sender_type: user.role
        })

      if (error) throw error
      
      setNewMessage('')
      toast.success('Message envoyé!')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    createOrGetChatRoom()
  }, [createOrGetChatRoom])

  useEffect(() => {
    if (chatRoom) {
      loadMessages()
    }
  }, [chatRoom, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user || !chatRoom) return

    const channel = supabase
      .channel(`chat_messages:${chatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_room_id=eq.${chatRoom.id}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage
          
          if (newMessage.sender_id) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newMessage.sender_id)
              .single()

            setMessages(prev => [...prev, {
              ...newMessage,
              sender_profile: senderProfile || undefined
            }])
          } else {
            setMessages(prev => [...prev, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatRoom, user])

  const getUserInitials = (profile: Profile | undefined) => {
    if (!profile) return '?'
    return profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const getUserIcon = (role: string) => {
    switch (role) {
      case 'service_provider':
        return <Wrench className="h-4 w-4" />
      case 'traveler':
        return <User className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  if (!user || (user.role !== 'service_provider' && user.role !== 'traveler')) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex flex-col items-center justify-center h-full">
          <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Chat disponible uniquement pour les prestataires et voyageurs</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {getUserInitials(otherUser)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{otherUser.full_name}</h3>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                {getUserIcon(otherUser.role)}
                <span>
                  {otherUser.role === 'service_provider' ? 'Prestataire' : 'Voyageur'}
                </span>
              </div>
            </div>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-0">
        <ScrollArea className="flex-1 px-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="h-12 w-12 mb-4 text-gray-300" />
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Commencez la conversation!</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isMyMessage = message.sender_id === user.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          isMyMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                        {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Avatar className={`h-8 w-8 ${isMyMessage ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
                      <AvatarFallback className={isMyMessage ? 'bg-blue-100 text-blue-800' : 'bg-gray-200'}>
                        {isMyMessage 
                          ? getUserInitials(user)
                          : getUserInitials(message.sender_profile || undefined)
                        }
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              disabled={sendingMessage}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}