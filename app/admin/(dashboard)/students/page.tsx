import { getSupabaseAdmin } from "@/lib/supabase";
import { StudentsClient } from "./client";

export default async function StudentsPage() {
  const supabase = getSupabaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: students } = await (supabase.from("course_purchases") as any)
    .select("id, email, first_name, telegram_username, amount, currency, payment_method, status, email_sent, invite_count, created_at, sweep_verified_at")
    .order("created_at", { ascending: false });

  return <StudentsClient students={students || []} />;
}
