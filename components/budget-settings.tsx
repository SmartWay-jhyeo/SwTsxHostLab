"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Save } from "lucide-react"

interface BudgetSettingsProps {
  initialBudget?: number
  initialDeposit?: number
  onSave?: (budget: number, deposit: number) => void
}

export function BudgetSettings({ initialBudget = 1500000, initialDeposit = 10000000, onSave }: BudgetSettingsProps) {
  const [budget, setBudget] = useState(initialBudget)
  const [deposit, setDeposit] = useState(initialDeposit)
  const { toast } = useToast()

  const handleSave = () => {
    if (onSave) {
      onSave(budget, deposit)
    }

    // 실제 구현에서는 여기서 API 호출 등을 통해 사용자 설정을 저장
    toast({
      title: "예산이 저장되었습니다",
      description: `최대 월 임대 예산: ${budget.toLocaleString()}원, 보증금 예산: ${deposit.toLocaleString()}원`,
    })
  }

  const handleBudgetSliderChange = (value: number[]) => {
    setBudget(value[0])
  }

  const handleDepositSliderChange = (value: number[]) => {
    setDeposit(value[0])
  }

  const handleBudgetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value)) {
      setBudget(value)
    }
  }

  const handleDepositInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value)) {
      setDeposit(value)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>내 예산 설정</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="budget-slider">최대 월 임대 예산</Label>
              <span className="text-sm text-muted-foreground">{budget.toLocaleString()}원</span>
            </div>
            <Slider
              id="budget-slider"
              min={500000}
              max={5000000}
              step={100000}
              value={[budget]}
              onValueChange={handleBudgetSliderChange}
              className="my-4"
            />
            <div className="flex text-xs justify-between text-muted-foreground">
              <span>50만원</span>
              <span>500만원</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="deposit-slider">보증금 예산</Label>
              <span className="text-sm text-muted-foreground">{deposit.toLocaleString()}원</span>
            </div>
            <Slider
              id="deposit-slider"
              min={5000000}
              max={50000000}
              step={1000000}
              value={[deposit]}
              onValueChange={handleDepositSliderChange}
              className="my-4"
            />
            <div className="flex text-xs justify-between text-muted-foreground">
              <span>500만원</span>
              <span>5000만원</span>
            </div>
          </div>

          <div>
            <Label htmlFor="budget-input">월 임대료 직접 입력</Label>
            <div className="relative mt-1">
              <Input
                id="budget-input"
                type="number"
                value={budget}
                onChange={handleBudgetInputChange}
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
            </div>
          </div>

          <div>
            <Label htmlFor="deposit-input">보증금 직접 입력</Label>
            <div className="relative mt-1">
              <Input
                id="deposit-input"
                type="number"
                value={deposit}
                onChange={handleDepositInputChange}
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₩</span>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            예산 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
