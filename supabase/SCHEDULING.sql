-- ============================================================
-- CENÁRIOX — SCHEDULING DE MERCADOS
-- ============================================================

-- Tabela de mercados agendados
CREATE TABLE IF NOT EXISTS market_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Geral',
  options jsonb NOT NULL DEFAULT '[]',
  publish_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  resolves_at timestamptz NOT NULL,
  resolution_source text,
  auto_resolve boolean DEFAULT false,
  ai_resolve boolean DEFAULT false,
  status text DEFAULT 'scheduled', -- scheduled, published, cancelled
  market_id uuid REFERENCES markets(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE market_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schedules_admin ON market_schedules;
CREATE POLICY schedules_admin ON market_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- Função para publicar mercados agendados (chamada pelo cron)
CREATE OR REPLACE FUNCTION publish_scheduled_markets()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_schedule RECORD;
  v_market_id uuid;
  v_opt jsonb;
  v_count integer := 0;
BEGIN
  FOR v_schedule IN
    SELECT * FROM market_schedules
    WHERE status = 'scheduled'
    AND publish_at <= now()
  LOOP
    -- Criar o mercado
    INSERT INTO markets (
      title, description, category, status,
      closes_at, resolves_at,
      slug
    ) VALUES (
      v_schedule.title,
      v_schedule.description,
      v_schedule.category,
      'open',
      v_schedule.closes_at,
      v_schedule.resolves_at,
      lower(regexp_replace(v_schedule.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || extract(epoch from now())::bigint
    ) RETURNING id INTO v_market_id;

    -- Criar opções
    FOR v_opt IN SELECT * FROM jsonb_array_elements(v_schedule.options)
    LOOP
      INSERT INTO market_options (
        market_id, label, option_key, probability, odds, is_active, sort_order
      ) VALUES (
        v_market_id,
        v_opt->>'label',
        COALESCE(v_opt->>'option_key', 'opt_' || (random()*1000)::int),
        COALESCE((v_opt->>'probability')::numeric, 0.5),
        COALESCE((v_opt->>'odds')::numeric, 2.0),
        true,
        COALESCE((v_opt->>'sort_order')::int, 0)
      );
    END LOOP;

    -- Atualizar schedule com market_id
    UPDATE market_schedules SET
      status = 'published',
      market_id = v_market_id
    WHERE id = v_schedule.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;$$;

SELECT '✅ Scheduling configurado!' as resultado;
