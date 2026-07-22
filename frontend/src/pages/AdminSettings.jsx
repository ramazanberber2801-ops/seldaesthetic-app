import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getClinicSettings, updateClinicSettings } from "@/lib/clinicSettings";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getClinicSettings()
      .then(setForm)
      .catch((error) => toast.error(error.message || "Kunne ikke laste innstillinger"));
  }, []);

  const save = async () => {
    if (!form.clinic_name.trim()) {
      toast.error("Klinikknavn må fylles ut");
      return;
    }
    if (form.booking_enabled && !form.booking_url.trim()) {
      toast.error("Legg inn bookinglenke eller slå av timebestilling");
      return;
    }
    if (form.gift_card_enabled && !form.gift_card_url.trim()) {
      toast.error("Legg inn gavekortlenke eller slå av gavekort");
      return;
    }

    setBusy(true);
    try {
      const updated = await updateClinicSettings(form);
      setForm(updated);
      toast.success("Klinikkinnstillingene er lagret");
    } catch (error) {
      toast.error(error.message || "Kunne ikke lagre innstillingene");
    } finally {
      setBusy(false);
    }
  };

  if (!form) {
    return <div className="min-h-screen bg-paper p-8 text-center text-[#6B655B]">Laster innstillinger...</div>;
  }

  const field = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateSection = (index, key, value) => field("about_sections", form.about_sections.map((section, i) => i === index ? { ...section, [key]: value } : section));
  const addSection = () => field("about_sections", [...form.about_sections, { title: "", text: "" }]);
  const removeSection = (index) => field("about_sections", form.about_sections.filter((_, i) => i !== index));

  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-30 border-b border-[#EBE5DC] bg-white">
        <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-sm text-[#2C2A26]">
            <ArrowLeft size={18} />Admin
          </button>
          <div className="font-serif-display text-xl text-[#B89953]">Klinikkinnstillinger</div>
          <div className="w-14" />
        </div>
      </div>

      <div className="mx-auto max-w-screen-md space-y-5 px-4 py-6">
        <SettingsCard title="Generelt">
          <Field label="Klinikknavn"><Input value={form.clinic_name} onChange={(e) => field("clinic_name", e.target.value)} /></Field>
          <Field label="Undertittel"><Input value={form.subtitle} onChange={(e) => field("subtitle", e.target.value)} /></Field>
          <Field label="Adresse"><Input value={form.address} onChange={(e) => field("address", e.target.value)} /></Field>
          <Field label="Telefon"><Input value={form.phone} onChange={(e) => field("phone", e.target.value)} /></Field>
          <Field label="E-post"><Input type="email" value={form.email} onChange={(e) => field("email", e.target.value)} /></Field>
          <Field label="Åpningstider"><Textarea rows={5} value={form.opening_hours} onChange={(e) => field("opening_hours", e.target.value)} placeholder="Én linje per dag eller tidsrom" /></Field>
        </SettingsCard>

        <SettingsCard title="Timebestilling og gavekort">
          <Toggle label="Aktiver timebestilling" checked={form.booking_enabled} onChange={(value) => field("booking_enabled", value)} />
          {form.booking_enabled && <Field label="Booking-URL"><Input type="url" value={form.booking_url} onChange={(e) => field("booking_url", e.target.value)} placeholder="https://..." /></Field>}
          <Toggle label="Aktiver gavekort" checked={form.gift_card_enabled} onChange={(value) => field("gift_card_enabled", value)} />
          {form.gift_card_enabled && <Field label="Gavekort-URL"><Input type="url" value={form.gift_card_url} onChange={(e) => field("gift_card_url", e.target.value)} placeholder="https://..." /></Field>}
        </SettingsCard>

        <SettingsCard title="Funksjoner">
          <Toggle label="Kampanjer" checked={form.campaigns_enabled} onChange={(value) => field("campaigns_enabled", value)} />
          <Toggle label="Lojalitetskort" checked={form.loyalty_enabled} onChange={(value) => field("loyalty_enabled", value)} />
          <Toggle label="Push-varsler" checked={form.push_enabled} onChange={(value) => field("push_enabled", value)} />
        </SettingsCard>

        <SettingsCard title="Om klinikken">
          <Field label="Tittel"><Input value={form.about_title} onChange={(e) => field("about_title", e.target.value)} placeholder="Om klinikken" /></Field>
          <Field label="Beskrivelse"><Textarea rows={6} value={form.about_text} onChange={(e) => field("about_text", e.target.value)} placeholder="Skriv klinikkens egen presentasjon" /></Field>
          <div className="space-y-3">
            {form.about_sections.map((section, index) => (
              <div key={index} className="rounded-2xl border border-[#EBE5DC] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#6B655B]">Informasjonskort {index + 1}</span>
                  <button type="button" onClick={() => removeSection(index)} className="text-[#9C968C]" aria-label="Fjern informasjonskort"><Trash2 size={17} /></button>
                </div>
                <div className="space-y-3">
                  <Input value={section.title || ""} onChange={(e) => updateSection(index, "title", e.target.value)} placeholder="Overskrift" />
                  <Textarea rows={3} value={section.text || ""} onChange={(e) => updateSection(index, "text", e.target.value)} placeholder="Tekst" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addSection} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#C5A059] py-3 text-sm text-[#B89953]"><Plus size={17} />Legg til informasjonskort</button>
          </div>
        </SettingsCard>

        <SettingsCard title="Lenker og sosiale medier">
          <Field label="Nettside"><Input type="url" value={form.website_url} onChange={(e) => field("website_url", e.target.value)} /></Field>
          <Field label="Instagram-lenke"><Input type="url" value={form.instagram_url} onChange={(e) => field("instagram_url", e.target.value)} /></Field>
          <Field label="Instagram-navn"><Input value={form.instagram_handle} onChange={(e) => field("instagram_handle", e.target.value)} /></Field>
          <Field label="Facebook-lenke"><Input type="url" value={form.facebook_url} onChange={(e) => field("facebook_url", e.target.value)} /></Field>
        </SettingsCard>

        <button disabled={busy} onClick={save} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C5A059] text-white disabled:opacity-50">
          <Save size={17} />{busy ? "Lagrer..." : "Lagre endringer"}
        </button>
      </div>
    </div>
  );
}

function SettingsCard({ title, children }) {
  return <section className="space-y-4 rounded-3xl border border-[#EBE5DC] bg-white p-5 shadow-sm"><h2 className="font-serif-display text-xl text-[#2C2A26]">{title}</h2>{children}</section>;
}

function Field({ label, children }) {
  return <div><label className="mb-1 block text-xs text-[#6B655B]">{label}</label>{children}</div>;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[#FAF8F4] px-4 py-3">
      <span className="text-sm text-[#2C2A26]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[#C5A059]" />
    </label>
  );
}