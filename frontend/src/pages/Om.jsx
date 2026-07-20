import { Heart, MapPin, ShieldCheck } from "lucide-react";

export default function Om() {
  return (
    <div className="px-5 pt-24 pb-8" data-testid="page-om">
      <section className="bg-white rounded-3xl border border-[#EBE5DC] p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.22em] text-[#B89953]">Om klinikken</p>
        <h1 className="font-serif text-3xl text-[#2C2A26] mt-3">Seldaesthetic</h1>
        <p className="text-sm leading-7 text-[#6B655B] mt-4">
          Seldaesthetic er en kosmetisk klinikk i Mjøndalen med fokus på trygghet,
          kvalitet og personlig oppfølging.
        </p>
      </section>

      <section className="mt-5 grid gap-3">
        {[
          {
            icon: ShieldCheck,
            title: "Trygge behandlinger",
            text: "Faglig vurdering og individuelt tilpasset behandling.",
          },
          {
            icon: Heart,
            title: "Personlig oppfølging",
            text: "Du blir møtt med tid, omsorg og ærlige anbefalinger.",
          },
          {
            icon: MapPin,
            title: "Mjøndalen",
            text: "Klinikken holder til sentralt i Mjøndalen.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white rounded-3xl border border-[#EBE5DC] p-5 flex gap-4">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-[#F0E9DF] flex items-center justify-center text-[#B89953]">
              <Icon size={21} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#2C2A26]">{title}</h2>
              <p className="text-sm leading-6 text-[#6B655B] mt-1">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
