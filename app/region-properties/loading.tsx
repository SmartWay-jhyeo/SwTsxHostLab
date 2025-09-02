import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">지역 숙소 데이터를 불러오는 중...</p>
      </div>
    </div>
  )
}
