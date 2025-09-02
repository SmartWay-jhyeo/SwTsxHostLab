import { NextResponse } from "next/server"

export async function POST(request: Request) {
  return NextResponse.json({ success: false, error: "이 API는 더 이상 사용되지 않습니다." }, { status: 404 })
}
