import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_CLINIC_SETTINGS, getClinicSettings } from "@/lib/clinicSettings";

const ClinicSettingsContext = createContext({
  settings: DEFAULT_CLINIC_SETTINGS,
  loading: true,
  refresh: async () => {},
});

export function ClinicSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_CLINIC_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await getClinicSettings();
      setSettings({ ...DEFAULT_CLINIC_SETTINGS, ...(data || {}) });
    } catch (error) {
      console.error("Could not load clinic settings:", error);
      setSettings(DEFAULT_CLINIC_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const clinicName = settings.clinic_name?.trim() || "Klinikk";
    const subtitle = settings.subtitle?.trim();
    const title = subtitle ? `${clinicName} – ${subtitle}` : clinicName;
    const description = subtitle
      ? `${clinicName} – ${subtitle}`
      : `${clinicName} sin klinikkapp`;

    document.title = title;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute("content", description);

    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute("content", clinicName);
  }, [settings.clinic_name, settings.subtitle]);

  const value = useMemo(() => ({ settings, loading, refresh }), [settings, loading]);

  return (
    <ClinicSettingsContext.Provider value={value}>
      {children}
    </ClinicSettingsContext.Provider>
  );
}

export function useClinicSettings() {
  return useContext(ClinicSettingsContext);
}
