import { supabase } from "@/lib/supabase";

export async function sendPushNotification(payload = {}) {
  const title = String(payload.title || "").trim();
  const message = String(payload.message || payload.body || payload.content || "").trim();

  if (!title || !message) {
    throw new Error("Tittel og melding er påkrevd");
  }

  const { data, error } = await supabase.functions.invoke("send-push-notification", {
    body: {
      title,
      message,
      category: payload.category || "news",
      target_user_id: payload.target_user_id || null,
      clinic_id: payload.clinic_id || null,
    },
  });

  if (error) {
    let detail = "";
    try {
      const response = error.context;
      if (response && typeof response.clone === "function") {
        const parsed = await response.clone().json();
        detail = parsed?.error || parsed?.errors?.[0]?.message || "";
      }
    } catch {
      // Keep the original Supabase error when the response body is unavailable.
    }
    throw new Error(detail || error.message || "Kunne ikke sende push-varsel");
  }

  if (data?.error) throw new Error(data.error);
  if (data?.failed > 0 && data?.sent === 0) {
    throw new Error(data?.errors?.[0]?.message || "Push-varselet kunne ikke leveres");
  }

  return data || { sent: 0, failed: 0, removed: 0 };
}
