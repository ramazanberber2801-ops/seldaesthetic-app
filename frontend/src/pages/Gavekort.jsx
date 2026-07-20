import { Gift } from "lucide-react";
import Header from "@/components/Header";

export default function Gavekort() {
  return (
    <div data-testid="page-gavekort" className="min-h-screen bg-paper">
      <Header
        title="Kjøp Gavekort"
        subtitle="Gi bort velvære og skjønnhet"
        icon={Gift}
      />

      <section className="mt-2 w-full" aria-label="Kjøp gavekort">
        <iframe
          title="Kjøp gavekort hos Seldaesthetic"
          src="https://bestill.timma.no/giftcard/seldaesthetic"
          data-testid="gavekort-iframe"
          className="block w-full bg-white"
          style={{ height: "calc(100vh - 190px)", minHeight: "760px", border: "none" }}
          allow="payment; clipboard-write"
        />
      </section>
    </div>
  );
}
