import { useEffect, useState } from "react";
import { ArrowLeft, Check, Gift, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  activateLoyaltyCampaign,
  archiveLoyaltyCampaign,
  createLoyaltyCampaign,
  listLoyaltyCampaigns,
} from "@/lib/api";

const EMPTY = { name: "", reward: "", stamp_goal: "10", starts_at: "", ends_at: "" };

export default function AdminLoyaltyCampaigns() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try { setItems(await listLoyaltyCampaigns()); }
    catch (error) { toast.error(error.message || "Kunne ikke laste lojalitetskort"); }
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    const goal = Number(form.stamp_goal);
    if (!form.name.trim() || !form.reward.trim()) return toast.error("Fyll inn navn og belønning");
    if (!Number.isInteger(goal) || goal < 1 || goal > 30) return toast.error("Antall stempler må være mellom 1 og 30");
    setBusy(true);
    try {
      await createLoyaltyCampaign(form);
      toast.success("Nytt lojalitetskort er lagret som utkast");
      setForm(EMPTY);
      setCreating(false);
      await refresh();
    } catch (error) {
      toast.error(error.message || "Kunne ikke lagre kortet");
    } finally { setBusy(false); }
  };

  const activate = async (item) => {
    if (!window.confirm(`Aktivere «${item.name}» som nytt kort? Kunder med et kort i gang beholder sitt gamle til det er fullt og innløst.`)) return;
    setBusy(true);
    try {
      await activateLoyaltyCampaign(item.id);
      toast.success("Det nye lojalitetskortet er aktivert");
      await refresh();
    } catch (error) {
      toast.error(error.message || "Kunne ikke aktivere kortet");
    } finally { setBusy(false); }
  };

  const archive = async (item) => {
    if (!window.confirm(`Arkivere «${item.name}»?`)) return;
    setBusy(true);
    try {
      await archiveLoyaltyCampaign(item.id);
      toast.success("Kortet er arkivert");
      await refresh();
    } catch (error) {
      toast.error(error.message || "Kunne ikke arkivere kortet");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-0 z-30 border-b border-[#EBE5DC] bg-white">
        <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-sm text-[#2C2A26]"><ArrowLeft size={18} />Tilbake</button>
          <div className="font-serif-display text-xl text-[#B89953]">Lojalitetskort</div>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-screen-md space-y-4 px-4 py-6">
        <div className="rounded-2xl bg-[#F4ECD8] px-4 py-3 text-sm leading-6 text-[#6B655B]">
          Når du aktiverer et nytt kort, beholder kunder med pågående kort det gamle tilbudet og antall stempler. De går over til det nye først etter at det gamle er fullt og innløst.
        </div>

        {!creating ? (
          <button onClick={() => setCreating(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C5A059] text-white"><Plus size={18} />Lag nytt lojalitetskort</button>
        ) : (
          <div className="space-y-3 rounded-3xl border border-[#EBE5DC] bg-white p-5">
            <h2 className="font-serif-display text-2xl">Nytt lojalitetskort</h2>
            <Input placeholder="Navn, f.eks. Hudpleiekort høst 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Belønning, f.eks. Gratis HydraSkin" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
            <div>
              <label className="mb-1 block text-xs text-[#6B655B]">Antall stempler</label>
              <Input type="number" min="1" max="30" value={form.stamp_goal} onChange={(e) => setForm({ ...form, stamp_goal: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-[#6B655B]">Startdato, valgfritt</label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><label className="mb-1 block text-xs text-[#6B655B]">Sluttdato, valgfritt</label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={busy} onClick={() => { setCreating(false); setForm(EMPTY); }} className="h-12 rounded-full border border-[#EBE5DC]">Avbryt</button>
              <button disabled={busy} onClick={save} className="h-12 rounded-full bg-[#C5A059] text-white disabled:opacity-50">{busy ? "Lagrer …" : "Lagre utkast"}</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-[#EBE5DC] bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4ECD8] text-[#B89953]"><Gift size={20} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif-display text-xl text-[#2C2A26]">{item.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] ${item.status === "active" ? "bg-[#EAF3E5] text-[#4E6B42]" : item.status === "draft" ? "bg-[#F4ECD8] text-[#8C6B2F]" : "bg-[#F1EFEB] text-[#777168]"}`}>{item.status === "active" ? "Aktivt" : item.status === "draft" ? "Utkast" : "Arkivert"}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#6B655B]">{item.stamp_goal} stempler • {item.reward}</p>
                </div>
              </div>

              {item.status !== "active" && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button disabled={busy} onClick={() => archive(item)} className="h-11 rounded-full border border-[#EBE5DC] text-sm">Arkiver</button>
                  <button disabled={busy} onClick={() => activate(item)} className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C2A26] text-sm text-white"><Check size={16} />Aktiver</button>
                </div>
              )}
            </div>
          ))}
          {!items.length && <div className="rounded-3xl bg-white p-8 text-center text-sm text-[#6B655B]">Ingen lojalitetskort ennå.</div>}
        </div>
      </div>
    </div>
  );
}
