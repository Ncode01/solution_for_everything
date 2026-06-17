/**
 * Supabase Database type definitions — handwritten to match the migration schema.
 * Re-generate with: npm run supabase:types
 * (requires project to be linked: supabase link --project-ref YOUR_REF)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          username: string | null;
          display_name: string;
          role: string;
          committee: string | null;
          grade_or_class: string | null;
          email: string | null;
          phone: string | null;
          skills: string[];
          availability_status: string;
          workload_level: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          name: string;
          year: number;
          type: string;
          status: string;
          priority: string;
          description: string | null;
          owner_id: string | null;
          start_date: string | null;
          end_date: string | null;
          final_event_date: string | null;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      phases: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          owner_id: string | null;
          start_date: string | null;
          end_date: string | null;
          status: string;
          progress: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['phases']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['phases']['Insert']>;
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          phase_id: string | null;
          name: string;
          due_date: string | null;
          owner_id: string | null;
          status: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['milestones']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['milestones']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          phase_id: string | null;
          milestone_id: string | null;
          title: string;
          description: string | null;
          assignee_id: string | null;
          reviewer_id: string | null;
          due_date: string | null;
          priority: string;
          status: string;
          created_by_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      sponsors: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          contact_person: string | null;
          contact_number: string | null;
          email: string | null;
          package_name: string;
          amount: number;
          stage: string;
          assigned_member_id: string | null;
          last_contacted_date: string | null;
          next_follow_up_date: string | null;
          proposal_link: string | null;
          agreement_link: string | null;
          payment_status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sponsors']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['sponsors']['Insert']>;
      };
      meetings: {
        Row: {
          id: string;
          project_id: string | null;
          title: string;
          type: string;
          date: string | null;
          time: string | null;
          location: string | null;
          agenda: string | null;
          notes: string | null;
          next_meeting_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          project_id: string;
          type: string;
          category: string;
          amount: number;
          date: string | null;
          paid_by_id: string | null;
          approved_by_id: string | null;
          receipt_link: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      approval_requests: {
        Row: {
          id: string;
          project_id: string | null;
          related_type: string | null;
          related_id: string | null;
          title: string;
          description: string | null;
          requested_by_id: string | null;
          approver_id: string | null;
          status: string;
          submitted_date: string | null;
          decision_date: string | null;
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['approval_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['approval_requests']['Insert']>;
      };
      file_links: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          category: string;
          url: string;
          owner_id: string | null;
          status: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['file_links']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['file_links']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          type: string;
          summary: string | null;
          content: string;
          generated_by_id: string | null;
          generated_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      budgets: {
        Row: {
          id: string;
          project_id: string;
          expected_income: number;
          expected_expense: number;
          confirmed_income: number;
          confirmed_expense: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>;
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          member_id: string;
          project_role: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_members']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['project_members']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_profile_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          project_id: string | null;
          summary: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
