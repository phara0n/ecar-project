import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Edit, Trash, Car, Wrench } from "lucide-react";
import { customerService, vehicleService } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleDialog, VehicleFormData } from "@/components/VehicleDialog";

// Interface to match backend API response structure
interface Vehicle {
  id: number;
  customer: number | { id: number; [key: string]: any };
  customer_name?: string;  // This will be populated manually
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  mileage?: number;
  last_service_date?: string;
  next_service_date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface Customer {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  phone: string;
  address?: string;
}

export function Vehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const navigate = useNavigate();
  const params = useParams();
  
  // Dialog state
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleFormData | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Initialize from URL parameters and handle route-based dialog display
  useEffect(() => {
    const customerId = searchParams.get("customer");
    if (customerId) {
      setSelectedCustomerId(customerId);
    } else {
      // If no customer ID is specified, set to "all"
      setSelectedCustomerId("");
    }

    // Check the route parameters to see if we should show a dialog
    if (params.id) {
      if (window.location.pathname.includes('/edit')) {
        // Edit mode - fetch the vehicle and open edit dialog
        fetchVehicleForEdit(parseInt(params.id));
      } else if (window.location.pathname.includes('/services')) {
        // Service history route - will be handled elsewhere
      } 
    } else if (window.location.pathname === '/vehicles/new') {
      // New vehicle mode - open the dialog for adding a new vehicle
      setSelectedVehicle(undefined);
      setIsVehicleDialogOpen(true);
    }
  }, [params, window.location.pathname, searchParams]);

  // Fetch vehicles based on filter
  useEffect(() => {
    fetchVehicles();
    fetchCustomers(); // Get customers for the dropdown filter
  }, [selectedCustomerId]);

  const fetchVehicleForEdit = async (vehicleId: number) => {
    try {
      const response = await vehicleService.getById(vehicleId);
      const vehicleData = response.data;
      
      // Extract customer ID whether it's a number or an object
      const customerId = typeof vehicleData.customer === 'object' && vehicleData.customer !== null
        ? vehicleData.customer.id
        : vehicleData.customer;
      
      const vehicleFormData: VehicleFormData = {
        id: vehicleData.id,
        customer: customerId,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        license_plate: vehicleData.license_plate,
        vin: vehicleData.vin,
        color: vehicleData.color || "",
        mileage: vehicleData.mileage || 0
      };
      
      setSelectedVehicle(vehicleFormData);
      setIsVehicleDialogOpen(true);
    } catch (err) {
      console.error("Error fetching vehicle for edit:", err);
      toast.error("Failed to load vehicle details");
      navigate('/vehicles');
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    
    try {
      let response;
      
      if (selectedCustomerId) {
        // If a customer filter is applied
        response = await vehicleService.getByCustomer(parseInt(selectedCustomerId));
      } else {
        // Fetch all vehicles
        response = await vehicleService.getAll();
      }
      
      console.log("API Response:", response.data);
      
      // Handle different API response formats
      let vehiclesData: Vehicle[] = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response
        vehiclesData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        // DRF paginated response
        vehiclesData = response.data.results;
      } else if (response.data && response.data.vehicles && Array.isArray(response.data.vehicles)) {
        // Custom format with vehicles field
        vehiclesData = response.data.vehicles;
      }
      
      // Enrich vehicles with customer names
      const enrichedVehicles = await enrichVehiclesWithCustomerNames(vehiclesData);
      
      setVehicles(enrichedVehicles);
    } catch (err: any) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to load vehicles. Please try again.");
      toast.error("Failed to load vehicles");
      // Set empty array on error to avoid filter errors
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      
      let customersData: Customer[] = [];
      
      if (Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        customersData = response.data.results;
      } else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        customersData = response.data.customers;
      }
      
