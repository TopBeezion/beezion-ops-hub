// @ts-nocheck
// Supabase Edge Function: check-stale-tasks
// Returns tasks that have had no activity in >= p_days days (default 2).
// Meant to be invoked daily via pg_cron or external scheduler to drive notifications.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let days = 2;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.days && Number.isFinite(body.days)) days = Number(body.days);
      } catch (_) {
        // ignore
      }
    } else {
      const url = new URL(req.url);
      const d = url.searchParams.get("days");
      if (d) days = Number(d);
    }

    const { data, error } = await supabase.rpc("get_stale_tasks", {
      p_days: days,
    });
    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, days, count: data?.length ?? 0, tasks: data ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
