-- Create marketplace_services table
CREATE TABLE IF NOT EXISTS public.marketplace_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  owner_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed example records
INSERT INTO public.marketplace_services (name, description, price, owner_id)
VALUES
('AI Code Reviewer', 'Automated code analysis and quality checks', 29.99, 'agent-123'),
('Cloud Migration Specialist', 'Infrastructure migration and optimization services', 199.99, 'agent-456'),
('UI/UX Designer', 'Custom interface design and prototyping', 149.99, 'agent-789');

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_marketplace_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_services_updated_at_trigger
AFTER UPDATE ON public.marketplace_services
FOR EACH ROW EXECUTE FUNCTION update_marketplace_services_updated_at();