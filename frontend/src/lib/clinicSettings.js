import { supabase } from "@/lib/supabase";

export const DEFAULT_CLINIC_SETTINGS = {
  id: "main",
  clinic_name: "Seldaesthetic",
  subtitle: "Skjønnhetsklinikk",
  address: "Arbeidergate 35, 3050 Mjøndalen",
  phone: "45 84 74 56",
  opening_hours: "Man – Fre: 09:00 – 18:00\nLørdag: 10:00 – 16:00\nSøndag: Stengt",
  instagram_url: "https://instagram.com/seldaesthetic",
  instagram_handle: "@seldaesthetic",
};

export async function getClinicSettings() {
  const { data, error } = await supabase
    .from("clinic_settings")
    .select("*")
    .eq("id", "main")
    .maybeSingle();

  if (error) throw error;
  return { ...DEFAULT_CLINIC_SETTINGS, ...(data || {}) };
}

export async function updateClinicSettings(values) {
  const { data: sessionData } = await supabase.auth.getSession();
  const payload = {
    id: "main",
    clinic_name: values.clinic_name.trim(),
    subtitle: values.subtitle.trim(),
    address: values.address.trim(),
    phone: values.phone.trim(),
    opening_hours: values.opening_hours.trim(),
    instagram_url: values.instagram_url.trim(),
    instagram_handle: values.instagram_handle.trim(),
    updated_at: new Date().toISOString(),
    updated_by: sessionData.session?.user?.id || null,
  };

  const { data, error } = await supabase
    .from("clinic_settings")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
