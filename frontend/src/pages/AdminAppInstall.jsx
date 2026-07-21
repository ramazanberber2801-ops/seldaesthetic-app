import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Check, Copy, Download, ExternalLink, Maximize2, Share2, Smartphone, X } from "lucide-react";
import { toast } from "sonner";

const APP_URL = "https://seldaesthetic.yasaflow.com";

export default function AdminAppInstall() {
  const qrRef = useRef(null);
  const [fullScreen, setFullScreen] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL);
      toast.success("App-lenken er kopiert");
    } catch {
      toast.error("Kunne ikke kopiere lenken");
    }
  };

  const shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Seldaesthetic-appen",
          text: "Åpne Seldaesthetic-appen og legg den til på hjemskjermen.",
          url: APP_URL,
        });
      } else {
        await copyLink();
      }
    } catch (error) {
      if (error?.name !== "AbortError") toast.error("Kunne ikke dele lenken");
    }
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "seldaesthetic-app-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-paper px-4 py-5 text-[#2C2A26]">
      <div className="mx-auto max-w-screen-md">
        <div className="mb-5 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-sm">
            <ArrowLeft size={18} /> Tilbake
          </Link>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#9C968C]">Admin</p>
            <h1 className="font-serif-display text-xl">Installer app</h1>
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] bg-[#2C2A26] p-6 text-center text-white shadow-[0_18px_50px_rgba(44,42,38,0.18)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Smartphone size={27} className="text-[#D4B36A]" />
          </div>
          <h2 className="mt-4 font-serif-display text-3xl">Last ned Seldaesthetic</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/65">
            Vis denne QR-koden til kunden på telefonen eller nettbrettet. Kunden skanner koden og kan installere appen direkte fra nettleseren.
          </p>

          <button
            type="button"
            onClick={() => setFullScreen(true)}
            className="mx-auto mt-6 block rounded-[28px] bg-white p-5 shadow-xl active:scale-[0.99]"
            aria-label="Vis QR-kode i fullskjerm"
          >
            <div ref={qrRef}>
              <QRCodeCanvas value={APP_URL} size={230} level="H" includeMargin />
            </div>
          </button>

          <button onClick={() => setFullScreen(true)} className="mt-4 inline-flex items-center gap-2 text-sm text-[#E6C985]">
            <Maximize2 size={17} /> Vis stor QR-kode til kunden
          </button>

          <div className="mt-6 rounded-2xl bg-white/8 px-4 py-3 text-left">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">App-adresse</p>
            <p className="mt-1 break-all text-sm">{APP_URL}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={copyLink} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 text-sm">
              <Copy size={17} /> Kopier lenke
            </button>
            <button onClick={shareLink} className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#C5A059] text-sm">
              <Share2 size={17} /> Del
            </button>
            <button onClick={downloadQr} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 text-sm">
              <Download size={17} /> Last ned QR
            </button>
            <a href={APP_URL} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 text-sm">
              <ExternalLink size={17} /> Åpne app
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-[#EBE5DC] bg-white p-5">
          <h3 className="font-serif-display text-2xl">Guide for iPhone</h3>
          <div className="mt-4 space-y-3">
            <GuideStep number="1" text="Skann QR-koden med Kamera-appen og åpne lenken i Safari." />
            <GuideStep number="2" text="Trykk på Del-knappen nederst i Safari." />
            <GuideStep number="3" text="Velg «Legg til på Hjem-skjerm»." />
            <GuideStep number="4" text="Trykk «Legg til». Appikonet vises på hjemskjermen." />
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-[#EBE5DC] bg-white p-5">
          <h3 className="font-serif-display text-2xl">Guide for Android</h3>
          <div className="mt-4 space-y-3">
            <GuideStep number="1" text="Skann QR-koden med kameraet og åpne lenken i Chrome." />
            <GuideStep number="2" text="Trykk «Installer app» hvis meldingen vises." />
            <GuideStep number="3" text="Hvis meldingen ikke vises: trykk menyen med tre prikker øverst." />
            <GuideStep number="4" text="Velg «Installer app» eller «Legg til på startskjermen», og bekreft." />
          </div>
        </section>
      </div>

      {fullScreen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#2C2A26] p-6 text-center text-white">
          <button
            onClick={() => setFullScreen(false)}
            className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10"
            aria-label="Lukk fullskjerm"
          >
            <X size={24} />
          </button>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">Seldaesthetic</p>
          <h2 className="mt-3 font-serif-display text-4xl">Skann og installer appen</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">Åpne kameraet på telefonen og pek mot QR-koden.</p>
          <div className="mt-7 rounded-[32px] bg-white p-6 shadow-2xl">
            <QRCodeCanvas value={APP_URL} size={280} level="H" includeMargin />
          </div>
          <p className="mt-6 break-all text-sm text-[#E6C985]">{APP_URL}</p>
          <div className="mt-5 flex items-center gap-2 text-sm text-white/65">
            <Check size={17} className="text-[#D4B36A]" /> Ingen App Store nødvendig
          </div>
        </div>
      )}
    </div>
  );
}

function GuideStep({ number, text }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-6 text-[#5F594F]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4ECD8] text-xs font-semibold text-[#8C6B2F]">{number}</span>
      <span className="pt-1">{text}</span>
    </div>
  );
}
