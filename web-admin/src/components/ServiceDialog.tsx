import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serviceService, vehicleService } from "@/lib/api";
import { toast } from "sonner";
import { CalendarIcon, LoaderCircle, Car } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Types for props and form data
export interface ServiceFormData {
  id?: number;
  vehicle: number;
  service_date: Date;
  service_type: string;
  description: string;
  cost: number;
  mileage: number;
  status: string;
  technician?: string;
  notes?: string;
  parts_used?: string;
}

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId?: number;
  service?: Partial<ServiceFormData>;
  onSuccess: () => void;
}

// Interface for vehicle data
interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  mileage?: number;
}

// Array of common service types for select options
const SERVICE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Engine Tune-up",
  "Transmission Service",
  "Battery Replacement",
  "Air Filter Replacement",
  "Fluid Check/Refill",
  "Wheel Alignment",
  "Inspection",
  "Diagnostics",
  "Electrical System",
  "Air Conditioning",
  "Suspension",
  "Other"
];

// Array of service status options
const SERVICE_STATUSES = [
  "scheduled",
  "pending",
  "completed",
  "cancelled"
];

export function ServiceDialog({ open, onOpenChange, vehicleId, service, onSuccess }: ServiceDialogProps) {
  // Determine if this is an edit or create operation
  const isEditing = !!service?.id;
  
  // Vehicle selection is needed when adding from Services page
  const isVehicleSelectionMode = vehicleId === undefined;
  
  // State for available vehicles when in vehicle selection mode
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [lastRecordedMileage, setLastRecordedMileage] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ServiceFormData>({
    vehicle: vehicleId || 0,
    service_date: new Date(),
    service_type: "",
    description: "",
    cost: 0,
    mileage: 0,
    status: "scheduled",
    technician: "",
    notes: "",
    parts_used: ""
  });
  
  // Form validation and submission state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Load available vehicles when dialog opens in vehicle selection mode
  useEffect(() => {
    if (open && isVehicleSelectionMode) {
      fetchVehicles();
    }
  }, [open, isVehicleSelectionMode]);
  
  // Fetch vehicles for selection
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await vehicleService.getAll();
      let vehiclesData = Array.isArray(response.data) ? response.data : 
        (response.data?.results || []);
      
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoadingVehicles(false);
    }
  };
  
  // Get vehicle details when a vehicle is selected or when editing with fixed vehicleId
  useEffect(() => {
    const currentVehicleId = isVehicleSelectionMode ? formData.vehicle : vehicleId;
    
    if (currentVehicleId && currentVehicleId > 0) {
      fetchVehicleDetails(currentVehicleId);
    }
  }, [formData.vehicle, vehicleId, isVehicleSelectionMode, open]);
  
  // Fetch vehicle details including last mileage
  const fetchVehicleDetails = async (id: number) => {
    try {
      const response = await vehicleService.getById(id);
      const vehicleData = response.data;
      
      setSelectedVehicle(vehicleData);
      
      // Set the last recorded mileage from the vehicle data
      if (vehicleData.mileage) {
        setLastRecordedMileage(vehicleData.mileage);
        
        // If not editing and mileage is 0, set it to the vehicle's current mileage
        if (!isEditing && formData.mileage === 0) {
          setFormData(prev => ({
            ...prev,
            mileage: vehicleData.mileage
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      setSelectedVehicle(null);
      setLastRecordedMileage(null);
    }
  };
  
  // Initialize form with service data if editing
  useEffect(() => {
    if (service && open) {
      // Explicitly type and convert fields when initializing form data from service
      setFormData({
        ...formData,
        ...service,
        // Ensure vehicle ID is set correctly
        vehicle: service.vehicle || vehicleId || 0,
        // Convert string date to Date object
        service_date: service.service_date ? new Date(service.service_date) : new Date(),
        // Ensure numeric fields are numbers
        cost: typeof service.cost === 'number' ? service.cost : 0,
        mileage: typeof service.mileage === 'number' ? service.mileage : 0,
        // Ensure string fields are strings
        service_type: service.service_type || "",
        description: service.description || "",
        technician: service.technician !== undefined ? String(service.technician) : "",
        notes: service.notes !== undefined ? String(service.notes) : "",
        parts_used: service.parts_used !== undefined ? String(service.parts_used) : "",
        status: service.status || "scheduled"
      });
      
      console.log("Initialized form data for editing:", {
        ...service,
        technician: String(service.technician),
        mileage: Number(service.mileage)
      });
    } else if (open) {
      // Reset form when opening for a new service
      setFormData({
        vehicle: vehicleId || 0,
        service_date: new Date(),
        service_type: "",
        description: "",
        cost: 0,
        mileage: lastRecordedMileage || 0,
        status: "scheduled",
        technician: "",
        notes: "",
        parts_used: ""
      });
    }
    
    // Clear errors when dialog opens/closes
    setErrors({});
  }, [service, open, vehicleId, lastRecordedMileage]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user changes it
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
    
    // Special handling for technician field
    if (name === 'technician') {
      console.log(`Processing technician field: "${value}"`);
      // Update form data with explicit string handling
      setFormData(prevState => {
        const updatedData = {
          ...prevState,
          technician: value !== undefined ? String(value) : ''
        };
        console.log('Updated technician in form data:', updatedData.technician, typeof updatedData.technician);
        return updatedData;
      });
    } else {
      // Update form data for other fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle changes for number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const value = e.target.value;
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors({
        ...errors,
        [fieldName]: ""
      });
    }
    
    // Update form data with numeric value (or 0 if invalid)
    setFormData({
      ...formData,
      [fieldName]: value === "" ? 0 : parseFloat(value)
    });
  };
  
  // Handle select changes
  const handleSelectChange = (value: string, fieldName: string) => {
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors({
        ...errors,
        [fieldName]: ""
      });
    }
    
    // Update form data
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };
  
  // Handle vehicle selection change
  const handleVehicleChange = (vehicleId: string) => {
    const numericId = parseInt(vehicleId, 10);
    
    // Clear error for this field
    if (errors.vehicle) {
      setErrors({
        ...errors,
        vehicle: ""
      });
    }
    
    // Update form data
    setFormData({
      ...formData,
      vehicle: numericId
    });
  };
  
  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Clear error for date field
      if (errors.service_date) {
        setErrors({
          ...errors,
          service_date: ""
        });
      }
      
      // Update form data with selected date
      setFormData({
        ...formData,
        service_date: date
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Vehicle selection validation
    if (isVehicleSelectionMode && (!formData.vehicle || formData.vehicle <= 0)) {
      newErrors.vehicle = "Please select a vehicle";
    }
    
    // Required fields validation
    if (!formData.service_type) {
      newErrors.service_type = "Service type is required";
    }
    
    if (!formData.description) {
      newErrors.description = "Description is required";
    }
    
    if (formData.mileage <= 0) {
      newErrors.mileage = "Mileage must be greater than 0";
    }
    
    // Validate that mileage is not less than last recorded mileage
    if (lastRecordedMileage !== null && formData.mileage < lastRecordedMileage) {
      newErrors.mileage = `Mileage cannot be less than the last recorded mileage (${lastRecordedMileage} km)`;
    }
    
    if (formData.cost < 0) {
      newErrors.cost = "Cost cannot be negative";
    }
    
    if (!formData.status) {
      newErrors.status = "Status is required";
    }
    
    // Update errors state
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare data for API - transform fields to match API expectations
      const apiData = {
        car_id: formData.vehicle,
        title: formData.service_type,
        scheduled_date: formData.service_date.toISOString().split('T')[0],
        description: formData.description,
        cost: formData.cost,
        mileage: formData.mileage,
        status: formData.status,
        technician: formData.technician !== undefined ? String(formData.technician) : '',
        notes: formData.notes || '',
        parts_used: formData.parts_used || ''
      };
      
      console.log('Submitting service data to API:', apiData);
      console.log('Technician value (explicit):', typeof apiData.technician, apiData.technician);
      
      if (isEditing && service?.id) {
        // Update existing service
        await serviceService.update(service.id, apiData);
        toast.success("Service record updated successfully");
      } else {
        // Create new service
        await serviceService.create(apiData);
        toast.success("Service record added successfully");
      }
      
      // Close dialog and refresh data
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Error saving service:", err);
      
      // Handle validation errors from the server
      if (err.response?.data) {
        const serverErrors = err.response.data;
        const formattedErrors: Record<string, string> = {};
        
        // Format server errors for display and map API field names back to form field names
        Object.entries(serverErrors).forEach(([key, value]) => {
          // Map API field names back to form field names
          const fieldMapping: Record<string, string> = {
            'car_id': 'vehicle',
            'title': 'service_type',
            'scheduled_date': 'service_date'
          };
          
          const formField = fieldMapping[key] || key;
          formattedErrors[formField] = Array.isArray(value) ? value[0] : String(value);
        });
        
        setErrors(formattedErrors);
      } else {
        toast.error(isEditing ? "Failed to update service record" : "Failed to add service record");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service Record" : "Add Service Record"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the service details for this vehicle." 
              : "Add a new service record for this vehicle."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Vehicle Selection (only shown when adding from Services page) */}
          {isVehicleSelectionMode && (
            <div className="space-y-2">
              <Label htmlFor="vehicle" className={errors.vehicle ? "text-destructive" : ""}>
                Vehicle <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.vehicle ? String(formData.vehicle) : ""}
                onValueChange={handleVehicleChange}
                disabled={loadingVehicles}
              >
                <SelectTrigger className={errors.vehicle ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                      {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle && <p className="text-sm text-destructive">{errors.vehicle}</p>}
            </div>
          )}
          
          {/* Display selected vehicle info */}
          {selectedVehicle && (
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </span>
                {selectedVehicle.license_plate && (
                  <span className="text-muted-foreground">({selectedVehicle.license_plate})</span>
                )}
              </div>
              {lastRecordedMileage !== null && (
                <div className="text-sm mt-1 text-muted-foreground">
                  Last recorded mileage: {lastRecordedMileage.toLocaleString()} km
                </div>
              )}
            </div>
          )}
          
          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="service_type" className={errors.service_type ? "text-destructive" : ""}>
              Service Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => handleSelectChange(value, "service_type")}
            >
              <SelectTrigger className={errors.service_type ? "border-destructive" : ""}>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_type && <p className="text-sm text-destructive">{errors.service_type}</p>}
          </div>
          
          {/* Service Date */}
          <div className="space-y-2">
            <Label htmlFor="service_date" className={errors.service_date ? "text-destructive" : ""}>
              Service Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.service_date && "text-muted-foreground",
                    errors.service_date && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.service_date ? format(formData.service_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.service_date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.service_date && <p className="text-sm text-destructive">{errors.service_date}</p>}
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className={errors.description ? "text-destructive" : ""}>
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the service performed"
              className={errors.description ? "border-destructive" : ""}
              rows={3}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>
          
          {/* Mileage and Cost - 2 column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mileage" className={errors.mileage ? "text-destructive" : ""}>
                Mileage (km) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => handleNumberChange(e, "mileage")}
                placeholder="Vehicle mileage"
                className={errors.mileage ? "border-destructive" : ""}
                min={lastRecordedMileage || 0}
              />
              {errors.mileage && <p className="text-sm text-destructive">{errors.mileage}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost" className={errors.cost ? "text-destructive" : ""}>
                Cost ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => handleNumberChange(e, "cost")}
                placeholder="Service cost"
                className={errors.cost ? "border-destructive" : ""}
                step="0.01"
                min="0"
              />
              {errors.cost && <p className="text-sm text-destructive">{errors.cost}</p>}
            </div>
          </div>
          
          {/* Status and Technician - 2 column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className={errors.status ? "text-destructive" : ""}>
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange(value, "status")}
              >
                <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="technician" className={errors.technician ? "text-destructive" : ""}>
                Technician
              </Label>
              {console.log('Technician field in form:', formData.technician, typeof formData.technician)}
              <Input
                id="technician"
                name="technician"
                value={formData.technician || ""}
                onChange={(e) => {
                  console.log('Technician input changed:', e.target.value);
                  handleChange(e);
                }}
                onBlur={(e) => console.log('Technician input blurred:', e.target.value, formData.technician)}
                placeholder="Technician name"
                className={errors.technician ? "border-destructive" : ""}
              />
              {errors.technician && <p className="text-sm text-destructive">{errors.technician}</p>}
            </div>
          </div>
          
          {/* Parts Used */}
          <div className="space-y-2">
            <Label htmlFor="parts_used" className={errors.parts_used ? "text-destructive" : ""}>
              Parts Used
            </Label>
            <Textarea
              id="parts_used"
              name="parts_used"
              value={formData.parts_used || ""}
              onChange={handleChange}
              placeholder="List parts used in this service"
              className={errors.parts_used ? "border-destructive" : ""}
              rows={2}
            />
            {errors.parts_used && <p className="text-sm text-destructive">{errors.parts_used}</p>}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className={errors.notes ? "text-destructive" : ""}>
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              placeholder="Additional notes about the service"
              className={errors.notes ? "border-destructive" : ""}
              rows={2}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 