import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serviceService } from "@/lib/api";
import { toast } from "sonner";
import { CalendarIcon, LoaderCircle } from "lucide-react";
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
  vehicleId: number;
  service?: Partial<ServiceFormData>;
  onSuccess: () => void;
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
  
  // Form state
  const [formData, setFormData] = useState<ServiceFormData>({
    vehicle: vehicleId,
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
  
  // Initialize form with service data if editing
  useEffect(() => {
    if (service && open) {
      setFormData({
        ...formData,
        ...service,
        // Ensure vehicle ID is set correctly
        vehicle: vehicleId,
        // Convert string date to Date object
        service_date: service.service_date ? new Date(service.service_date) : new Date(),
        // Ensure numeric fields are numbers
        cost: typeof service.cost === 'number' ? service.cost : 0,
        mileage: typeof service.mileage === 'number' ? service.mileage : 0
      });
    } else if (open) {
      // Reset form when opening for a new service
      setFormData({
        vehicle: vehicleId,
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
    }
    
    // Clear errors when dialog opens/closes
    setErrors({});
  }, [service, open, vehicleId]);
  
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
    
    // Update form data
    setFormData({
      ...formData,
      [name]: value
    });
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
        technician: formData.technician || '',
        notes: formData.notes || '',
        parts_used: formData.parts_used || ''
      };
      
      console.log('Submitting service data to API:', apiData);
      
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
                min="0"
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
              <Input
                id="technician"
                name="technician"
                value={formData.technician || ""}
                onChange={handleChange}
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