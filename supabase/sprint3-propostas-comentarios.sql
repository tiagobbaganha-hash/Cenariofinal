-- ============================================================
-- CENÁRIOX — SPRINT 3: PROPOSTAS DE MERCADOS
-- Execute no SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.market_proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  category text DEFAULT 'Geral',
  suggested_options text[], -- array de opções sugeridas
  status text DEFAULT 'pending', -- pending, approved, rejected
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_market_id uuid REFERENCES markets(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE market_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposals_select ON market_proposals FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY proposals_insert ON market_proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY proposals_update_admin ON market_proposals FOR UPDATE USING (is_admin());

-- Adicionar coluna market_id nos comentários se não existe
ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS market_id uuid REFERENCES markets(id);
CREATE INDEX IF NOT EXISTS idx_comments_market ON community_comments(market_id);

-- RLS para comentários
DROP POLICY IF EXISTS comments_select ON community_comments;
DROP POLICY IF EXISTS comments_insert ON community_comments;
DROP POLICY IF EXISTS comments_delete ON community_comments;
CREATE POLICY comments_select ON community_comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY comments_delete ON community_comments FOR DELETE USING (author_id = auth.uid() OR is_admin());

SELECT 'Propostas + comentários configurados!' as resultado;
