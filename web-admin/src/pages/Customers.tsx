import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Edit, Trash } from "lucide-react";
import { customerService } from "@/lib/api";
import { toast } from "sonner";
import { CustomerDialog, CustomerFormData } from "@/components/CustomerDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  vehicles: number;
  last_visit?: string;
  status: string;
}

export function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Dialog state
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFormData | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await customerService.getAll();
      setCustomers(response.data);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(undefined);
    setIsCustomerDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setIsCustomerDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    const toastId = toast.loading("Deleting customer...");
    
    try {
      await customerService.delete(customerToDelete.id);
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      toast.success("Customer deleted successfully", { id: toastId });
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("Failed to delete customer", { id: toastId });
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

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
        <Button className="flex items-center gap-2" onClick={handleAddCustomer}>
          <Plus className="h-4 w-4" />
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
            {loading 
              ? "Loading customers..." 
              : `View and manage all ${filteredCustomers.length} customers`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={fetchCustomers}
              >
                Try Again
              </Button>
            </div>
          ) : (
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
                            {customer.vehicles || 0}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'N/A'}
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
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditCustomer(customer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCustomer(customer)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <CustomerDialog
        isOpen={isCustomerDialogOpen}
        onClose={() => setIsCustomerDialogOpen(false)}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone and will also remove all associated vehicle records.`}
      />
    </div>
  );
} 