-- ============================================================
-- CENÁRIOX — FIX: Enum order_side para múltiplas opções
-- Execute no Supabase SQL Editor
-- ============================================================

-- Ver valores atuais
SELECT enumlabel FROM pg_enum 
JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
WHERE pg_type.typname = 'order_side'
ORDER BY enumsortorder;

-- Adicionar opt1 a opt10 para mercados com múltiplas opções
DO $$
DECLARE v text;
BEGIN
  FOREACH v IN ARRAY ARRAY['opt1','opt2','opt3','opt4','opt5','opt6','opt7','opt8','opt9','opt10']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid 
      WHERE t.typname = 'order_side' AND e.enumlabel = v
    ) THEN
      EXECUTE format('ALTER TYPE order_side ADD VALUE %L', v);
    END IF;
  END LOOP;
END$$;

SELECT '✅ order_side enum atualizado com opt1-opt10!' as resultado;
