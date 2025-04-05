import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash, Car, Calendar, Wrench, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { serviceService, vehicleService } from "@/lib/api";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceDialog, ServiceFormData } from "@/components/ServiceDialog";

// Interface for service data structure from API
interface ApiService {
  id: number;
  car_id: number;
  scheduled_date: string;
  title: string;
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

// Interface for service data structure used in our component
interface Service {
  id: number;
  vehicle: number;
  vehicle_info?: {
    make: string;
    model: string;
    license_plate: string;
  };
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

export function Services() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Record<number, Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Dialog state for service deletion
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  // Dialog state for adding/editing services
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Partial<ServiceFormData> | undefined>(undefined);

  // Fetch all services on component mount
  useEffect(() => {
    fetchServices();
  }, []);

  // Fetch all services
  const fetchServices = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await serviceService.getAll();
      let apiServicesData: ApiService[] = [];
      
      if (Array.isArray(response.data)) {
        apiServicesData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        apiServicesData = response.data.results;
      } else if (response.data && response.data.services && Array.isArray(response.data.services)) {
        apiServicesData = response.data.services;
      }
      
      // Transform API service data to our expected service format
      const servicesData: Service[] = apiServicesData.map(apiService => {
        console.log("Raw service data:", apiService); // Log raw service data
        
        // Ensure numeric values are properly handled
        const mileage = apiService.mileage !== undefined && apiService.mileage !== null 
          ? Number(apiService.mileage) 
          : null;
          
        // Ensure technician is properly handled
        const technician = apiService.technician !== undefined 
          ? String(apiService.technician) 
          : '';
          
        console.log(`Service ID ${apiService.id} - Technician: "${technician}", Mileage: ${mileage}`);
        
        return {
          id: apiService.id,
          vehicle: apiService.car_id,
          service_date: apiService.scheduled_date,
          service_type: apiService.title,
          description: apiService.description,
          cost: apiService.cost !== undefined && apiService.cost !== null ? Number(apiService.cost) : 0,
          mileage: mileage,
          status: apiService.status,
          technician: technician,
          notes: apiService.notes || '',
          parts_used: apiService.parts_used || '',
          created_at: apiService.created_at,
          updated_at: apiService.updated_at
        };
      });
      
      // Sort services by date (newest first)
      servicesData.sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
      
