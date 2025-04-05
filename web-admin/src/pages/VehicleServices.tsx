import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash, Car, ArrowLeft, Calendar, Tool, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { vehicleService, serviceService } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceDialog, ServiceFormData } from "@/components/ServiceDialog";

// Interface for service data structure
interface Service {
  id: number;
  vehicle: number;
  service_date: string;
  service_type: string;
  description: string;
  cost: number;
  mileage: number;
  status: string;
  technician?: string;
  notes?: string;
  parts_used?: string;
  created_at: string;
  updated_at: string;
}

// Interface for vehicle data structure
interface Vehicle {
  id: number;
  customer: number | { id: number; [key: string]: any };
  customer_name?: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  mileage?: number;
}

export function VehicleServices() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vehicleId = parseInt(id || "0");

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [error, setError] = useState("");
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Dialog state for adding/editing services
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Partial<ServiceFormData> | undefined>(undefined);

  // Fetch vehicle details and service history
  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails(vehicleId);
      fetchServiceHistory(vehicleId);
    } else {
      setError("Invalid vehicle ID");
      setLoading(false);
      setLoadingVehicle(false);
    }
  }, [vehicleId]);

  // Fetch vehicle details
  const fetchVehicleDetails = async (id: number) => {
    setLoadingVehicle(true);

    try {
      const response = await vehicleService.getById(id);
      setVehicle(response.data);
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
      toast.error("Failed to load vehicle details");
      setVehicle(null);
    } finally {
      setLoadingVehicle(false);
    }
  };

  // Fetch service history for the vehicle
  const fetchServiceHistory = async (vehicleId: number) => {
    setLoading(true);
    setError("");

    try {
      const response = await serviceService.getByVehicle(vehicleId);
      
      let servicesData: Service[] = [];
      
      if (Array.isArray(response.data)) {
        servicesData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        servicesData = response.data.results;
      } else if (response.data && response.data.services && Array.isArray(response.data.services)) {
        servicesData = response.data.services;
      }
      
      // Sort services by date (newest first)
      servicesData.sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
      
      setServices(servicesData);
    } catch (err: any) {
      console.error("Error fetching service history:", err);
      setError("Failed to load service history. Please try again.");
      toast.error("Failed to load service history");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new service record
  const handleAddService = () => {
    setSelectedService(undefined); // Clear any previously selected service
    setIsServiceDialogOpen(true);
  };

  // Handle editing a service record
  const handleEditService = (service: Service) => {
    // Convert API service object to form data format
    const serviceFormData: Partial<ServiceFormData> = {
      id: service.id,
      vehicle: service.vehicle,
      service_date: new Date(service.service_date),
      service_type: service.service_type,
      description: service.description,
      cost: service.cost,
      mileage: service.mileage,
      status: service.status,
      technician: service.technician,
      notes: service.notes,
      parts_used: service.parts_used
    };
    
    setSelectedService(serviceFormData);
    setIsServiceDialogOpen(true);
  };

  // Handle deleting a service record
  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion of a service record
  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    
    const toastId = toast.loading("Deleting service record...");
    
    try {
      await serviceService.delete(serviceToDelete.id);
      setServices(services.filter(s => s.id !== serviceToDelete.id));
      toast.success("Service record deleted successfully", { id: toastId });
    } catch (err) {
      console.error("Error deleting service record:", err);
      toast.error("Failed to delete service record", { id: toastId });
    } finally {
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  // Go back to vehicles list
  const handleBackToVehicles = () => {
    navigate("/vehicles");
  };

  // Filter services based on search term and active tab
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.technician && service.technician.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.notes && service.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter based on active tab
    if (activeTab === "all") {
      return matchesSearch;
    } else if (activeTab === "completed") {
      return matchesSearch && service.status === "completed";
    } else if (activeTab === "pending") {
      return matchesSearch && service.status === "pending";
    } else if (activeTab === "scheduled") {
      return matchesSearch && service.status === "scheduled";
    }
    
    return matchesSearch;
  });

  // Get status badge color based on service status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Scheduled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-2" 
            onClick={handleBackToVehicles}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Button>
          
          <h2 className="text-3xl font-bold tracking-tight">
            {loadingVehicle ? (
              <Skeleton className="h-9 w-60" />
            ) : vehicle ? (
              <>
                {vehicle.make} {vehicle.model} Service History
              </>
            ) : (
              "Vehicle Service History"
            )}
          </h2>
          
          {!loadingVehicle && vehicle && (
            <div className="text-muted-foreground">
              <p className="flex items-center gap-1">
                <Car className="h-4 w-4" /> 
                {vehicle.year} • {vehicle.license_plate || "No plate"} • VIN: {vehicle.vin || "N/A"}
              </p>
              {vehicle.mileage && (
                <p className="mt-1">Current Mileage: {vehicle.mileage.toLocaleString()} km</p>
              )}
            </div>
          )}
        </div>
        <Button className="flex items-center gap-2" onClick={handleAddService}>
          <Plus className="h-4 w-4" />
          Add Service Record
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search service records..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Service History</CardTitle>
          <CardDescription>
            {loading 
              ? "Loading service records..." 
              : `${filteredServices.length} service records found`
            }
          </CardDescription>
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mt-2"
          >
            <TabsList>
              <TabsTrigger value="all">All Services</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={() => fetchServiceHistory(vehicleId)}
              >
                Try Again
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? (
                <p>No service records match your search criteria.</p>
              ) : (
                <p>No service records found for this vehicle.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Tool className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{service.service_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(service.status)}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(service.service_date), "PPP")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{service.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Mileage</p>
                        <p className="text-sm">{service.mileage.toLocaleString()} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="text-sm">${service.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Technician</p>
                        <p className="text-sm">{service.technician || "Not assigned"}</p>
                      </div>
                    </div>
                    
                    {service.notes && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="text-sm">{service.notes}</p>
                      </div>
                    )}
                    
                    {service.parts_used && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">Parts Used</p>
                        <p className="text-sm">{service.parts_used}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit Service"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      title="Delete Service"
                      onClick={() => handleDeleteService(service)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <ServiceDialog
        open={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        vehicleId={vehicleId}
        service={selectedService}
        onSuccess={fetchServiceHistory}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Service Record"
        description={`Are you sure you want to delete this service record? This action cannot be undone.`}
      />
    </div>
  );
} 