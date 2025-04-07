import { TrendingUpIcon, CarIcon, WrenchIcon, DollarSignIcon, SmileIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-1">
            <CarIcon className="h-4 w-4" /> Vehicles in Service
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold">12</CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +2
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">3 awaiting parts, 9 in progress</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-1">
            <WrenchIcon className="h-4 w-4" /> Completed Services
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold">28</CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +5
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">This week: 28 (Last week: 23)</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-1">
            <DollarSignIcon className="h-4 w-4" /> Revenue
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold">$8,245</CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +12%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">This month: $8,245 (MTD)</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-1">
            <SmileIcon className="h-4 w-4" /> Customer Satisfaction
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold">4.8/5</CardTitle>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
              <TrendingUpIcon className="size-3" />
              +0.2
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">Based on 42 reviews this month</div>
        </CardFooter>
      </Card>
    </div>
  )
}

