import { useEffect, useState } from "react";
import { ArrowLeft, Check, Gift, Pencil, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  activateLoyaltyCampaign,
  archiveLoyaltyCampaign,
  createCampaignReward,
  createLoyaltyCampaign,
  deleteCampaignReward,
  listCampaignRewards,
  listLoyaltyCampaigns,
  updateCampaignReward,
} from "@/lib/api";

const EMPTY = { name: "", reward: "", stamp_goal: "10", starts_at: "", ends_at: "" };
const EMPTY_REWARD = { stamps_required: "5", title: "", reward_type: "discount", discount_percent: "10", description: "", validity_days: "", redemption_mode: "keep", is_active: true };

export default function AdminLoyaltyCampaigns() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [rewardForm, setRewardForm] = useState(EMPTY_REWARD);
  const [editingReward, setEditingReward] = useState(null);

  const refresh = async () => {
    try { setItems(await listLoyaltyCampaigns()); }
    catch (error) { toast.error(error.message || "Kunne ikke laste lojalitetskort"); }
  };

  const loadRewards = async (campaign) => {
    setSelected(campaign);
    try { setRewards(await listCampaignRewards(campaign.id)); }
    catch (error) { toast.error(error.message || "Kunne ikke laste belønningstrinn"); }
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    const goal = Number(form.stamp_goal);
    if (!form.name.trim() || !form.reward.trim()) return toast.error("Fyll inn navn og sluttbelønning");
    if (!Number.isInteger(goal) || goal < 1 || goal > 30) return toast.error("Antall stempler må være mellom 1 og 30");
    setBusy(true);
    try {
      const campaign = await createLoyaltyCampaign(form);
      await createCampaignReward(campaign.id, { ...EMPTY_REWARD, stamps_required: String(goal), title: form.reward, reward_type: "custom", redemption_mode: "reset" });
      toast.success("Nytt lojalitetskort er lagret som utkast");
      setForm(EMPTY); setCreating(false); await refresh();
    } catch (error) { toast.error(error.message || "Kunne ikke lagre kortet"); }
    finally { setBusy(false); }
  };

  const saveReward = async () => {
    const threshold = Number(rewardForm.stamps_required);
    if (!selected) return;
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > selected.stamp_goal) return toast.error(`Velg mellom 1 og ${selected.stamp_goal} stempler`);
    if (!rewardForm.title.trim()) return toast.error("Skriv inn belønningen");
    if (rewardForm.reward_type === "discount" && (!Number(rewardForm.discount_percent) || Number(rewardForm.discount_percent) > 100)) return toast.error("Skriv inn gyldig rabattprosent");
    setBusy(true);
    try {
      if (editingReward) await updateCampaignReward(editingReward, rewardForm);
      else await createCampaignReward(selected.id, rewardForm);
      toast.success(editingReward ? "Belønningen er oppdatert" : "Belønningstrinnet er lagt til");
      setEditingReward(null); setRewardForm(EMPTY_REWARD); await loadRewards(selected);
    } catch (error) { toast.error(error.message?.includes("duplicate") ? "Det finnes allerede en belønning på dette stempeltrinnet" : error.message || "Kunne ikke lagre belønningen"); }
    finally { setBusy(false); }
  };

  const editReward = (reward) => {
    setEditingReward(reward.id);
    setRewardForm({
      stamps_required: String(reward.stamps_required), title: reward.title, reward_type: reward.reward_type,
      discount_percent: reward.discount_percent ? String(reward.discount_percent) : "", description: reward.description || "",
      validity_days: reward.validity_days ? String(reward.validity_days) : "", redemption_mode: reward.redemption_mode,
      is_active: reward.is_active,
    });
  };

  const removeReward = async (reward) => {
    if (!window.confirm(`Slette «${reward.title}»?`)) return;
    setBusy(true);
    try { await deleteCampaignReward(reward.id); await loadRewards(selected); toast.success("Belønningen er slettet"); }
    catch (error) { toast.error(error.message || "Kunne ikke slette belønningen"); }
    finally { setBusy(false); }
  };

  const activate = async (item) => {
    if (!window.confirm(`Aktivere «${item.name}» som nytt kort? Kunder med et kort i gang beholder sitt gamle til det er innløst.`)) return;
    setBusy(true); try { await activateLoyaltyCampaign(item.id); toast.success("Det nye lojalitetskortet er aktivert"); await refresh(); }
    catch (error) { toast.error(error.message || "Kunne ikke aktivere kortet"); } finally { setBusy(false); }
  };

  const archive = async (item) => {
    if (!window.confirm(`Arkivere «${item.name}»?`)) return;
    setBusy(true); try { await archiveLoyaltyCampaign(item.id); toast.success("Kortet er arkivert"); await refresh(); }
    catch (error) { toast.error(error.message || "Kunne ikke arkivere kortet"); } finally { setBusy(false); }
  };

  if (selected) return (
    <div className="min-h-screen bg-paper">
      <Header title="Belønningstrinn" onBack={() => { setSelected(null); setEditingReward(null); setRewardForm(EMPTY_REWARD); }} />
      <div className="mx-auto max-w-screen-md space-y-4 px-4 py-6">
        <div className="rounded-3xl border border-[#EBE5DC] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.2em] text-[#9C968C]">{selected.name}</div>
          <h2 className="mt-1 font-serif-display text-2xl">Legg til belønninger manuelt</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B655B]">Eksempel: 5 behandlinger gir 10 % rabatt, mens siste trinn kan nullstille kortet.</p>
        </div>

        <div className="space-y-3 rounded-3xl border border-[#EBE5DC] bg-white p-5">
          <div className="flex items-center justify-between"><h3 className="font-serif-display text-xl">{editingReward ? "Rediger belønning" : "Ny belønning"}</h3>{editingReward && <button onClick={() => { setEditingReward(null); setRewardForm(EMPTY_REWARD); }}><X size={18}/></button>}</div>
          <div><label className="mb-1 block text-xs text-[#6B655B]">Etter hvor mange behandlinger?</label><Input type="number" min="1" max={selected.stamp_goal} value={rewardForm.stamps_required} onChange={(e) => setRewardForm({ ...rewardForm, stamps_required: e.target.value })}/></div>
          <Input placeholder="Belønning, f.eks. 10 % rabatt" value={rewardForm.title} onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}/>
          <select className="h-12 w-full rounded-2xl border border-[#E4DED4] bg-white px-4" value={rewardForm.reward_type} onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })}>
            <option value="discount">Rabatt</option><option value="free_treatment">Gratis behandling</option><option value="product">Gratis produkt</option><option value="gift_card">Gavekort</option><option value="custom">Egendefinert</option>
          </select>
          {rewardForm.reward_type === "discount" && <Input type="number" min="1" max="100" placeholder="Rabatt i prosent" value={rewardForm.discount_percent} onChange={(e) => setRewardForm({ ...rewardForm, discount_percent: e.target.value })}/>} 
          <Textarea placeholder="Beskrivelse, valgfritt" value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}/>
          <Input type="number" min="1" placeholder="Gyldighet i dager, valgfritt" value={rewardForm.validity_days} onChange={(e) => setRewardForm({ ...rewardForm, validity_days: e.target.value })}/>
          <div><label className="mb-1 block text-xs text-[#6B655B]">Hva skjer med stemplene ved innløsning?</label><select className="h-12 w-full rounded-2xl border border-[#E4DED4] bg-white px-4" value={rewardForm.redemption_mode} onChange={(e) => setRewardForm({ ...rewardForm, redemption_mode: e.target.value })}><option value="keep">Behold stemplene og fortsett</option><option value="deduct">Trekk fra nødvendige stempler</option><option value="reset">Nullstill kortet</option></select></div>
          <button disabled={busy} onClick={saveReward} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C5A059] text-white disabled:opacity-50"><Plus size={17}/>{editingReward ? "Lagre endringer" : "Legg til belønning"}</button>
        </div>

        <div className="space-y-3">
          {rewards.map((reward) => <div key={reward.id} className="rounded-3xl border border-[#EBE5DC] bg-white p-5"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4ECD8] text-[#B89953]"><Gift size={19}/></div><div className="min-w-0 flex-1"><div className="font-medium">{reward.stamps_required} behandlinger → {reward.title}</div><div className="mt-1 text-xs text-[#6B655B]">{reward.redemption_mode === "keep" ? "Stemplene beholdes" : reward.redemption_mode === "deduct" ? "Stemplene trekkes fra" : "Kortet nullstilles"}{reward.validity_days ? ` • gyldig i ${reward.validity_days} dager` : ""}</div></div><button onClick={() => editReward(reward)} className="p-2"><Pencil size={16}/></button><button onClick={() => removeReward(reward)} className="p-2 text-[#9E4747]"><Trash2 size={16}/></button></div></div>)}
          {!rewards.length && <div className="rounded-3xl bg-white p-8 text-center text-sm text-[#6B655B]">Ingen belønningstrinn lagt til.</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <Header title="Lojalitetskort" onBack={() => navigate("/admin")} />
      <div className="mx-auto max-w-screen-md space-y-4 px-4 py-6">
        <div className="rounded-2xl bg-[#F4ECD8] px-4 py-3 text-sm leading-6 text-[#6B655B]">Kunder med pågående kort beholder det gamle tilbudet og antall stempler. Åpne et kort for å legge til 5 behandlinger → 10 %, 8 behandlinger → 20 % og andre trinn.</div>
        {!creating ? <button onClick={() => setCreating(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#C5A059] text-white"><Plus size={18}/>Lag nytt lojalitetskort</button> : <div className="space-y-3 rounded-3xl border border-[#EBE5DC] bg-white p-5"><h2 className="font-serif-display text-2xl">Nytt lojalitetskort</h2><Input placeholder="Navn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/><Textarea placeholder="Sluttbelønning" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })}/><Input type="number" min="1" max="30" value={form.stamp_goal} onChange={(e) => setForm({ ...form, stamp_goal: e.target.value })}/><div className="grid grid-cols-2 gap-3"><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })}/><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })}/></div><div className="grid grid-cols-2 gap-2"><button onClick={() => { setCreating(false); setForm(EMPTY); }} className="h-12 rounded-full border">Avbryt</button><button disabled={busy} onClick={save} className="h-12 rounded-full bg-[#C5A059] text-white">Lagre utkast</button></div></div>}
        <div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-3xl border border-[#EBE5DC] bg-white p-5"><button onClick={() => loadRewards(item)} className="flex w-full items-start gap-3 text-left"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4ECD8] text-[#B89953]"><Gift size={20}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-serif-display text-xl">{item.name}</h3><span className="rounded-full bg-[#F4ECD8] px-2.5 py-1 text-[10px]">{item.status === "active" ? "Aktivt" : item.status === "draft" ? "Utkast" : "Arkivert"}</span></div><p className="mt-1 text-sm text-[#6B655B]">Opptil {item.stamp_goal} stempler • trykk for belønningstrinn</p></div></button>{item.status !== "active" && <div className="mt-4 grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => archive(item)} className="h-11 rounded-full border text-sm">Arkiver</button><button disabled={busy} onClick={() => activate(item)} className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#2C2A26] text-sm text-white"><Check size={16}/>Aktiver</button></div>}</div>)}</div>
      </div>
    </div>
  );
}

function Header({ title, onBack }) { return <div className="sticky top-0 z-30 border-b border-[#EBE5DC] bg-white"><div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3"><button onClick={onBack} className="flex items-center gap-2 text-sm"><ArrowLeft size={18}/>Tilbake</button><div className="font-serif-display text-xl text-[#B89953]">{title}</div><div className="w-16"/></div></div>; }
