"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { deleteAnalysisResult } from "@/app/actions/deleteAnalysisResult"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"

interface DeleteResultButtonProps {
  resultId: number
  title: string
}

export function DeleteResultButton({ resultId, title }: DeleteResultButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { isAdmin } = useAuth()

  // 관리자가 아니면 버튼을 표시하지 않음
  if (!isAdmin) {
    return null
  }

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const result = await deleteAnalysisResult(resultId)

      if (result.success) {
        toast({
          title: "삭제 성공",
          description: "분석 결과가 성공적으로 삭제되었습니다.",
        })
        setIsOpen(false)
        router.refresh()
      } else {
        toast({
          title: "삭제 실패",
          description: result.error || "삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("삭제 오류:", error)
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>분석 결과 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 &quot;{title}&quot; 분석 결과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
