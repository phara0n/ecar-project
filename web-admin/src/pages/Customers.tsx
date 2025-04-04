import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserPlus, Filter } from "lucide-react";

// Mock customer data
const mockCustomers = [
  {
    id: 1,
    name: "Ahmed Ben Ali",
    email: "ahmed.benali@gmail.com",
    phone: "+216 55 123 456",
    vehicles: 2,
    lastVisit: "2024-04-01",
    status: "active",
  },
  {
    id: 2,
    name: "Fatima Mansour",
    email: "fatima.m@yahoo.fr",
    phone: "+216 99 876 543",
    vehicles: 1,
    lastVisit: "2024-03-28",
    status: "active",
  },
  {
    id: 3,
    name: "Mohammed Trabelsi",
    email: "m.trabelsi@hotmail.com",
    phone: "+216 21 987 654",
    vehicles: 3,
    lastVisit: "2024-03-15",
    status: "active",
  },
  {
    id: 4,
    name: "Leila Ben Salah",
    email: "leila.bensalah@gmail.com",
    phone: "+216 52 789 123",
    vehicles: 1,
    lastVisit: "2024-02-22",
    status: "inactive",
  },
  {
    id: 5,
    name: "Karim Jebali",
    email: "karim.j@outlook.com",
    phone: "+216 97 321 654",
    vehicles: 2,
    lastVisit: "2024-04-02",
    status: "active",
  },
];

export function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState(mockCustomers);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customer data and vehicle relationships
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 h-9 w-full sm:w-auto">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            View and manage all {filteredCustomers.length} customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Vehicles</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Last Visit</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No customers found. Try another search term.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {customer.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>{customer.email}</div>
                          <div className="text-muted-foreground">{customer.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {customer.vehicles}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(customer.lastVisit).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              customer.status === "active"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted-foreground/20 text-muted-foreground"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 