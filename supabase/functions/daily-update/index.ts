// supabase/functions/daily-update/index.ts
//
// Deno Edge Function. Deploy with:
//   supabase functions deploy daily-update
//
// Then schedule it with pg_cron + pg_net (run once in the SQL editor,
// with the project's Edge Function URL and service role key):
//
//   select cron.schedule(
//     'thaiwander-daily-update',
//     '0 6 * * *', -- every day at 06:00
//     $$
//     select net.http_post(
//       url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/daily-update',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY'
//       ),
//       body := '{}'::jsonb
//     );
//     $$
//   );
//
// This function itself just calls the `run_daily_snapshot` Postgres
// function (defined in supabase/migrations/20260818_init_thaiwander.sql),
// which does the actual aggregation: it snapshots each active place's
// current counters into `daily_place_stats` for today, recomputes
// popularity_score + crowd_level, and writes them back onto `places`.

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // SUPABASE_SERVICE_ROLE_KEY is required here (not the anon key) because
    // run_daily_snapshot writes to `places` and `daily_place_stats`.
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let targetDate: string | undefined;
    try {
      const body = await req.json();
      targetDate = body?.date;
    } catch {
      // no JSON body — fine, defaults to current_date inside Postgres
    }

    const { error } = await supabase.rpc("run_daily_snapshot", {
      target_date: targetDate ?? new Date().toISOString().slice(0, 10)
    });

    if (error) {
      console.error("run_daily_snapshot failed:", error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ ok: true, ranAt: new Date().toISOString() }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("daily-update crashed:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