      // Fetch vehicle information for each service
      await fetchVehicleInfoForServices(servicesData);
      
    } catch (err: any) {
      console.error("Error fetching services:", err);
      setError("Failed to load services. Please try again.");
      toast.error("Failed to load services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicle information for all services
  const fetchVehicleInfoForServices = async (servicesData: Service[]) => {
    try {
      // Get unique vehicle IDs and filter out undefined or invalid values
      const vehicleIds = [...new Set(servicesData.map(service => service.vehicle))]
        .filter(id => id !== undefined && id !== null && !isNaN(id));
      
      // Fetch vehicles
      const vehicleMap: Record<number, Vehicle> = {};
      
      await Promise.all(
        vehicleIds.map(async (vehicleId) => {
          try {
            const response = await vehicleService.getById(vehicleId);
            vehicleMap[vehicleId] = response.data;
          } catch (error) {
            console.error(`Error fetching vehicle ${vehicleId}:`, error);
            // Create a placeholder for missing vehicles
            vehicleMap[vehicleId] = {
              id: vehicleId,
              customer: 0,
              make: "Unknown",
              model: "Vehicle",
              year: 0,
              license_plate: `ID: ${vehicleId}`,
              vin: ""
            };
          }
        })
      );
      
      // Add vehicle info to each service
      const enrichedServices = servicesData.map(service => {
        // Check if service.vehicle is valid and exists in vehicleMap
        const hasValidVehicle = service.vehicle !== undefined && 
                               service.vehicle !== null && 
                               !isNaN(service.vehicle) && 
                               vehicleMap[service.vehicle];
        
        return {
          ...service,
          vehicle_info: hasValidVehicle ? {
            make: vehicleMap[service.vehicle].make,
            model: vehicleMap[service.vehicle].model,
            license_plate: vehicleMap[service.vehicle].license_plate
          } : undefined
        };
      });
      
      setVehicles(vehicleMap);
      setServices(enrichedServices);
    } catch (err) {
      console.error("Error fetching vehicle information:", err);
      // Still show services even if vehicle info fails
      setServices(servicesData);
    }
  };

  // Handle adding a new service record
  const handleAddService = () => {
    setSelectedService(undefined); // Clear any previously selected service
    setIsServiceDialogOpen(true);
  };

  // Handle editing a service record
  const handleEditService = (service: Service) => {
    // Convert service object to form data format
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

  // Handle viewing vehicle details
  const handleViewVehicle = (vehicleId: number) => {
    navigate(`/vehicles/${vehicleId}/services`);
  };

  // Filter services based on search term and active tab
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.technician && service.technician.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.notes && service.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.vehicle_info && 
        (`${service.vehicle_info.make} ${service.vehicle_info.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.vehicle_info.license_plate.toLowerCase().includes(searchTerm.toLowerCase())));
    
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
          <h2 className="text-3xl font-bold tracking-tight">Service Records</h2>
          <p className="text-muted-foreground">
            Manage all service records across vehicles
          </p>
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
          <CardTitle>All Services</CardTitle>
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
                onClick={fetchServices}
              >
                Try Again
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || activeTab !== "all" ? (
                <p>No service records match your search criteria or selected filter.</p>
              ) : (
                <p>No service records found. Add your first service record to get started.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{service.service_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(service.status)}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(service.service_date), "PPP")}
                        </span>
                      </div>
                    </div>
                    
                    {service.vehicle_info && (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary font-medium mb-2"
                        onClick={() => handleViewVehicle(service.vehicle)}
                      >
                        <Car className="h-4 w-4 mr-1" />
                        {service.vehicle_info.make} {service.vehicle_info.model}
                        {service.vehicle_info.license_plate && ` (${service.vehicle_info.license_plate})`}
                      </Button>
                    )}
                    
                    <p className="text-sm mb-2">{service.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Mileage</p>
                        {console.log(`Service ${service.id} mileage:`, service.mileage, typeof service.mileage)}
                        {(() => {
                          // Defensive rendering for mileage field
                          try {
                            if (service.mileage !== undefined && service.mileage !== null) {
                              const mileageNum = Number(service.mileage);
                              return <p className="text-sm">{!isNaN(mileageNum) ? mileageNum.toLocaleString() : 'N/A'} km</p>;
                            }
                            return <p className="text-sm">N/A km</p>;
                          } catch(e) {
                            console.error("Error rendering mileage:", e);
                            return <p className="text-sm">N/A km</p>;
                          }
                        })()}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost</p>
                        {(() => {
                          // Defensive rendering for cost field
                          try {
                            if (service.cost !== undefined && service.cost !== null) {
                              const costNum = Number(service.cost);
                              return <p className="text-sm">${!isNaN(costNum) ? costNum.toFixed(2) : '0.00'}</p>;
                            }
                            return <p className="text-sm">$0.00</p>;
                          } catch(e) {
                            console.error("Error rendering cost:", e);
                            return <p className="text-sm">$0.00</p>;
                          }
                        })()}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Technician</p>
                        {console.log(`Service ${service.id} technician:`, service.technician, typeof service.technician)}
                        {(() => {
                          // Defensive rendering for technician field
                          try {
                            // Explicit string handling
                            if (service.technician) {
                              const technicianStr = String(service.technician).trim();
                              return <p className="text-sm">{technicianStr || "Not assigned"}</p>;
                            }
                            return <p className="text-sm">Not assigned</p>;
                          } catch(e) {
                            console.error("Error rendering technician:", e);
                            return <p className="text-sm">Not assigned</p>;
                          }
                        })()}
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
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteService(service)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
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
        service={selectedService}
        onSuccess={fetchServices}
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