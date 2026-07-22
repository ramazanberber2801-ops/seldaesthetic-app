import { APP_CONFIG, getConfiguredClinicSelector } from "@/config/appConfig";
import { supabase } from "@/lib/supabase";

let cachedClinic = null;
let pendingClinic = null;

function normalizeHost(hostname) {
  return (hostname || "").toLowerCase().split(":")[0];
}

function getQueryClinicSlug() {
  if (typeof window === "undefined") return "";
  const value = new URLSearchParams(window.location.search).get(APP_CONFIG.clinicQueryParameter);
  return (value || "").trim().toLowerCase();
}

function buildClinicSelector() {
  const querySlug = getQueryClinicSlug();
  if (querySlug) return { field: "slug", value: querySlug };

  const host = typeof window === "undefined" ? "" : normalizeHost(window.location.hostname);
  if (host && !APP_CONFIG.localHosts.has(host)) return { field: "primary_domain", value: host };

  return getConfiguredClinicSelector();
}

export async function getCurrentClinic() {
  if (cachedClinic) return cachedClinic;
  if (pendingClinic) return pendingClinic;

  pendingClinic = (async () => {
    const selector = buildClinicSelector();
    if (!selector) {
      throw new Error(
        "Ingen klinikk kunne velges. Sett REACT_APP_DEFAULT_CLINIC_ID eller REACT_APP_DEFAULT_CLINIC_SLUG for lokalt miljø.",
      );
    }

    const { data, error } = await supabase
      .from("clinics")
      .select("id,slug,name,primary_domain,status")
      .eq("status", "active")
      .eq(selector.field, selector.value)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Fant ingen aktiv klinikk for ${selector.field}: ${selector.value}`);

    cachedClinic = data;
    return data;
  })().finally(() => {
    pendingClinic = null;
  });

  return pendingClinic;
}

export async function getCurrentClinicId() {
  const clinic = await getCurrentClinic();
  return clinic.id;
}

export function clearCurrentClinicCache() {
  cachedClinic = null;
  pendingClinic = null;
}
