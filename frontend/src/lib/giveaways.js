import { supabase } from "@/lib/supabase";
import { getCurrentClinicId } from "@/lib/currentClinic";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

async function invokeInstagram(action, values = {}) {
  const { data, error } = await supabase.functions.invoke("instagram-oauth", {
    body: { action, ...values },
  });
  if (error) {
    let message = "Instagram-tilkoblingen feilet";
    try {
      const payload = error.context ? await error.context.json() : null;
      if (payload?.error) message = payload.error;
    } catch {
      // Keep safe fallback message.
    }
    throw new Error(message);
  }
  return data || {};
}

function instagramShortcode(value) {
  try {
    return new URL(value).pathname.match(/^\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i)?.[1] || "";
  } catch {
    return "";
  }
}

async function fetchOfficialInstagramComments(instagramUrl) {
  const status = await invokeInstagram("status");
  if (!status.connected) {
    const authorization = await invokeInstagram("authorize");
    if (!authorization.url) throw new Error("Kunne ikke starte Instagram-tilkoblingen");
    window.location.assign(authorization.url);
    throw new Error("Du sendes nå til Instagram for å godkjenne tilkoblingen");
  }

  const shortcode = instagramShortcode(instagramUrl);
  const { media = [] } = await invokeInstagram("media");
  const selected = media.find((item) => instagramShortcode(item.permalink || "") === shortcode);
  if (!selected?.id) {
    throw new Error(`Innlegget ble ikke funnet blant innleggene til @${status.username || "den tilkoblede kontoen"}`);
  }

  const result = await invokeInstagram("comments", { media_id: selected.id });
  return {
    comments: Array.isArray(result.comments) ? result.comments : [],
    count: Number(result.count || 0),
    truncated: false,
    experimental: false,
    strategy: "instagram-graph-api",
  };
}

async function fetchBrowserComments(instagramUrl) {
  const response = await fetch("/api/instagram-comments-browser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_url: instagramUrl.trim() }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || "Nettleser-betaen kunne ikke hente kommentarene");
  return payload;
}

async function fetchSupabaseComments(instagramUrl) {
  const { data, error } = await supabase.functions.invoke("fetch-public-instagram-comments", {
    body: { instagram_url: instagramUrl.trim() },
  });
  if (error) {
    let message = "Kunne ikke hente kommentarer fra Instagram";
    try {
      const payload = error.context ? await error.context.json() : null;
      if (payload?.error) message = payload.error;
    } catch {
      // Keep safe fallback message.
    }
    throw new Error(message);
  }
  return data || {};
}

export async function fetchPublicInstagramComments(instagramUrl) {
  try {
    return await fetchOfficialInstagramComments(instagramUrl.trim());
  } catch (officialError) {
    // Redirects to Instagram are intentional and should not start scraping in parallel.
    if (/sendes nå til Instagram/i.test(officialError?.message || "")) throw officialError;

    let browserError = null;
    let data = null;
    try {
      data = await fetchBrowserComments(instagramUrl);
    } catch (error) {
      browserError = error;
    }
    if (!Array.isArray(data?.comments) || !data.comments.length) {
      try {
        data = await fetchSupabaseComments(instagramUrl);
      } catch (fallbackError) {
        throw new Error(officialError?.message || browserError?.message || fallbackError?.message || "Kunne ikke hente kommentarer fra Instagram");
      }
    }
    return {
      comments: Array.isArray(data?.comments) ? data.comments : [],
      count: Number(data?.count || 0),
      truncated: Boolean(data?.truncated),
      experimental: true,
      strategy: data?.strategy || "supabase-fallback",
    };
  }
}

export async function getInstagramConnectionStatus() {
  return invokeInstagram("status");
}

export async function disconnectInstagram() {
  return invokeInstagram("disconnect");
}

export async function createGiveawaySession({ instagramUrl, rules, participants = [] }) {
  const [{ data: sessionData }, clinicId] = await Promise.all([
    supabase.auth.getSession(),
    getCurrentClinicId(),
  ]);
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error("Du må være logget inn");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + TWELVE_HOURS_MS);
  const { data, error } = await supabase
    .from("giveaway_sessions")
    .insert({
      clinic_id: clinicId,
      created_by: userId,
      instagram_url: instagramUrl.trim(),
      rules,
      participants,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateGiveawaySession(id, values) {
  const { data, error } = await supabase.from("giveaway_sessions").update(values).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteGiveawaySession(id) {
  const { error } = await supabase.from("giveaway_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function listActiveGiveawaySessions() {
  const clinicId = await getCurrentClinicId();
  const { data, error } = await supabase.from("giveaway_sessions").select("*").eq("clinic_id", clinicId).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
