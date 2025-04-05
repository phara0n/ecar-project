import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Edit, Trash, Car, Eye } from "lucide-react";
import { customerService, vehicleService } from "@/lib/api";
import { toast } from "sonner";
import { CustomerDialog, CustomerFormData } from "@/components/CustomerDialog";
import { CustomerDetailsDialog } from "@/components/CustomerDetailsDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useNavigate } from "react-router-dom";

// Updated interface to match backend API response structure
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Customer {
  id: number;
  user: User;
  phone: string;
  address?: string;
  vehicles?: number;
  last_visit?: string;
  status?: string;
}

export function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Dialog state
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerDetailsDialogOpen, setIsCustomerDetailsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFormData | undefined>(undefined);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await customerService.getAll();
      console.log("API Response:", response.data);
      
      // Handle Django REST Framework pagination format
      let customersData: Customer[] = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response
        customersData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        // DRF paginated response
        customersData = response.data.results;
      } else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        // Custom format with customers field
        customersData = response.data.customers;
      }
      
      // Fetch vehicle counts for each customer
      const customersWithVehicleCounts = await Promise.all(
        customersData.map(async (customer) => {
          try {
            const vehiclesResponse = await vehicleService.getByCustomer(customer.id);
            let vehicles = [];
            
            if (Array.isArray(vehiclesResponse.data)) {
              vehicles = vehiclesResponse.data;
            } else if (vehiclesResponse.data && vehiclesResponse.data.results && Array.isArray(vehiclesResponse.data.results)) {
              vehicles = vehiclesResponse.data.results;
            } else if (vehiclesResponse.data && vehiclesResponse.data.vehicles && Array.isArray(vehiclesResponse.data.vehicles)) {
              vehicles = vehiclesResponse.data.vehicles;
            }
            
            return {
              ...customer,
              vehicles: vehicles.length
            };
          } catch (err) {
            console.error(`Error fetching vehicles for customer ${customer.id}:`, err);
            return customer; // Return original customer if error occurs
          }
        })
      );
      
      setCustomers(customersWithVehicleCounts);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
      toast.error("Failed to load customers");
      // Set empty array on error to avoid filter errors
      setCustomers([]);
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
      first_name: customer.user.first_name,
      last_name: customer.user.last_name,
      email: customer.user.email,
      phone: customer.phone,
      address: customer.address,
      username: customer.user.username,
      // Note: We don't pass password - it would be hashed on the backend
    });
    setIsCustomerDialogOpen(true);
    
    // Close details dialog if it's open
    if (isCustomerDetailsDialogOpen) {
      setIsCustomerDetailsDialogOpen(false);
    }
  };

  const handleViewDetails = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsCustomerDetailsDialogOpen(true);
  };

  const handleAddVehicleFromDetails = () => {
    // Close the details dialog
    setIsCustomerDetailsDialogOpen(false);
    
    // Navigate to the vehicles page with customer filter
    if (selectedCustomerId) {
      navigate(`/vehicles/new?customer=${selectedCustomerId}`);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    try {
      // First check if the customer has any vehicles
      const response = await vehicleService.getByCustomer(customer.id);
      const vehicles = response.data;
      
      // If vehicles exist, show warning and prevent deletion
      if (Array.isArray(vehicles) && vehicles.length > 0) {
        toast.error(`Cannot delete customer with ${vehicles.length} vehicle${vehicles.length > 1 ? 's' : ''}. Please remove all vehicles first.`);
        return;
      }
      
      // Proceed with deletion dialog if no vehicles
      setCustomerToDelete(customer);
      setIsDeleteDialogOpen(true);
    } catch (err) {
      console.error("Error checking customer vehicles:", err);
      toast.error("Failed to check customer vehicles");
    }
  };

  const handleViewVehicles = async (customerId: number) => {
    try {
      // Navigate to vehicles page with customer filter
      navigate(`/vehicles?customer=${customerId}`);
    } catch (err) {
      console.error("Error navigating to vehicles:", err);
      toast.error("Failed to navigate to vehicles page");
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    const toastId = toast.loading("Deleting customer...");
    
    try {
      // The backend API will handle the cascading delete of the user account
      // when the customer is deleted (Django will use on_delete=CASCADE)
      await customerService.delete(customerToDelete.id);
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      toast.success("Customer and associated user account deleted", { id: toastId });
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("Failed to delete customer", { id: toastId });
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  // Safe filtering function that checks if properties exist before accessing them
  const filteredCustomers = Array.isArray(customers) 
    ? customers.filter((customer) => {
        // Make sure we have valid customer objects with required properties
        if (!customer) return false;
        
        // Get full name from first_name and last_name
        const fullName = customer.user && `${customer.user.first_name} ${customer.user.last_name}`.trim();
        const nameMatch = fullName 
          ? fullName.toLowerCase().includes(searchTerm.toLowerCase())
          : false;
          
        const emailMatch = customer.user?.email && typeof customer.user.email === 'string'
          ? customer.user.email.toLowerCase().includes(searchTerm.toLowerCase())
          : false;
          
        const phoneMatch = customer.phone && typeof customer.phone === 'string'
          ? customer.phone.includes(searchTerm)
          : false;

        const usernameMatch = customer.user?.username && typeof customer.user.username === 'string'
          ? customer.user.username.toLowerCase().includes(searchTerm.toLowerCase())
          : false;
          
        return nameMatch || emailMatch || phoneMatch || usernameMatch;
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage customer accounts and vehicle records
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
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <p>No customers match your search criteria. Try different filters.</p>
              ) : (
                <p>No customers found. Add your first customer to get started.</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-auto">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Address</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Vehicles</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{customer.user.first_name} {customer.user.last_name}</div>
                          <div className="text-xs text-muted-foreground">{customer.user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {customer.user.username}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {customer.phone}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {customer.address || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 min-w-8 rounded-full px-2"
                            onClick={() => handleViewVehicles(customer.id)}
                          >
                            <Car className="h-3.5 w-3.5 mr-1" />
                            <span>{customer.vehicles || 0}</span>
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="View Details"
                              onClick={() => handleViewDetails(customer.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Edit Customer"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Delete Customer"
                              onClick={() => handleDeleteCustomer(customer)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <CustomerDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      {/* Customer Details Dialog */}
      <CustomerDetailsDialog
        open={isCustomerDetailsDialogOpen}
        onOpenChange={setIsCustomerDetailsDialogOpen}
        customerId={selectedCustomerId}
        onEditClick={handleEditCustomer}
        onAddVehicle={handleAddVehicleFromDetails}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customerToDelete?.user?.first_name} ${customerToDelete?.user?.last_name}? This action cannot be undone and will also delete the user account.`}
      />
    </div>
  );
} 