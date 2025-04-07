"use client"

import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ChartAreaPlaceholder() {
  const [timeRange, setTimeRange] = React.useState("30d")

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Analytics Overview</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Visualize your data over time</span>
          <span className="@[540px]/card:hidden">Data visualization</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40" aria-label="Select a time range">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex aspect-[3/1] min-h-[250px] w-full items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Chart data will appear here</p>
        </div>
      </CardContent>
    </Card>
  )
}

