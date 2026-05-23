-- Lion Tools Schema
-- Documents (for Lion Docs + Lion Notes)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'doc', -- 'doc' or 'note'
  title TEXT NOT NULL DEFAULT 'Untitled',
  body TEXT DEFAULT '',
  subject TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Spreadsheets (Lion Sheets)
CREATE TABLE IF NOT EXISTS spreadsheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Sheet',
  data JSONB DEFAULT '{"rows": [["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", ""]], "cols": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Slide Decks (Lion Slides)
CREATE TABLE IF NOT EXISTS slide_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  slides JSONB DEFAULT '[{"title": "Slide 1", "body": "", "bg": "green"}]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE slide_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_owner" ON documents FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "sheets_owner" ON spreadsheets FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "decks_owner" ON slide_decks FOR ALL USING (auth.uid() = owner_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER spreadsheets_updated_at BEFORE UPDATE ON spreadsheets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER slide_decks_updated_at BEFORE UPDATE ON slide_decks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
