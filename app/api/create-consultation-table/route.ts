import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/session"

// 테이블 존재 여부 확인
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
    }

    const supabase = createClient()

    // 테이블 존재 여부 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "consultation_notes")
      .single()

    if (tableError && tableError.code !== "PGRST116") {
      console.error("테이블 정보 조회 오류:", tableError)
      return NextResponse.json({ tableExists: false, error: tableError.message }, { status: 500 })
    }

    const tableExists = !!tableInfo

    // 테이블이 존재하면 컬럼 정보 가져오기
    let columns: string[] = []
    if (tableExists) {
      const { data: columnsData, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_schema", "public")
        .eq("table_name", "consultation_notes")

      if (columnsError) {
        console.error("컬럼 정보 조회 오류:", columnsError)
        return NextResponse.json({ tableExists, error: columnsError.message }, { status: 500 })
      }

      columns = columnsData.map((col) => col.column_name)
    }

    return NextResponse.json({ tableExists, columns })
  } catch (error: any) {
    console.error("테이블 상태 확인 오류:", error)
    return NextResponse.json({ tableExists: false, error: error.message }, { status: 500 })
  }
}

// 테이블 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
    }

    const supabase = createClient()

    // 기존 테이블 삭제
    const { error: dropError } = await supabase.rpc("drop_table_if_exists", {
      table_name: "consultation_notes",
    })

    if (dropError) {
      console.error("테이블 삭제 오류:", dropError)
      // 테이블이 없는 경우는 무시하고 계속 진행
      if (dropError.message !== 'relation "consultation_notes" does not exist') {
        return NextResponse.json({ error: `테이블 삭제 오류: ${dropError.message}` }, { status: 500 })
      }
    }

    // 새 테이블 생성
    const createTableSQL = `
      CREATE TABLE public.consultation_notes (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_consultation_notes_user_id ON public.consultation_notes(user_id);
      CREATE INDEX idx_consultation_notes_created_at ON public.consultation_notes(created_at);
    `

    const { error: createError } = await supabase.rpc("run_sql", {
      sql_query: createTableSQL,
    })

    if (createError) {
      console.error("테이블 생성 오류:", createError)
      return NextResponse.json({ error: `테이블 생성 오류: ${createError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "상담일지 테이블이 성공적으로 생성되었습니다.",
    })
  } catch (error: any) {
    console.error("테이블 생성 처리 오류:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
