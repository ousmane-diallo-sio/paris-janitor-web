import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

export function useUnreadMessages() {
  const { user } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || (user.role !== 'traveler' && user.role !== 'service_provider')) {
      setUnreadCount(0)
      setLoading(false)
      return
    }

    const fetchUnreadCount = async () => {
      try {
        const { data: chatRooms, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('id')
          .or(`traveler_id.eq.${user.id},provider_id.eq.${user.id}`)

        if (roomsError) throw roomsError

        if (!chatRooms || chatRooms.length === 0) {
          setUnreadCount(0)
          setLoading(false)
          return
        }

        const roomIds = chatRooms.map(room => room.id)

        const { count, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_room_id', roomIds)
          .neq('sender_id', user.id)
          .is('read_at', null)

        if (messagesError) throw messagesError

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Error fetching unread messages count:', error)
        setUnreadCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchUnreadCount()

    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return { unreadCount, loading }
}