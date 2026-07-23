import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Gift, Instagram, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { createGiveawaySession, deleteGiveawaySession, updateGiveawaySession } from "@/lib/giveaways";

function normalizeParticipants(raw, uniqueUsers) {
  const entries = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^@/, ""));

  return uniqueUsers ? Array.from(new Set(entries.map((entry) => entry.toLowerCase()))) : entries;
}

function pickRandom(items, count) {
  const pool = [...items];
  const winners = [];
  while (pool.length && winners.length < count) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const index = values[0] % pool.length;
    winners.push(pool.splice(index, 1)[0]);
  }
  return winners;
}

export default function AdminGiveaway() {
  const [instagramUrl, setInstagramUrl] = useState("");
  const [participantsText, setParticipantsText] = useState("");
  const [uniqueUsers, setUniqueUsers] = useState(true);
  const [winnerCount, setWinnerCount] = useState(1);
  const [session, setSession] = useState(null);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);

  const participants = useMemo(
    () => normalizeParticipants(participantsText, uniqueUsers),
    [participantsText, uniqueUsers]
  );

  const startSession = async () => {
    if (!instagramUrl.trim()) return toast.error("Lim inn Instagram-lenken");
    if (!participants.length) return toast.error("Lim inn minst én deltaker");
    setLoading(true);
    try {
      const created = await createGiveawaySession({
        instagramUrl,
        rules: { unique_users: uniqueUsers, winner_count: winnerCount },
        participants,
      });
      setSession(created);
      setWinners([]);
      toast.success("Giveaway klar. Data slettes automatisk etter 12 timer.");
    } catch (error) {
      toast.error(error.message || "Kunne ikke opprette giveaway");
    } finally {
      setLoading(false);
    }
  };

  const drawWinners = async () => {
    if (!session) return toast.error("Opprett giveaway først");
    const selected = pickRandom(participants, Math.min(winnerCount, participants.length));
    setWinners(selected);
    try {
      const updated = await updateGiveawaySession(session.id, {
        winner_data: { winners: selected, drawn_at: new Date().toISOString() },
      });
      setSession(updated);
    } catch (error) {
      toast.error(error.message || "Vinneren ble trukket, men kunne ikke lagres midlertidig");
    }
  };

  const downloadResult = () => {
    if (!winners.length) return toast.error("Trekk en vinner først");
    const content = [
      "Yasaflow Giveaway",
      `Instagram: ${instagramUrl}`,
      `Deltakere: ${participants.length}`,
      `Vinner${winners.length > 1 ? "e" : ""}: ${winners.map((winner) => `@${winner}`).join(", ")}`,
      `Dato: ${new Date().toLocaleString("no-NO")}`,
      "Denne filen er lagret lokalt. Yasaflow beholder ingen kopi etter 12 timer.",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `yasaflow-giveaway-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const removeSession = async () => {
    if (!session) return;
    try {
      await deleteGiveawaySession(session.id);
      setSession(null);
      setWinners([]);
      toast.success("Giveaway-data er slettet nå");
    } catch (error) {
      toast.error(error.message || "Kunne ikke slette giveaway-data");
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-5 py-6 text-[#2C2A26]">
      <div className="mx-auto max-w-3xl">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-[#6B655B]">
          <ArrowLeft size={17} /> Tilbake
        </Link>

        <section className="mt-5 rounded-[32px] bg-[#2C2A26] p-7 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Instagram size={24} className="text-[#D4B36A]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/55">Privacy First</p>
              <h1 className="font-serif-display text-3xl">Instagram Giveaway</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
            Ingen Instagram-pålogging. Giveaway-data slettes automatisk etter 12 timer. Resultatfiler lagres bare lokalt på din telefon eller PC.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-[#EBE5DC] bg-white p-5 shadow-sm">
          <label className="text-sm font-medium">Instagram-innlegg</label>
          <input
            value={instagramUrl}
            onChange={(event) => setInstagramUrl(event.target.value)}
            placeholder="https://www.instagram.com/p/..."
            className="mt-2 w-full rounded-2xl border border-[#DED6CA] px-4 py-3 outline-none focus:border-[#C5A059]"
          />

          <label className="mt-5 block text-sm font-medium">Deltakere</label>
          <p className="mt-1 text-xs text-[#6B655B]">Én Instagram-bruker per linje. Automatisk kommentarhenting kobles til i neste steg.</p>
          <textarea
            value={participantsText}
            onChange={(event) => setParticipantsText(event.target.value)}
            rows={10}
            placeholder={"seldaesthetic\nmedina\nklinikkkunde"}
            className="mt-2 w-full rounded-2xl border border-[#DED6CA] px-4 py-3 outline-none focus:border-[#C5A059]"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl bg-[#F7F3EC] p-4 text-sm">
              Én bruker = én sjanse
              <input type="checkbox" checked={uniqueUsers} onChange={(event) => setUniqueUsers(event.target.checked)} />
            </label>
            <label className="rounded-2xl bg-[#F7F3EC] p-4 text-sm">
              Antall vinnere
              <input
                type="number"
                min="1"
                max="10"
                value={winnerCount}
                onChange={(event) => setWinnerCount(Math.max(1, Math.min(10, Number(event.target.value) || 1)))}
                className="mt-2 w-full rounded-xl border border-[#DED6CA] bg-white px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-[#6B655B]">
            <Users size={17} /> {participants.length} kvalifiserte deltakere
          </div>

          <button
            onClick={startSession}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2C2A26] px-5 py-3.5 text-sm text-white disabled:opacity-50"
          >
            <Gift size={18} /> {loading ? "Oppretter..." : "Opprett giveaway"}
          </button>
        </section>

        {session && (
          <section className="mt-6 rounded-3xl border border-[#EBE5DC] bg-white p-5 text-center shadow-sm">
            <Sparkles size={28} className="mx-auto text-[#C5A059]" />
            <h2 className="mt-3 font-serif-display text-2xl">Klar for trekning</h2>
            <p className="mt-2 text-sm text-[#6B655B]">
              Midlertidige data utløper {new Date(session.expires_at).toLocaleString("no-NO")}.
            </p>

            <button
              onClick={drawWinners}
              className="mt-5 w-full rounded-full bg-[#C5A059] px-5 py-4 text-base font-medium text-white"
            >
              Trekk vinner{winnerCount > 1 ? "e" : ""}
            </button>

            {winners.length > 0 && (
              <div className="mt-5 rounded-3xl bg-[#F7F3EC] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8D7139]">Vinner{winners.length > 1 ? "e" : ""}</p>
                <div className="mt-3 space-y-2 font-serif-display text-3xl">
                  {winners.map((winner) => <div key={winner}>@{winner}</div>)}
                </div>
                <button onClick={downloadResult} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm shadow-sm">
                  <Download size={17} /> Lagre lokalt
                </button>
              </div>
            )}

            <button onClick={removeSession} className="mt-5 inline-flex items-center gap-2 text-sm text-red-600">
              <Trash2 size={17} /> Slett giveaway-data nå
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
