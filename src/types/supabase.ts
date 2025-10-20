export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
          performed_by_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          performed_by_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          anonymous_user_id: string | null
          check_in: string
          check_out: string
          commission_amount: number
          created_at: string | null
          id: string
          payment_status: string | null
          property_id: string
          status: string | null
          stripe_payment_intent_id: string | null
          total_amount: number
          traveler_id: string
          updated_at: string | null
          user_anonymized_at: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          check_in: string
          check_out: string
          commission_amount: number
          created_at?: string | null
          id?: string
          payment_status?: string | null
          property_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount: number
          traveler_id: string
          updated_at?: string | null
          user_anonymized_at?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          check_in?: string
          check_out?: string
          commission_amount?: number
          created_at?: string | null
          id?: string
          payment_status?: string | null
          property_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number
          traveler_id?: string
          updated_at?: string | null
          user_anonymized_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          chat_room_id: string | null
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          sender_id: string | null
          sender_type: string
          type: string | null
          updated_at: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          chat_room_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          sender_id?: string | null
          sender_type: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          chat_room_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          sender_id?: string | null
          sender_type?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reports: {
        Row: {
          admin_notes: string | null
          chat_room_id: string | null
          created_at: string
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          chat_room_id?: string | null
          created_at?: string
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          chat_room_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reports_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          archive_reason: string | null
          archived_by: string | null
          block_reason: string | null
          blocked_by: string | null
          created_at: string
          id: string
          is_deleted: boolean | null
          last_message: string | null
          last_message_at: string | null
          provider_avatar: string | null
          provider_id: string | null
          provider_name: string | null
          reservation_id: string | null
          status: string | null
          traveler_avatar: string | null
          traveler_id: string | null
          traveler_name: string | null
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_by?: string | null
          block_reason?: string | null
          blocked_by?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          provider_avatar?: string | null
          provider_id?: string | null
          provider_name?: string | null
          reservation_id?: string | null
          status?: string | null
          traveler_avatar?: string | null
          traveler_id?: string | null
          traveler_name?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_by?: string | null
          block_reason?: string | null
          blocked_by?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          provider_avatar?: string | null
          provider_id?: string | null
          provider_name?: string | null
          reservation_id?: string | null
          status?: string | null
          traveler_avatar?: string | null
          traveler_id?: string | null
          traveler_name?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          after_photos: string[] | null
          before_photos: string[] | null
          completed_at: string | null
          created_at: string | null
          id: string
          materials_used: Json | null
          provider_id: string
          provider_notes: string | null
          service_request_id: string
          started_at: string | null
          status: string | null
          updated_at: string | null
          work_description: string | null
        }
        Insert: {
          after_photos?: string[] | null
          before_photos?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          materials_used?: Json | null
          provider_id: string
          provider_notes?: string | null
          service_request_id: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          work_description?: string | null
        }
        Update: {
          after_photos?: string[] | null
          before_photos?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          materials_used?: Json | null
          provider_id?: string
          provider_notes?: string | null
          service_request_id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string
          chat_room_id: string | null
          created_at: string
          id: string
          moderator_id: string | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          chat_room_id?: string | null
          created_at?: string
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          chat_room_id?: string | null
          created_at?: string
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          anonymous_user_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_anonymized_at: string | null
          user_id: string
        }
        Insert: {
          anonymous_user_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_anonymized_at?: string | null
          user_id: string
        }
        Update: {
          anonymous_user_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_anonymized_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          anonymous_user_id: string | null
          booking_id: string | null
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          payee_id: string | null
          payer_id: string
          payment_type: string
          processed_at: string | null
          refund_amount: number | null
          refund_status: string | null
          refunded_at: string | null
          service_request_id: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          user_anonymized_at: string | null
        }
        Insert: {
          amount: number
          anonymous_user_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payee_id?: string | null
          payer_id: string
          payment_type: string
          processed_at?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          refunded_at?: string | null
          service_request_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          user_anonymized_at?: string | null
        }
        Update: {
          amount?: number
          anonymous_user_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          payee_id?: string | null
          payer_id?: string
          payment_type?: string
          processed_at?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          refunded_at?: string | null
          service_request_id?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          user_anonymized_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_locked: boolean
          anonymization_level: string | null
          anonymized_at: string | null
          anonymous_id: string | null
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          deletion_reason: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_anonymized_at: string | null
          last_name: string | null
          lock_reason: string | null
          locked_until: string | null
          phone: string | null
          profile_validated: boolean | null
          role: string
          stripe_customer_id: string | null
          updated_at: string | null
          vip_subscription: boolean | null
        }
        Insert: {
          account_locked?: boolean
          anonymization_level?: string | null
          anonymized_at?: string | null
          anonymous_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_anonymized_at?: string | null
          last_name?: string | null
          lock_reason?: string | null
          locked_until?: string | null
          phone?: string | null
          profile_validated?: boolean | null
          role: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          vip_subscription?: boolean | null
        }
        Update: {
          account_locked?: boolean
          anonymization_level?: string | null
          anonymized_at?: string | null
          anonymous_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_anonymized_at?: string | null
          last_name?: string | null
          lock_reason?: string | null
          locked_until?: string | null
          phone?: string | null
          profile_validated?: boolean | null
          role?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          vip_subscription?: boolean | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          anonymous_user_id: string | null
          availability_calendar: Json | null
          bathrooms: number | null
          bedrooms: number | null
          capacity: number
          city: string
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          moderation_notes: string | null
          nightly_rate: number
          owner_id: string
          postal_code: string | null
          title: string
          updated_at: string | null
          user_anonymized_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_status: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          anonymous_user_id?: string | null
          availability_calendar?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          capacity: number
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          moderation_notes?: string | null
          nightly_rate: number
          owner_id: string
          postal_code?: string | null
          title: string
          updated_at?: string | null
          user_anonymized_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          anonymous_user_id?: string | null
          availability_calendar?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          capacity?: number
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          moderation_notes?: string | null
          nightly_rate?: number
          owner_id?: string
          postal_code?: string | null
          title?: string
          updated_at?: string | null
          user_anonymized_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          anonymous_user_id: string | null
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          review_type: string
          reviewee_id: string
          reviewer_id: string
          service_request_id: string | null
          user_anonymized_at: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          review_type: string
          reviewee_id: string
          reviewer_id: string
          service_request_id?: string | null
          user_anonymized_at?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          review_type?: string
          reviewee_id?: string
          reviewer_id?: string
          service_request_id?: string | null
          user_anonymized_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string | null
          anonymous_user_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          distance_km: number | null
          duration_minutes: number | null
          id: string
          notes: string | null
          property_id: string | null
          provider_id: string | null
          quantity: number | null
          requested_date: string
          requester_id: string
          scheduled_date: string | null
          service_id: string
          status: string | null
          total_amount: number
          updated_at: string | null
          user_anonymized_at: string | null
          vip_discount: number | null
        }
        Insert: {
          address?: string | null
          anonymous_user_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          provider_id?: string | null
          quantity?: number | null
          requested_date: string
          requester_id: string
          scheduled_date?: string | null
          service_id: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_anonymized_at?: string | null
          vip_discount?: number | null
        }
        Update: {
          address?: string | null
          anonymous_user_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          property_id?: string | null
          provider_id?: string | null
          quantity?: number | null
          requested_date?: string
          requester_id?: string
          scheduled_date?: string | null
          service_id?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_anonymized_at?: string | null
          vip_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          category: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          estimated_duration: unknown | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_vip_only: boolean | null
          name: string
          price_type: string | null
          provider_id: string
          qualifications_required: string[] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          category: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          estimated_duration?: unknown | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_vip_only?: boolean | null
          name: string
          price_type?: string | null
          provider_id: string
          qualifications_required?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          estimated_duration?: unknown | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_vip_only?: boolean | null
          name?: string
          price_type?: string | null
          provider_id?: string
          qualifications_required?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          anonymous_user_id: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          status: string | null
          stripe_subscription_id: string | null
          subscription_type: string
          user_anonymized_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          anonymous_user_id?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          subscription_type: string
          user_anonymized_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          anonymous_user_id?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          subscription_type?: string
          user_anonymized_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "anonymized_user_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      anonymized_user_data: {
        Row: {
          anonymization_level: string | null
          anonymized_at: string | null
          anonymized_bookings: number | null
          anonymized_payments: number | null
          anonymized_properties: number | null
          anonymized_reviews: number | null
          anonymized_service_requests: number | null
          anonymized_subscriptions: number | null
          anonymous_id: string | null
          deleted_at: string | null
          deletion_reason: string | null
          id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_not_locked: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cleanup_inactive_push_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      execute_gdpr_purges: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_anonymous_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_anonymization_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          full_anonymized: number
          newest_anonymization: string
          oldest_anonymization: string
          partial_anonymized: number
          scheduled_for_purge: number
          total_anonymized: number
        }[]
      }
      get_popular_services: {
        Args: { limit_count?: number }
        Returns: {
          base_price: number
          category: string
          description: string
          estimated_duration: unknown
          id: string
          image_url: string
          is_vip_only: boolean
          name: string
        }[]
      }
      get_services_by_category: {
        Args: { service_category: string }
        Returns: {
          base_price: number
          category: string
          description: string
          estimated_duration: unknown
          id: string
          image_url: string
          is_vip_only: boolean
          name: string
        }[]
      }
      get_user_unread_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
    }
    Enums: {
      service_category_enum:
        | "cleaning"
        | "maintenance"
        | "transport"
        | "concierge"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      service_category_enum: [
        "cleaning",
        "maintenance",
        "transport",
        "concierge",
        "other",
      ],
    },
  },
} as const
