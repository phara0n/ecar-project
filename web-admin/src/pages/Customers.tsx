import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Edit, Trash, Car, Eye, UserPlus, Loader2 } from "lucide-react";
import { customerService, vehicleService } from "@/lib/api";
import { toast } from "sonner";
import { CustomerDialog, CustomerFormData } from "@/components/CustomerDialog";
import { CustomerDetailsDialog } from "@/components/CustomerDetailsDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useNavigate } from "react-router-dom";
import { UserDialog } from "@/components/UserDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

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

// Define a Vehicle interface based on expected API response
interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
}

export function Customers() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Dialog state
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerDetailsDialogOpen, setIsCustomerDetailsDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Dialog state for User creation
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  // State for vehicle popovers
  const [popoverVehicles, setPopoverVehicles] = useState<Record<number, Vehicle[]>>({});
  const [popoverLoading, setPopoverLoading] = useState<Record<number, boolean>>({});
  const [popoverError, setPopoverError] = useState<Record<number, string | null>>({});

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
            // Note: This fetches vehicles just to get the count. 
            // We'll fetch the details again for the popover if needed.
            const vehiclesResponse = await vehicleService.getByCustomer(customer.id);
            let vehiclesCount = 0;
            
            if (Array.isArray(vehiclesResponse.data)) {
              vehiclesCount = vehiclesResponse.data.length;
            } else if (vehiclesResponse.data && vehiclesResponse.data.results && Array.isArray(vehiclesResponse.data.results)) {
              vehiclesCount = vehiclesResponse.data.results.length;
            } 
            
            return {
              ...customer,
              vehicles: vehiclesCount // Store only the count
            };
          } catch (err) {
            console.error(`Error fetching vehicles count for customer ${customer.id}:`, err);
            return { ...customer, vehicles: 0 }; // Assume 0 if count fails
          }
        })
      );
      
      setCustomers(customersWithVehicleCounts);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      const errorText = t('customerPage.errors.loadFailed', 'Failed to load customers. Please try again.');
      setError(errorText);
      toast.error(t('customerPage.errors.loadFailedShort', 'Failed to load customers'));
      // Set empty array on error to avoid filter errors
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomerId(undefined);
    setIsCustomerDialogOpen(true);
  };

  // Handler to open the User Dialog
  const handleAddUser = () => {
    setIsUserDialogOpen(true);
  };

  // Handler for successful user creation
  const handleUserCreationSuccess = () => {
    setIsUserDialogOpen(false);
    // Optional: Show a success message or trigger other actions
    // toast.info("User created. You can now select them when adding a customer.");
    // No need to explicitly refresh customer list here, 
    // as CustomerDialog fetches users when opened.
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
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
    // Translate toast messages
    try {
      const vehiclesCount = customer.vehicles ?? 0;
      if (vehiclesCount > 0) {
         toast.error(t('customerPage.errors.deleteWithVehicles', 
            `Cannot delete customer with {{count}} vehicle(s). Please remove all vehicles first.`, 
            { count: vehiclesCount }
         ));
         return;
      }      
      setCustomerToDelete(customer);
      setIsDeleteDialogOpen(true);
    } catch (err) {
      console.error("Error checking customer vehicles for deletion:", err);
      toast.error(t('customerPage.errors.checkVehiclesFailed', 'Failed to check customer vehicles before deletion.'));
    }
  };

  // Function to fetch vehicles for the popover when opened
  const handlePopoverOpen = async (customerId: number) => {
    // Translate error message
    if (!popoverVehicles[customerId] && !popoverLoading[customerId]) {
      setPopoverLoading(prev => ({ ...prev, [customerId]: true }));
      setPopoverError(prev => ({ ...prev, [customerId]: null }));
      try {
        const response = await vehicleService.getByCustomer(customerId);
        let vehiclesData: Vehicle[] = [];
        if (Array.isArray(response.data)) {
          vehiclesData = response.data;
        } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
          vehiclesData = response.data.results;
        } 
        console.log(`Fetched vehicles for popover (Customer ${customerId}):`, vehiclesData);
        const validatedVehicles = vehiclesData.map(v => ({ /* ... validation ... */ }));
        setPopoverVehicles(prev => ({ ...prev, [customerId]: validatedVehicles }));
      } catch (err) {
        console.error(`Error fetching vehicles for popover (Customer ${customerId}):`, err);
        const errorText = t('customerPage.errors.popoverLoadFailed', 'Failed to load vehicles.');
        setPopoverError(prev => ({ ...prev, [customerId]: errorText }));
        setPopoverVehicles(prev => ({ ...prev, [customerId]: [] }));
      } finally {
        setPopoverLoading(prev => ({ ...prev, [customerId]: false }));
      }
    }
  };

  const confirmDelete = async () => {
    // Translate toast messages
    if (!customerToDelete) return;
    const toastId = toast.loading(t('customerPage.actions.deleting', 'Deleting customer...'));
    try {
      await customerService.delete(customerToDelete.id);
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      toast.success(t('customerPage.actions.deleteSuccess', 'Customer and associated user account deleted'), { id: toastId });
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error(t('customerPage.errors.deleteFailed', 'Failed to delete customer'), { id: toastId });
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
          <h2 className="text-3xl font-bold tracking-tight">{t('customerPage.title', 'Customers')}</h2>
          <p className="text-muted-foreground">
            {t('customerPage.description', 'Manage customer accounts and vehicle records')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="flex items-center gap-2" onClick={handleAddUser}>
            <UserPlus className="h-4 w-4" />
            {t('customerPage.addUserButton', 'Add User')}
          </Button>
          <Button className="flex items-center gap-2" onClick={handleAddCustomer}>
            <Plus className="h-4 w-4" />
            {t('customerPage.addCustomerButton', 'Add Customer')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('customerPage.searchPlaceholder', 'Search customers...')}
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('customerTable.title', 'Customer List')}</CardTitle>
          <CardDescription>
            {loading 
              ? t('common.loading', 'Loading...') 
              : t('customerTable.description', 'View and manage all {{count}} customers', { count: filteredCustomers.length })
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
                {t('common.tryAgain', 'Try Again')}
              </Button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <p>{t('customerTable.emptySearch', 'No customers match your search criteria. Try different filters.')}</p>
              ) : (
                <p>{t('customerTable.emptyAll', 'No customers found. Add your first customer to get started.')}</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-auto">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('customerTable.headerCustomer', 'Customer')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('customerTable.headerUsername', 'Username')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('customerTable.headerPhone', 'Phone')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">{t('customerTable.headerAddress', 'Address')}</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">{t('customerTable.headerVehicles', 'Vehicles')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">{t('customerTable.headerActions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm align-middle">
                           {customer.user ? (
                              <div className="flex flex-col justify-center">
                                <div className="font-medium">{customer.user.first_name} {customer.user.last_name}</div>
                                <div className="text-xs text-muted-foreground">{customer.user.email}</div>
                              </div>
                           ) : (
                             <span className="text-muted-foreground italic">{t('common.noUserData', 'No user data')}</span>
                           )}
                        </td>
                        <td className="px-4 py-3 text-sm align-middle">
                          {customer.user?.username || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm align-middle">
                          {customer.phone || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm align-middle">
                          {customer.address || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center align-middle">
                          {(customer.vehicles ?? 0) > 0 ? (
                            <Popover onOpenChange={(isOpen) => { if (isOpen) { handlePopoverOpen(customer.id) } }}>
                              <PopoverTrigger 
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "h-8 min-w-8 rounded-full px-2 disabled:opacity-100 flex items-center gap-1"
                                )}
                                disabled={popoverLoading[customer.id]}
                              >
                                {popoverLoading[customer.id] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Car className="h-3.5 w-3.5" />
                                    <span>{customer.vehicles || 0}</span>
                                  </>
                                )}
                              </PopoverTrigger>
                              <PopoverContent className="w-60 p-2">
                                {popoverLoading[customer.id] ? (
                                  <div className="text-xs text-muted-foreground text-center py-2">{t('customerTable.popoverLoading', 'Loading vehicles...')}</div>
                                ) : popoverError[customer.id] ? (
                                  <div className="text-xs text-destructive text-center py-2">{popoverError[customer.id]}</div>
                                ) : popoverVehicles[customer.id] && popoverVehicles[customer.id].length > 0 ? (
                                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                                    {popoverVehicles[customer.id].map(vehicle => (
                                      <li key={vehicle.id} className="text-xs p-1 rounded hover:bg-muted flex justify-between items-center gap-2">
                                        <span className="flex-grow">
                                          {vehicle.make || 'N/A'} {vehicle.model || 'N/A'} ({vehicle.year || 'N/A'})<br/>{vehicle.license_plate || 'N/A'}
                                        </span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-auto p-1 flex-shrink-0"
                                          title={t('customerTable.popoverViewVehicleTooltip', 'View/Edit {{make}} {{model}}', { make: vehicle.make, model: vehicle.model })}
                                          onClick={(e) => { 
                                            e.stopPropagation();
                                            navigate(`/vehicles/${vehicle.id}/edit`); 
                                          }}
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="text-xs text-muted-foreground text-center py-2">{t('customerTable.popoverNoVehicles', 'No vehicles found.')}</div>
                                )}
                              </PopoverContent>
                            </Popover>
                           ) : (
                             <span className="inline-flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground text-xs border">0</span>
                           )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right align-middle">
                          <div className="flex items-center justify-end">
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title={t('customerActions.viewDetailsTooltip', 'View Details')}
                                onClick={() => handleViewDetails(customer.id)}
                                disabled={!customer.user}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title={t('customerActions.editCustomerTooltip', 'Edit Customer')}
                                onClick={() => handleEditCustomer(customer)}
                                disabled={!customer.user}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                title={t('customerActions.deleteCustomerTooltip', 'Delete Customer')}
                                onClick={() => handleDeleteCustomer(customer)}
                                disabled={!customer.user}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
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
        key={selectedCustomerId || 'new'}
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        customerId={selectedCustomerId}
        onSuccess={() => {
          fetchCustomers();
        }}
      />

      {/* Customer Details Dialog */}
      {selectedCustomerId !== undefined && (
        <CustomerDetailsDialog
          open={isCustomerDetailsDialogOpen}
          onOpenChange={setIsCustomerDetailsDialogOpen}
          customerId={selectedCustomerId}
          onEdit={() => handleEditCustomer({ id: selectedCustomerId, user: {} as User, phone: '' })}
          onAddVehicle={handleAddVehicleFromDetails}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={t('deleteDialog.customerTitle', 'Delete Customer')}
        description={t('deleteDialog.customerDescription', 
          'Are you sure you want to delete customer "{{name}}"? This will also delete their associated user account and cannot be undone.',
          { name: `${customerToDelete?.user?.first_name || ''} ${customerToDelete?.user?.last_name || ''}` }
        )}
      />

      {/* User Dialog for Add */}
      <UserDialog 
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        onSuccess={handleUserCreationSuccess}
      />
    </div>
  );
} 