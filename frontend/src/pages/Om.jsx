import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { DEFAULT_CLINIC_SETTINGS, getClinicSettings } from "@/lib/clinicSettings";

export default function Om() {
  const [settings, setSettings] = useState(DEFAULT_CLINIC_SETTINGS);

  useEffect(() => {
    getClinicSettings().then(setSettings).catch(() => {});
  }, []);

  const sections = Array.isArray(settings.about_sections) ? settings.about_sections : [];

  return (
    <div className="px-5 pt-24 pb-8" data-testid="page-om">
      {settings.about_hero_image_url && (
        <img
          src={settings.about_hero_image_url}
          alt={settings.about_title || settings.clinic_name || "Klinikken"}
          className="mb-5 h-64 w-full rounded-3xl border border-[#EBE5DC] object-cover shadow-sm"
        />
      )}

      <section className="bg-white rounded-3xl border border-[#EBE5DC] p-6 shadow-sm">
        {settings.logo_url && (
          <img
            src={settings.logo_url}
            alt={`${settings.clinic_name || "Klinikk"} logo`}
            className="mb-5 max-h-20 max-w-[220px] object-contain"
          />
        )}
        <p className="text-xs uppercase tracking-[0.22em] text-[#B89953]">Om klinikken</p>
        {settings.about_title && <h1 className="font-serif text-3xl text-[#2C2A26] mt-3">{settings.about_title}</h1>}
        {settings.about_text && <p className="text-sm leading-7 text-[#6B655B] mt-4 whitespace-pre-line">{settings.about_text}</p>}
      </section>

      {settings.about_secondary_image_url && (
        <img
          src={settings.about_secondary_image_url}
          alt={`${settings.clinic_name || "Klinikken"} interiør`}
          className="mt-5 h-52 w-full rounded-3xl border border-[#EBE5DC] object-cover shadow-sm"
        />
      )}

      {sections.length > 0 && (
        <section className="mt-5 grid gap-3">
          {sections.map((section, index) => (
            <div key={`${section.title}-${index}`} className="bg-white rounded-3xl border border-[#EBE5DC] p-5 flex gap-4">
              <div className="h-11 w-11 shrink-0 rounded-2xl bg-[#F0E9DF] flex items-center justify-center text-[#B89953]">
                <Heart size={21} strokeWidth={1.5} />
              </div>
              <div>
                {section.title && <h2 className="text-sm font-semibold text-[#2C2A26]">{section.title}</h2>}
                {section.text && <p className="text-sm leading-6 text-[#6B655B] mt-1 whitespace-pre-line">{section.text}</p>}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
