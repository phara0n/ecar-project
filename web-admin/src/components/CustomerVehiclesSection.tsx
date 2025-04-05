import { useState, useEffect } from "react";
import { vehicleService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Car, Edit, Trash, Wrench } from "lucide-react";
import { toast } from "sonner";
import { VehicleDialog, VehicleFormData } from "@/components/VehicleDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface Vehicle {
  id: number;
  customer: number | { id: number; [key: string]: any };
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  mileage?: number;
  fuel_type?: string;
  average_daily_mileage?: number;
  last_service_date?: string;
  last_service_mileage?: number;
}

interface CustomerVehiclesSectionProps {
  customerId: number;
  refreshTrigger?: number;
  onAddVehicle?: () => void;
}

export function CustomerVehiclesSection({ 
  customerId, 
  refreshTrigger = 0,
  onAddVehicle
}: CustomerVehiclesSectionProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleFormData | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (customerId) {
      fetchVehicles();
    }
  }, [customerId, refreshTrigger]);

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await vehicleService.getByCustomer(customerId);
      
      // Handle different API response formats
      let vehiclesData: Vehicle[] = [];
      
      if (Array.isArray(response.data)) {
        vehiclesData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        vehiclesData = response.data.results;
      } else if (response.data && response.data.vehicles && Array.isArray(response.data.vehicles)) {
        vehiclesData = response.data.vehicles;
      }
      
      setVehicles(vehiclesData);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to load vehicles");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = () => {
    if (onAddVehicle) {
      onAddVehicle();
      return;
    }
    
    setSelectedVehicle({
      customer: customerId,
      make: "",
      model: "",
      year: new Date().getFullYear(),
      license_plate: "",
      vin: "",
      color: "",
      mileage: 0
    });
    setIsVehicleDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    // Extract customer ID whether it's a number or an object
    const vehicleCustomerId = typeof vehicle.customer === 'object' && vehicle.customer !== null
      ? vehicle.customer.id
      : vehicle.customer;
    
    setSelectedVehicle({
      id: vehicle.id,
      customer: vehicleCustomerId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.license_plate,
      vin: vehicle.vin,
      color: vehicle.color || "",
      mileage: vehicle.mileage || 0,
      last_service_date: vehicle.last_service_date || null,
      last_service_mileage: vehicle.last_service_mileage || null
    });
    setIsVehicleDialogOpen(true);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleViewServiceHistory = (vehicleId: number) => {
    navigate(`/vehicles/${vehicleId}/services`);
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

  return (
    <div className="space-y-4">
      <div className="bg-blue-900 text-white p-3 font-medium flex justify-between items-center">
        <span>CARS</span>
        <Button 
          variant="ghost" 
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={handleAddVehicle}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un objet Car supplémentaire
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md">
          {error}
          <Button variant="outline" size="sm" className="ml-4" onClick={fetchVehicles}>
            Try Again
          </Button>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Car className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No vehicles found for this customer.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleAddVehicle}>
            <Plus className="h-4 w-4 mr-1" />
            Add Vehicle
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">MAKE</th>
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">MODEL</th>
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">YEAR</th>
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">LICENSE PLATE</th>
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">VIN</th>
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">FUEL TYPE</th>
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">MILEAGE</th>
                <th className="py-2 px-3 text-left text-xs font-medium uppercase">AVERAGE DAILY</th>
                <th className="py-2 px-3 text-right text-xs font-medium uppercase">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-muted">
                  <td className="py-2 px-3">
                    <Input 
                      className="w-full" 
                      defaultValue={vehicle.make}
                      readOnly 
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      className="w-full" 
                      defaultValue={vehicle.model}
                      readOnly 
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      className="w-full" 
                      defaultValue={vehicle.year.toString()}
                      readOnly 
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      className="w-full" 
                      defaultValue={vehicle.license_plate}
                      readOnly 
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      className="w-full" 
                      defaultValue={vehicle.vin}
                      readOnly 
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select 
                      className="w-full p-2 rounded-md border border-input"
                      defaultValue={vehicle.fuel_type || "Gasoline"}
                      readOnly
                      disabled
                    >
                      <option value="Gasoline">Gasoline</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      className="w-full" 
                      defaultValue={vehicle.mileage?.toString() || "0"}
                      readOnly 
                    />
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      className="w-full" 
                      defaultValue={vehicle.average_daily_mileage?.toString() || "-"}
                      readOnly 
                    />
                  </td>
                  <td className="py-2 px-3 flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleViewServiceHistory(vehicle.id)}
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteVehicle(vehicle)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Vehicle Dialog */}
      <VehicleDialog
        open={isVehicleDialogOpen}
        onOpenChange={setIsVehicleDialogOpen}
        vehicle={selectedVehicle}
        onSuccess={fetchVehicles}
        customerId={customerId}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        description={`Are you sure you want to delete the ${vehicleToDelete?.make} ${vehicleToDelete?.model} (${vehicleToDelete?.license_plate || "No plate"})? This action cannot be undone.`}
      />
    </div>
  );
} 