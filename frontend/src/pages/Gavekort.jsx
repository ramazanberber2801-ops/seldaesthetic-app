import { Gift } from "lucide-react";
import Header from "@/components/Header";
import EmbeddedTimmaFrame from "@/components/EmbeddedTimmaFrame";
import { useClinicSettings } from "@/contexts/ClinicSettingsContext";

export default function Gavekort() {
  const { settings } = useClinicSettings();

  return (
    <div data-testid="page-gavekort" className="min-h-screen bg-paper">
      <Header
        title="Kjøp Gavekort"
        subtitle="Gi bort velvære og skjønnhet"
        icon={Gift}
      />

      <section className="mt-2 w-full" aria-label="Kjøp gavekort">
        <EmbeddedTimmaFrame
          title={`Gavekort hos ${settings.clinic_name || "klinikken"}`}
          configuredUrl={settings.gift_card_url}
          fallbackUrl="https://bestill.timma.no/giftcard/seldaesthetic"
          testId="gavekort-iframe"
        />
      </section>
    </div>
  );
}
