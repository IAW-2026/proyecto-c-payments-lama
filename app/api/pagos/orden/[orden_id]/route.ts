import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  context: { params: Promise<{ orden_id: string }> }
) {
  const params = await context.params;

  const orden_id = params.orden_id;

  const { data, error } = await supabase
    .from("pago")
    .select("*")
    .eq("orden_id", orden_id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "No existe un pago para esa orden" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}