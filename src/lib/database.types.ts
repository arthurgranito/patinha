
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "app_config": {
                  Row: {
                    "key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"challenge_entries": {
                  Row: {
                    "challenge_id": string,"completed_at": string | null,"dog_id": string,"joined_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "challenge_id": string,"completed_at"?: string | null,"dog_id": string,"joined_at"?: string
                  }
                  Update: {
                    "challenge_id"?: string,"completed_at"?: string | null,"dog_id"?: string,"joined_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenge_entries_challenge_id_fkey"
      columns: ["challenge_id"]
isOneToOne: false
      referencedRelation: "challenges"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "challenge_entries_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    }
                  ]
                },"challenges": {
                  Row: {
                    "created_at": string,"exercise_id": string,"id": string,"is_premium": boolean,"month": string,"published": boolean,"reviewed_by": string | null,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"exercise_id": string,"id"?: string,"is_premium"?: boolean,"month": string,"published"?: boolean,"reviewed_by"?: string | null,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "created_at"?: string,"exercise_id"?: string,"id"?: string,"is_premium"?: boolean,"month"?: string,"published"?: boolean,"reviewed_by"?: string | null,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "challenges_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"dog_achievements": {
                  Row: {
                    "awarded_at": string,"code": string,"dog_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "awarded_at"?: string,"code": string,"dog_id": string
                  }
                  Update: {
                    "awarded_at"?: string,"code"?: string,"dog_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dog_achievements_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    }
                  ]
                },"dog_days": {
                  Row: {
                    "day": string,"dog_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day": string,"dog_id": string,"status": string
                  }
                  Update: {
                    "day"?: string,"dog_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dog_days_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    }
                  ]
                },"dog_goals": {
                  Row: {
                    "dog_id": string,"flagged_severe": boolean,"goal_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dog_id": string,"flagged_severe"?: boolean,"goal_code": string
                  }
                  Update: {
                    "dog_id"?: string,"flagged_severe"?: boolean,"goal_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dog_goals_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    }
                  ]
                },"dog_programs": {
                  Row: {
                    "created_at": string,"current_day": number,"dog_id": string,"id": string,"program_id": string,"started_on": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"current_day"?: number,"dog_id": string,"id"?: string,"program_id": string,"started_on": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"current_day"?: number,"dog_id"?: string,"id"?: string,"program_id"?: string,"started_on"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dog_programs_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dog_programs_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"dog_skills": {
                  Row: {
                    "dog_id": string,"exercise_id": string,"level": number,"mastered_at": string | null,"streak_success": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dog_id": string,"exercise_id": string,"level"?: number,"mastered_at"?: string | null,"streak_success"?: number,"updated_at"?: string
                  }
                  Update: {
                    "dog_id"?: string,"exercise_id"?: string,"level"?: number,"mastered_at"?: string | null,"streak_success"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dog_skills_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "dog_skills_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"dogs": {
                  Row: {
                    "archived_at": string | null,"birth_month": string,"breed": string | null,"created_at": string,"daily_minutes": number,"energy": string,"id": string,"is_srd": boolean,"name": string,"owner_id": string,"passed_away_at": string | null,"photo_path": string | null,"size": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"birth_month": string,"breed"?: string | null,"created_at"?: string,"daily_minutes": number,"energy": string,"id"?: string,"is_srd"?: boolean,"name": string,"owner_id"?: string,"passed_away_at"?: string | null,"photo_path"?: string | null,"size": string
                  }
                  Update: {
                    "archived_at"?: string | null,"birth_month"?: string,"breed"?: string | null,"created_at"?: string,"daily_minutes"?: number,"energy"?: string,"id"?: string,"is_srd"?: boolean,"name"?: string,"owner_id"?: string,"passed_away_at"?: string | null,"photo_path"?: string | null,"size"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "dogs_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"entitlements": {
                  Row: {
                    "entitlement": string,"expires_at": string | null,"product_id": string | null,"status": string,"store": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "entitlement"?: string,"expires_at"?: string | null,"product_id"?: string | null,"status": string,"store"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "entitlement"?: string,"expires_at"?: string | null,"product_id"?: string | null,"status"?: string,"store"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "entitlements_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "category": string,"created_at": string,"duration_min": number,"goal_codes": (string)[],"id": string,"is_premium": boolean,"levels": NonNullable<Json>,"min_age_weeks": number,"published": boolean,"reviewed_by": string | null,"safety_note": string | null,"slug": string,"steps": NonNullable<Json>,"summary": string,"tips": NonNullable<Json>,"title": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"duration_min": number,"goal_codes"?: (string)[],"id"?: string,"is_premium"?: boolean,"levels": NonNullable<Json>,"min_age_weeks"?: number,"published"?: boolean,"reviewed_by"?: string | null,"safety_note"?: string | null,"slug": string,"steps": NonNullable<Json>,"summary": string,"tips"?: NonNullable<Json>,"title": string,"video_url"?: string | null
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"duration_min"?: number,"goal_codes"?: (string)[],"id"?: string,"is_premium"?: boolean,"levels"?: NonNullable<Json>,"min_age_weeks"?: number,"published"?: boolean,"reviewed_by"?: string | null,"safety_note"?: string | null,"slug"?: string,"steps"?: NonNullable<Json>,"summary"?: string,"tips"?: NonNullable<Json>,"title"?: string,"video_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "active_dog_id": string | null,"adult_confirmed_at": string | null,"created_at": string,"day_cutoff_hour": number,"display_name": string,"id": string,"is_adult_confirmed": boolean,"reminder_hour": number,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_dog_id"?: string | null,"adult_confirmed_at"?: string | null,"created_at"?: string,"day_cutoff_hour"?: number,"display_name": string,"id": string,"is_adult_confirmed"?: boolean,"reminder_hour"?: number,"timezone"?: string
                  }
                  Update: {
                    "active_dog_id"?: string | null,"adult_confirmed_at"?: string | null,"created_at"?: string,"day_cutoff_hour"?: number,"display_name"?: string,"id"?: string,"is_adult_confirmed"?: boolean,"reminder_hour"?: number,"timezone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_active_dog_id_fkey"
      columns: ["active_dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    }
                  ]
                },"program_items": {
                  Row: {
                    "day_index": number,"exercise_id": string,"position": number,"program_id": string,"target_level": number
                  }
                  ComputedFields: never
                  Insert: {
                    "day_index": number,"exercise_id": string,"position": number,"program_id": string,"target_level": number
                  }
                  Update: {
                    "day_index"?: number,"exercise_id"?: string,"position"?: number,"program_id"?: string,"target_level"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_items_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "program_items_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"programs": {
                  Row: {
                    "created_at": string,"goal_code": string,"id": string,"is_premium": boolean,"min_age_weeks": number,"published": boolean,"reviewed_by": string | null,"slug": string,"sort": number,"summary": string | null,"title": string,"weeks": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"goal_code": string,"id"?: string,"is_premium"?: boolean,"min_age_weeks"?: number,"published"?: boolean,"reviewed_by"?: string | null,"slug": string,"sort"?: number,"summary"?: string | null,"title": string,"weeks": number
                  }
                  Update: {
                    "created_at"?: string,"goal_code"?: string,"id"?: string,"is_premium"?: boolean,"min_age_weeks"?: number,"published"?: boolean,"reviewed_by"?: string | null,"slug"?: string,"sort"?: number,"summary"?: string | null,"title"?: string,"weeks"?: number
                  }
                  Relationships: [
                    
                  ]
                },"push_tokens": {
                  Row: {
                    "created_at": string,"id": string,"platform": string,"token": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"platform": string,"token": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"platform"?: string,"token"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"streak_freezes": {
                  Row: {
                    "created_at": string,"day": string,"dog_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"day": string,"dog_id": string
                  }
                  Update: {
                    "created_at"?: string,"day"?: string,"dog_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "streak_freezes_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    }
                  ]
                },"training_sessions": {
                  Row: {
                    "created_at": string,"dog_id": string,"dog_program_id": string | null,"done_at": string,"done_on": string,"duration_sec": number,"exercise_id": string,"id": string,"level": number,"program_day": number | null,"result": string,"source": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dog_id": string,"dog_program_id"?: string | null,"done_at"?: string,"done_on": string,"duration_sec"?: number,"exercise_id": string,"id"?: string,"level": number,"program_day"?: number | null,"result": string,"source"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"dog_id"?: string,"dog_program_id"?: string | null,"done_at"?: string,"done_on"?: string,"duration_sec"?: number,"exercise_id"?: string,"id"?: string,"level"?: number,"program_day"?: number | null,"result"?: string,"source"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "training_sessions_dog_id_fkey"
      columns: ["dog_id"]
isOneToOne: false
      referencedRelation: "dogs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_sessions_dog_program_id_fkey"
      columns: ["dog_program_id"]
isOneToOne: false
      referencedRelation: "dog_programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_sessions_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_sessions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_write_dog_photo":
{ Args: { "p_name": string }; Returns: boolean
                           },
"confirm_adult":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"create_dog":
{ Args: { "p_birth_month": string,"p_breed": string,"p_daily_minutes": number,"p_energy": string,"p_goals": Json,"p_is_srd": boolean,"p_name": string,"p_size": string }; Returns: {
              "archived_at": string | null,
"birth_month": string,
"breed": string | null,
"created_at": string,
"daily_minutes": number,
"energy": string,
"id": string,
"is_srd": boolean,
"name": string,
"owner_id": string,
"passed_away_at": string | null,
"photo_path": string | null,
"size": string
            }
                          SetofOptions: {
        from: "*"
        to: "dogs"
        isOneToOne: true
        isSetofReturn: false
      } },
"default_display_name":
{ Args: { "p_email": string,"p_meta": Json }; Returns: string
                           },
"ensure_profile":
{ Args: Record<PropertyKey, never>; Returns: {
              "active_dog_id": string | null,
"adult_confirmed_at": string | null,
"created_at": string,
"day_cutoff_hour": number,
"display_name": string,
"id": string,
"is_adult_confirmed": boolean,
"reminder_hour": number,
"timezone": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"get_exercise":
{ Args: { "p_slug": string }; Returns: {
              "category": string,"duration_min": number,"id": string,"is_premium": boolean,"levels": Json,"locked": boolean,"min_age_weeks": number,"safety_note": string,"slug": string,"steps": Json,"summary": string,"tips": Json,"title": string,"video_url": string
            }[]
                           },
"is_adult":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_premium":
{ Args: { "p_user_id": string }; Returns: boolean
                           },
"owns_dog":
{ Args: { "p_dog_id": string }; Returns: boolean
                           },
"reassign_active_dog":
{ Args: { "p_gone": string,"p_owner": string }; Returns: undefined
                           },
"save_dog_goals":
{ Args: { "p_dog_id": string,"p_goals": Json }; Returns: {
              "dog_id": string,
"flagged_severe": boolean,
"goal_code": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "dog_goals"
        isOneToOne: false
        isSetofReturn: true
      } },
"user_day":
{ Args: { "p_ts"?: string,"p_user_id": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
