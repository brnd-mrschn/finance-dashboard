import { NextResponse } from "next/server";

const ALLOWED_EMAILS = [
  "monef4xgames@gmail.com", // Substitua pelo(s) email(s) autorizado(s)
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email || !ALLOWED_EMAILS.includes(email)) {
    return NextResponse.json({ allowed: false });
  }
  return NextResponse.json({ allowed: true });
}
