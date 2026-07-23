import { useEffect, useState } from "react";
import { ArrowLeft, Check, CreditCard, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getCurrentClinic } from "@/lib/currentClinic";

const portalUrl = process.env.REACT_APP_CUSTOMER_PORTAL_URL || "https://portal.yasaflow.com/kunde";

export default function AdminSubscription() {
  const [clinic, setClinic] = useState(null);
  useEffect(() => { getCurrentClinic().then(setClinic).catch(() => setClinic(null)); }, []);

  return (
    <div className="min-h-screen bg-paper text-[#2C2A26]">
      <header className="border-b border-[#EBE5DC] bg-white"><div className="mx-auto flex max-w-screen-md items-center gap-3 px-4 py-4"><Link to="/admin/overview"><ArrowLeft size={19}/></Link><div><div className="font-serif-display text-xl">Abonnement</div><div className="text-xs text-[#6B655B]">{clinic?.name || "Yasaflow Clinic"}</div></div></div></header>
      <main className="mx-auto max-w-screen-md space-y-5 px-4 py-6">
        <section className="overflow-hidden rounded-[2rem] bg-[#2C2A26] p-6 text-white">
          <div className="flex items-center gap-2 text-sm text-[#D8C998]"><Sparkles size={17}/>Alt inkludert</div>
          <div className="mt-4 flex items-end gap-2"><span className="font-serif-display text-5xl">799 kr</span><span className="pb-2 text-white/60">/mnd</span></div>
          <p className="mt-3 text-sm text-white/70">7 dagers gratis prøveperiode. Ingen binding. Gratis oppdateringer.</p>
        </section>

        <section className="rounded-3xl border border-[#EBE5DC] bg-white p-5">
          <h2 className="font-serif-display text-2xl">Dette er inkludert</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Digitale stempelkort","Automatiske bursdagshilsener","Segmentering med etiketter","Målrettede kampanjer","Push-varsler","Kundeklubb","Dashboard og statistikk","Gratis oppdateringer"].map((item) => <div key={item} className="flex items-center gap-3 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#F4ECD8] text-[#B89953]"><Check size={15}/></span>{item}</div>)}
          </div>
        </section>

        <section className="rounded-3xl border border-[#EBE5DC] bg-white p-5">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-1 text-[#B89953]"/><div><h2 className="font-serif-display text-2xl">Administrer abonnementet</h2><p className="mt-2 text-sm leading-6 text-[#6B655B]">Åpne den sikre kundeportalen for å se abonnement, fakturaer, betalingsmåte eller avslutte abonnementet.</p></div></div>
          <a href={portalUrl} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2C2A26] text-sm text-white"><CreditCard size={17}/>Åpne kundeportalen<ExternalLink size={15}/></a>
        </section>
      </main>
    </div>
  );
}
