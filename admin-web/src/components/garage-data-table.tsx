import * as React from "react"
import {
  CarIcon,
  CheckCircleIcon,
  ClockIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample data for the garage
const vehicleData = [
  {
    id: 1,
    customer: "John Smith",
    vehicle: "Toyota Camry",
    plate: "ABC-1234",
    service: "Oil Change",
    status: "In Progress",
    mechanic: "Mike Johnson",
    eta: "Today, 2:00 PM",
  },
  {
    id: 2,
    customer: "Sarah Williams",
    vehicle: "Honda Civic",
    plate: "XYZ-5678",
    service: "Brake Replacement",
    status: "Waiting for Parts",
    mechanic: "Dave Miller",
    eta: "Tomorrow, 10:00 AM",
  },
  {
    id: 3,
    customer: "Robert Brown",
    vehicle: "Ford F-150",
    plate: "DEF-9012",
    service: "Engine Diagnostic",
    status: "Completed",
    mechanic: "Mike Johnson",
    eta: "Completed",
  },
  {
    id: 4,
    customer: "Emily Davis",
    vehicle: "Chevrolet Malibu",
    plate: "GHI-3456",
    service: "Tire Rotation",
    status: "In Progress",
    mechanic: "Lisa Chen",
    eta: "Today, 4:30 PM",
  },
  {
    id: 5,
    customer: "Michael Wilson",
    vehicle: "Nissan Altima",
    plate: "JKL-7890",
    service: "A/C Repair",
    status: "Scheduled",
    mechanic: "Unassigned",
    eta: "Tomorrow, 1:00 PM",
  },
  {
    id: 6,
    customer: "Jessica Taylor",
    vehicle: "BMW 3 Series",
    plate: "MNO-1234",
    service: "Full Service",
    status: "In Progress",
    mechanic: "Dave Miller",
    eta: "Today, 5:00 PM",
  },
  {
    id: 7,
    customer: "David Martinez",
    vehicle: "Audi Q5",
    plate: "PQR-5678",
    service: "Transmission Service",
    status: "Waiting for Approval",
    mechanic: "Mike Johnson",
    eta: "Pending",
  },
  {
    id: 8,
    customer: "Jennifer Garcia",
    vehicle: "Hyundai Sonata",
    plate: "STU-9012",
    service: "Battery Replacement",
    status: "Completed",
    mechanic: "Lisa Chen",
    eta: "Completed",
  },
]

export function GarageDataTable() {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredData = vehicleData.filter(
    (item) =>
      item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Vehicle Service Tracker</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vehicles..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" variant="outline">
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Service
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Tabs defaultValue="all" className="w-full">
          <div className="border-b px-4 sm:px-0">
            <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                All Vehicles
              </TabsTrigger>
              <TabsTrigger
                value="in-progress"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger
                value="waiting"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Waiting
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                Completed
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all" className="m-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.customer}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CarIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.vehicle}</span>
                          <Badge variant="outline" className="ml-1">
                            {item.plate}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{item.service}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "Completed"
                              ? "default"
                              : item.status === "In Progress"
                                ? "secondary"
                                : "outline"
                          }
                          className="flex w-fit items-center gap-1"
                        >
                          {item.status === "Completed" ? (
                            <CheckCircleIcon className="h-3 w-3" />
                          ) : item.status === "In Progress" ? (
                            <WrenchIcon className="h-3 w-3" />
                          ) : (
                            <ClockIcon className="h-3 w-3" />
                          )}
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.mechanic}</TableCell>
                      <TableCell>{item.eta}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Update status</DropdownMenuItem>
                            <DropdownMenuItem>Assign mechanic</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Create invoice</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="in-progress" className="m-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData
                    .filter((item) => item.status === "In Progress")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.customer}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{item.vehicle}</span>
                            <Badge variant="outline" className="ml-1">
                              {item.plate}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{item.service}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex w-fit items-center gap-1">
                            <WrenchIcon className="h-3 w-3" />
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.mechanic}</TableCell>
                        <TableCell>{item.eta}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontalIcon className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View details</DropdownMenuItem>
                              <DropdownMenuItem>Update status</DropdownMenuItem>
                              <DropdownMenuItem>Assign mechanic</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Create invoice</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="waiting" className="m-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData
                    .filter(
                      (item) =>
                        item.status === "Waiting for Parts" ||
                        item.status === "Waiting for Approval" ||
                        item.status === "Scheduled",
                    )
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.customer}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{item.vehicle}</span>
                            <Badge variant="outline" className="ml-1">
                              {item.plate}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{item.service}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex w-fit items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.mechanic}</TableCell>
                        <TableCell>{item.eta}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontalIcon className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View details</DropdownMenuItem>
                              <DropdownMenuItem>Update status</DropdownMenuItem>
                              <DropdownMenuItem>Assign mechanic</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Create invoice</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="completed" className="m-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData
                    .filter((item) => item.status === "Completed")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.customer}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{item.vehicle}</span>
                            <Badge variant="outline" className="ml-1">
                              {item.plate}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{item.service}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="flex w-fit items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.mechanic}</TableCell>
                        <TableCell>{item.eta}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontalIcon className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View details</DropdownMenuItem>
                              <DropdownMenuItem>Create invoice</DropdownMenuItem>
                              <DropdownMenuItem>Schedule follow-up</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

