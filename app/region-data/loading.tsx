import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">지역별 매물 데이터</h1>
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-3 text-xl">데이터를 불러오는 중...</span>
      </div>
    </div>
  )
}
