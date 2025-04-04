import { BarChart3, Car, FileText, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statCards = [
  {
    title: "Total Customers",
    value: "1,234",
    description: "Active accounts",
    icon: Users,
    change: "+12%",
  },
  {
    title: "Total Vehicles",
    value: "1,897",
    description: "Registered in system",
    icon: Car,
    change: "+5%",
  },
  {
    title: "Active Services",
    value: "28",
    description: "In progress today",
    icon: Wrench,
    change: "+2%",
  },
  {
    title: "Revenue (Monthly)",
    value: "32,450 TND",
    description: "April 2025",
    icon: FileText,
    change: "+18%",
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your garage management system
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              <div className="mt-2 text-sm text-primary">
                {card.change} from last month
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue for the current year
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Chart component will be implemented here
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Services</CardTitle>
            <CardDescription>
              Last 5 services performed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">Oil Change</div>
                    <div className="text-sm text-muted-foreground">
                      Vehicle: BMW X5 • Customer: Ahmed Ali
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Today</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 