import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = req.headers.get("Authorization") || "";

    const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData.user) return reply({ error: "Ikke innlogget" }, 401);

    const body = await req.json();
    const title = String(body?.title || "").trim();
    const message = String(body?.message || body?.body || body?.content || "").trim();
    const category = String(body?.category || "news");
    const targetUserId = body?.target_user_id || null;
    const requestedClinicId = body?.clinic_id || null;
    if (!title || !message) return reply({ error: "Tittel og melding er påkrevd" }, 400);

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    let membershipQuery = admin
      .from("clinic_members")
      .select("clinic_id,role")
      .eq("user_id", userData.user.id)
      .eq("status", "active")
      .in("role", ["owner", "admin", "staff"]);
    if (requestedClinicId) membershipQuery = membershipQuery.eq("clinic_id", requestedClinicId);

    const { data: memberships, error: membershipError } = await membershipQuery.limit(2);
    if (membershipError) return reply({ error: membershipError.message }, 500);
    if (!memberships?.length) return reply({ error: "Kun klinikkansatte kan sende push" }, 403);
    if (!requestedClinicId && memberships.length > 1) {
      return reply({ error: "Klinikk må oppgis når brukeren tilhører flere klinikker" }, 400);
    }
    const clinicId = requestedClinicId || memberships[0].clinic_id;

    if (targetUserId) {
      const { data: targetMembership, error: targetError } = await admin
        .from("clinic_members")
        .select("user_id")
        .eq("clinic_id", clinicId)
        .eq("user_id", targetUserId)
        .eq("role", "customer")
        .eq("status", "active")
        .maybeSingle();
      if (targetError) return reply({ error: targetError.message }, 500);
      if (!targetMembership) return reply({ error: "Kunden tilhører ikke denne klinikken" }, 403);
    }

    const { data: config, error: configError } = await admin
      .from("web_push_config")
      .select("public_key,private_key,subject")
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (configError || !config) return reply({ error: configError?.message || "Web Push-oppsett mangler" }, 500);

    webpush.setVapidDetails(config.subject, config.public_key, config.private_key);

    let query = admin
      .from("web_push_subscriptions")
      .select("id,user_id,subscription,notifications_offers,notifications_news,notifications_loyalty")
      .eq("clinic_id", clinicId);
    if (targetUserId) query = query.eq("user_id", targetUserId);

    const { data: rows, error: subscriptionError } = await query;
    if (subscriptionError) return reply({ error: subscriptionError.message }, 500);

    const preferenceKey = category === "offers"
      ? "notifications_offers"
      : category === "loyalty"
        ? "notifications_loyalty"
        : "notifications_news";

    const eligible = (rows || []).filter((row: any) => {
      if (!row.user_id && category === "loyalty") return false;
      return row[preferenceKey] !== false;
    });

    if (!eligible.length) return reply({ sent: 0, failed: 0, removed: 0, reason: "no_subscriptions" });

    const messageId = crypto.randomUUID();
    const payload = JSON.stringify({
      title,
      body: message,
      message,
      category,
      message_id: messageId,
      url: "/varsler",
    });

    let sent = 0;
    let failed = 0;
    const expiredIds: string[] = [];
    const errors: Array<{ status: number; message: string }> = [];

    await Promise.all(eligible.map(async (row: any) => {
      try {
        await webpush.sendNotification(row.subscription, payload, { TTL: 86400, urgency: "high" });
        sent += 1;
      } catch (error: any) {
        const status = Number(error?.statusCode || 0);
        if (status === 404 || status === 410) {
          expiredIds.push(row.id);
        } else {
          failed += 1;
          const detail = String(error?.body || error?.message || "Ukjent Web Push-feil");
          errors.push({ status, message: detail.slice(0, 500) });
          console.error("Web Push send failed", status, detail);
        }
      }
    }));

    let removed = 0;
    if (expiredIds.length) {
      const { error: deleteError } = await admin.from("web_push_subscriptions").delete().in("id", expiredIds);
      if (deleteError) {
        failed += expiredIds.length;
        errors.push({ status: 0, message: deleteError.message });
      } else {
        removed = expiredIds.length;
      }
    }

    return reply({
      sent,
      failed,
      removed,
      clinic_id: clinicId,
      mode: "vapid-web-push",
      message_id: messageId,
      errors: errors.length ? errors : undefined,
    }, sent === 0 && failed > 0 ? 502 : 200);
  } catch (error) {
    console.error("send-push-notification failed", error);
    return reply({ error: error instanceof Error ? error.message : "Ukjent feil" }, 500);
  }
});
