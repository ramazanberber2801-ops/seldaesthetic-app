import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
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
    if (!form.clinic_name.trim() || !form.address.trim() || !form.phone.trim()) {
      toast.error("Klinikknavn, adresse og telefon må fylles ut");
      return;
    }

    setBusy(true);
    try {
      const updated = await updateClinicSettings(form);
      setForm(updated);
      toast.success("Kontaktinformasjonen er lagret");
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

  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-30 border-b border-[#EBE5DC] bg-white">
        <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-sm text-[#2C2A26]">
            <ArrowLeft size={18} />Admin
          </button>
          <div className="font-serif-display text-xl text-[#B89953]">Klinikkinfo</div>
          <div className="w-14" />
        </div>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-6">
        <div className="space-y-4 rounded-3xl border border-[#EBE5DC] bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-xs text-[#6B655B]">Klinikknavn</label>
            <Input value={form.clinic_name} onChange={(e) => field("clinic_name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B655B]">Undertittel</label>
            <Input value={form.subtitle} onChange={(e) => field("subtitle", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B655B]">Adresse</label>
            <Input value={form.address} onChange={(e) => field("address", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B655B]">Telefon</label>
            <Input value={form.phone} onChange={(e) => field("phone", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B655B]">Åpningstider</label>
            <Textarea rows={6} value={form.opening_hours} onChange={(e) => field("opening_hours", e.target.value)} placeholder="Én linje per dag eller tidsrom" />
            <p className="mt-1 text-[11px] text-[#9C968C]">Skriv hver åpningstid på egen linje.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B655B]">Instagram-lenke</label>
            <Input value={form.instagram_url} onChange={(e) => field("instagram_url", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6B655B]">Instagram-navn</label>
            <Input value={form.instagram_handle} onChange={(e) => field("instagram_handle", e.target.value)} />
          </div>
          <button disabled={busy} onClick={save} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C5A059] text-white disabled:opacity-50">
            <Save size={17} />{busy ? "Lagrer..." : "Lagre endringer"}
          </button>
        </div>
      </div>
    </div>
  );
}
