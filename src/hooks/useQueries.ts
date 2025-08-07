import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserProfile, getProperties, createProperty, getBookings, getServices, createServiceRequest } from '@/lib/database'
import { useAuthStore } from '@/stores/auth'

export const useUserProfile = () => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => user ? getUserProfile(user.id) : null,
    enabled: !!user,
  })
}

export const useProperties = (ownerId?: string) => {
  return useQuery({
    queryKey: ['properties', ownerId],
    queryFn: () => getProperties(ownerId),
  })
}

export const useCreateProperty = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export const useBookings = (userId?: string, role?: string) => {
  return useQuery({
    queryKey: ['bookings', userId, role],
    queryFn: () => getBookings(userId, role),
    enabled: !!userId,
  })
}

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  })
}

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}
