// Minimal type stub. Replace by generating with:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string>;
  };
};
