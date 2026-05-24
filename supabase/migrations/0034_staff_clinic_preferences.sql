-- Preferencias de staff aisladas por perfil y centro clínico (carpeta lógica por clínica).
CREATE TABLE IF NOT EXISTS public.staff_clinic_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_clinic_preferences_clinic
  ON public.staff_clinic_preferences(clinic_id);

CREATE INDEX IF NOT EXISTS idx_staff_clinic_preferences_profile
  ON public.staff_clinic_preferences(profile_id);

ALTER TABLE public.staff_clinic_preferences ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.staff_clinic_preferences IS
  'Configuración UI y preferencias del staff por centro clínico (aislado por profile_id + clinic_id).';
