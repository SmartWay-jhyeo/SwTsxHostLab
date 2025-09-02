"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants"

interface ApiCallOptions {
  successMessage?: string
  errorMessage?: string
  showToast?: boolean
  showSuccessToast?: boolean
  showErrorToast?: boolean
}

export function useApiCall<T>() {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const execute = useCallback(
    async (apiFunction: () => Promise<T>, options: ApiCallOptions = {}) => {
      const {
        successMessage = SUCCESS_MESSAGES.dataUpdated,
        errorMessage = ERROR_MESSAGES.serverError,
        showToast = true,
        showSuccessToast = showToast,
        showErrorToast = showToast,
      } = options

      setIsLoading(true)
      setError(null)

      try {
        const result = await apiFunction()
        setData(result)

        if (showSuccessToast) {
          toast({
            title: "성공",
            description: successMessage,
          })
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)

        if (showErrorToast) {
          toast({
            title: "오류",
            description: error.message || errorMessage,
            variant: "destructive",
          })
        }

        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [toast],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  }
}
