export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      analysis_results: {
        Row: {
          id: number
          created_at: string
          title: string
          description: string | null
          location: string | null
          data: Json
          room_count: number
          password: string | null
          client_name: string | null
          user_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          description?: string | null
          location?: string | null
          data: Json
          room_count?: number
          password?: string | null
          client_name?: string | null
          user_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          description?: string | null
          location?: string | null
          data?: Json
          room_count?: number
          password?: string | null
          client_name?: string | null
          user_id?: string | null
        }
      }
      consultation_notes: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          content: string
          analysis_id: number | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          content: string
          analysis_id?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          content?: string
          analysis_id?: number | null
        }
      }
      user_region_permissions: {
        Row: {
          id: number
          user_id: string
          city_name: string | null
          district_name: string | null
          neighborhood_name: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          city_name?: string | null
          district_name?: string | null
          neighborhood_name?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          city_name?: string | null
          district_name?: string | null
          neighborhood_name?: string | null
          created_at?: string
        }
      }
      hierarchical_data: {
        Row: {
          id: number
          city_name: string
          district_name: string
          neighborhood_name: string
          created_at: string
        }
        Insert: {
          id?: number
          city_name: string
          district_name: string
          neighborhood_name: string
          created_at?: string
        }
        Update: {
          id?: number
          city_name?: string
          district_name?: string
          neighborhood_name?: string
          created_at?: string
        }
      }
    }
  }
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          raw_user_meta_data: Json | null
          user_metadata: Json | null
        }
      }
    }
  }
}
