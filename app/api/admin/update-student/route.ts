import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...fields } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const allowedFields = ["email", "first_name", "telegram_username", "amount", "payment_method"];
    const updateData: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (key in fields) {
        updateData[key] = key === "amount" ? Number(fields[key]) : fields[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("course_purchases") as any)
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
