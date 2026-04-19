-- ============================================================
-- CENÁRIOX — SPRINT 7: LOGS DE ATIVIDADE
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  actor_role text,           -- free, pro, influencer, admin
  action text NOT NULL,      -- bet.placed, market.created, user.login, etc.
  entity_type text,          -- market, user, influencer, order, subscription
  entity_id text,
  entity_label text,         -- título legível (ex: nome do mercado)
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON activity_logs(entity_type, entity_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_admin ON activity_logs FOR ALL TO service_role USING (true);
CREATE POLICY logs_read_admin ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- View para dashboard de logs (últimas 24h agrupado por ação)
CREATE OR REPLACE VIEW v_activity_summary AS
SELECT
  action,
  entity_type,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_occurrence
FROM activity_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY action, entity_type
ORDER BY total DESC;

-- Trigger automático: logar apostas
CREATE OR REPLACE FUNCTION log_bet_placed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.user_id, 'bet.placed', 'order', NEW.id::text,
    jsonb_build_object('market_id', NEW.market_id, 'stake', NEW.stake_amount, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_bet ON orders;
CREATE TRIGGER trg_log_bet AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION log_bet_placed();

-- Trigger automático: logar criação de mercado
CREATE OR REPLACE FUNCTION log_market_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_label, metadata)
  SELECT
    auth.uid(), 'market.created', 'market', NEW.id::text, NEW.title,
    jsonb_build_object('category', NEW.category, 'status', NEW.status)
  WHERE auth.uid() IS NOT NULL;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_market ON markets;
CREATE TRIGGER trg_log_market AFTER INSERT ON markets FOR EACH ROW EXECUTE FUNCTION log_market_created();

-- Trigger automático: logar resolução de mercado
CREATE OR REPLACE FUNCTION log_market_resolved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    INSERT INTO activity_logs (action, entity_type, entity_id, entity_label, metadata)
    VALUES (
      'market.resolved', 'market', NEW.id::text, NEW.title,
      jsonb_build_object('result_option_id', NEW.result_option_id)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_market_resolve ON markets;
CREATE TRIGGER trg_log_market_resolve AFTER UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION log_market_resolved();

SELECT '✅ Sprint 7 — Logs de atividade configurados!' as resultado;
