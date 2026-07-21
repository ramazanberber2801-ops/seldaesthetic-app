import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import Header from "@/components/Header";
import { listNotifications, markNotificationRead } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { enablePushNotifications, registerPushNotifications } from "@/lib/pushNotifications";
import { toast } from "sonner";

export default function Varsler() {
  const { user, profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);

  useEffect(() => {
    if (authLoading) return;
    listNotifications()
      .then((data) => {
        const filtered = (data || []).filter((item) => {
          if (!user) return !item.target_user_id && (item.category === "offers" || item.category === "news");
          if (item.category === "offers") return profile?.notifications_offers ?? true;
          if (item.category === "loyalty") return profile?.notifications_loyalty ?? true;
          return profile?.notifications_news ?? true;
        });
        setItems(filtered);
      })
      .catch((error) => toast.error(error.message || "Kunne ikke laste varsler"))
      .finally(() => setLoading(false));
  }, [authLoading, user, profile]);

  useEffect(() => {
    if (permission === "granted") {
      registerPushNotifications(user?.id || null).catch(() => {});
    }
  }, [permission, user]);

  const enablePush = async () => {
    setPushBusy(true);
    try {
      const token = await enablePushNotifications(user?.id || null);
      setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
      if (!token) return toast.error("Varsler ble ikke aktivert på telefonen");
      toast.success(user ? "Varsler er slått på" : "Tilbud og nyheter er slått på");
    } catch (error) {
      toast.error(error.message || "Kunne ikke aktivere varsler");
    } finally {
      setPushBusy(false);
    }
  };

  const markRead = async (id) => {
    if (!user) return;
    try {
      await markNotificationRead(id);
      toast.success("Markert som lest");
    } catch (error) {
      toast.error(error.message || "Kunne ikke oppdatere varselet");
    }
  };

  return (
    <div data-testid="page-varsler">
      <Header title="Varsler og tilbud" subtitle="Meldinger fra Seldaesthetic" icon={Bell} />
      <div className="px-5 py-6 space-y-4">
        <div className="rounded-3xl border border-[#EBE5DC] bg-white p-5 shadow-sm">
          <h2 className="font-serif-display text-xl text-[#2C2A26]">Få tilbud direkte på telefonen</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B655B]">Du kan motta tilbud og nyheter uten å registrere konto.</p>
          {permission === "granted" ? (
            <div className="mt-4 rounded-2xl bg-[#EEF5EA] px-4 py-3 text-sm text-[#4E6B42]">Varsler er slått på</div>
          ) : permission === "denied" ? (
            <div className="mt-4 rounded-2xl bg-[#F8EAEA] px-4 py-3 text-sm text-[#8E4545]">Varsler er blokkert i telefonens nettleserinnstillinger.</div>
          ) : permission === "unsupported" ? (
            <div className="mt-4 rounded-2xl bg-[#F4F0EA] px-4 py-3 text-sm text-[#6B655B]">Denne nettleseren støtter ikke push-varsler.</div>
          ) : (
            <button type="button" disabled={pushBusy} onClick={enablePush} className="mt-4 w-full rounded-2xl bg-[#B89953] px-4 py-3.5 text-sm font-medium text-white disabled:opacity-60">
              {pushBusy ? "Aktiverer …" : "Slå på varsler"}
            </button>
          )}
        </div>

        {authLoading || loading ? (
          <div className="rounded-3xl border border-[#EBE5DC] bg-white p-6 text-sm text-[#6B655B]">Laster varsler …</div>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-3xl border border-[#EBE5DC] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#B89953]">{item.category === "offers" ? "Tilbud" : item.category === "loyalty" ? "Lojalitet" : "Nyhet"}</div>
                    <h2 className="mt-1 font-serif-display text-xl text-[#2C2A26]">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#6B655B]">{item.message}</p>
                    <p className="mt-3 text-[10px] text-[#9C968C]">{new Date(item.created_at).toLocaleString("no-NO")}</p>
                  </div>
                  {user && (
                    <button type="button" onClick={() => markRead(item.id)} className="rounded-full bg-[#F4ECD8] p-2 text-[#8C6B2F]" aria-label="Marker som lest">
                      <CheckCheck size={16} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#EBE5DC] bg-white p-8 text-center text-sm text-[#6B655B]">Ingen tilbud eller nyheter ennå.</div>
        )}
      </div>
    </div>
  );
}