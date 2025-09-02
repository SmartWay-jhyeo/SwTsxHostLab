"use client"

import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface ConsultationNote {
  id: string
  title: string
  content: string
  user_id: string
  user_email: string
  created_at: string
  updated_at: string
}

interface ConsultationNoteItemProps {
  note: ConsultationNote
  isSelected: boolean
  isAdmin?: boolean
  onClick: () => void
}

export function ConsultationNoteItem({ note, isSelected, isAdmin = false, onClick }: ConsultationNoteItemProps) {
  // 날짜 포맷 (예: "3일 전", "1시간 전")
  const timeAgo = formatDistanceToNow(new Date(note.created_at), {
    addSuffix: true,
    locale: ko,
  })

  // 내용 미리보기 (최대 100자)
  const contentPreview = note.content.length > 100 ? `${note.content.substring(0, 100)}...` : note.content

  return (
    <div
      className={`p-3 rounded-md cursor-pointer transition-colors ${
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
      onClick={onClick}
    >
      <div className="font-medium">{note.title || "제목 없음"}</div>
      <div className={`text-xs mt-1 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        {timeAgo}
      </div>
      <div
        className={`text-sm mt-2 line-clamp-2 ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}
      >
        {contentPreview}
      </div>
    </div>
  )
}