      setCustomers(customersData);
    } catch (err) {
      console.error("Error fetching customers:", err);
      // Don't show an error toast for this, as it's secondary data
      setCustomers([]);
    }
  };

  // Function to add customer names to vehicles
  const enrichVehiclesWithCustomerNames = async (vehiclesData: Vehicle[]) => {
    const customerMap = new Map<number, string>();
    
    // Try to get customer data for the vehicles
    try {
      const response = await customerService.getAll();
      let customersData: Customer[] = [];
      
      if (Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        customersData = response.data.results;
      } else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        customersData = response.data.customers;
      }
      
      // Create a map of customer IDs to names
      customersData.forEach(customer => {
        const fullName = `${customer.user.first_name} ${customer.user.last_name}`.trim();
        customerMap.set(customer.id, fullName);
      });
    } catch (err) {
      console.error("Error fetching customer data for vehicles:", err);
    }
    
    // Add customer names to vehicles
    return vehiclesData.map(vehicle => {
      // Extract customer ID whether it's a number or an object
      const customerId = typeof vehicle.customer === 'object' && vehicle.customer !== null
        ? vehicle.customer.id
        : vehicle.customer;
      
      return {
        ...vehicle,
        customer_name: customerMap.get(customerId) || `Customer #${customerId}`
      };
    });
  };

  const handleAddVehicle = () => {
    // Navigate to add vehicle form
    navigate("/vehicles/new");
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    // Navigate to edit vehicle form
    navigate(`/vehicles/${vehicle.id}/edit`);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleViewServiceHistory = (vehicleId: number) => {
    // Navigate to service history page
    navigate(`/vehicles/${vehicleId}/services`);
  };

  const handleVehicleDialogClose = () => {
    setIsVehicleDialogOpen(false);
    
    // Navigate back to the vehicles list if we came from a specific route
    if (window.location.pathname !== '/vehicles') {
      navigate('/vehicles');
    }
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;
    
    const toastId = toast.loading("Deleting vehicle...");
    
    try {
      await vehicleService.delete(vehicleToDelete.id);
      setVehicles(vehicles.filter(v => v.id !== vehicleToDelete.id));
      toast.success("Vehicle deleted successfully", { id: toastId });
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      toast.error("Failed to delete vehicle", { id: toastId });
    } finally {
      setIsDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const handleCustomerFilterChange = (customerId: string) => {
    // Handle "all" as no filter
    if (customerId === "all") {
      setSelectedCustomerId("");
      // Remove customer param if "all" is selected
      searchParams.delete("customer");
      setSearchParams(searchParams);
    } else {
      setSelectedCustomerId(customerId);
      
      // Update URL params
      if (customerId) {
        setSearchParams({ customer: customerId });
      } else {
        // Remove customer param if no customer is selected
        searchParams.delete("customer");
        setSearchParams(searchParams);
      }
    }
  };

  // Safe filtering function that checks if properties exist before accessing them
  const filteredVehicles = Array.isArray(vehicles) 
    ? vehicles.filter((vehicle) => {
        // Make sure we have valid vehicle objects with required properties
        if (!vehicle) return false;
        
        const makeModelMatch = 
          `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase());
          
        const licensePlateMatch = vehicle.license_plate && 
          vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase());
          
        const vinMatch = vehicle.vin && 
          vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase());
          
        const customerNameMatch = vehicle.customer_name && 
          vehicle.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
          
        return makeModelMatch || licensePlateMatch || vinMatch || customerNameMatch;
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">
            Manage vehicle records and service history
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleAddVehicle}>
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vehicles..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select 
            value={selectedCustomerId || "all"} 
            onValueChange={handleCustomerFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filter by customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.user.first_name} {customer.user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 h-9 w-full sm:w-auto">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle List</CardTitle>
          <CardDescription>
            {loading 
              ? "Loading vehicles..." 
              : selectedCustomerId
                ? `Showing ${filteredVehicles.length} vehicles for selected customer`
                : `View and manage all ${filteredVehicles.length} vehicles`
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
                onClick={fetchVehicles}
              >
                Try Again
              </Button>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedCustomerId ? (
                <p>No vehicles match your search criteria. Try different filters.</p>
              ) : (
                <p>No vehicles found. Add your first vehicle to get started.</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-auto">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Vehicle</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">License Plate</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Year</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Last Service</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span>{vehicle.make} {vehicle.model}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            VIN: {vehicle.vin || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {vehicle.license_plate || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {vehicle.customer_name || (
                            typeof vehicle.customer === 'object' && vehicle.customer !== null
                              ? `${vehicle.customer.user?.first_name || ''} ${vehicle.customer.user?.last_name || ''}`.trim() || `Customer #${vehicle.customer.id}`
                              : `Customer #${vehicle.customer}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {vehicle.year || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Badge
                            className={`${
                              vehicle.status === "active"
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : "bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30"
                            }`}
                          >
                            {vehicle.status || "inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="View Service History"
                              onClick={() => handleViewServiceHistory(vehicle.id)}
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Edit Vehicle"
                              onClick={() => handleEditVehicle(vehicle)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Delete Vehicle"
                              onClick={() => handleDeleteVehicle(vehicle)}
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

      {/* Vehicle Dialog */}
      <VehicleDialog
        open={isVehicleDialogOpen}
        onOpenChange={handleVehicleDialogClose}
        vehicle={selectedVehicle}
        onSuccess={fetchVehicles}
        customerId={selectedCustomerId ? parseInt(selectedCustomerId) : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        description={`Are you sure you want to delete the ${vehicleToDelete?.make} ${vehicleToDelete?.model} (${vehicleToDelete?.license_plate || "No plate"})? This action cannot be undone and will remove all service records associated with this vehicle.`}
      />
    </div>
  );
} 