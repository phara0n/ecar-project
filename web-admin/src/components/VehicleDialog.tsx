import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerService, vehicleService } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceHistorySection } from "./ServiceHistorySection";

export interface VehicleFormData {
  id?: number;
  customer: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color?: string;
  mileage?: number;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
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

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: VehicleFormData;
  onSuccess: () => void;
  customerId?: number; // Optional customer ID when adding a vehicle directly from customer page
}

export function VehicleDialog({ 
  open, 
  onOpenChange, 
  vehicle, 
  onSuccess,
  customerId 
}: VehicleDialogProps) {
  const isEditing = !!vehicle?.id;
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Initialize form data
  const defaultFormData: VehicleFormData = {
    customer: customerId || 0,
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    vin: "",
    color: "",
    mileage: 0,
    last_service_date: null,
    last_service_mileage: null
  };
  
  const [formData, setFormData] = useState<VehicleFormData>(defaultFormData);
  
  // Reset form data when dialog opens/closes or vehicle changes
  useEffect(() => {
    if (open) {
      // If editing, use the provided vehicle data
      if (vehicle) {
        setFormData(vehicle);
      } 
      // If adding a vehicle for a specific customer, set the customer ID
      else if (customerId) {
        setFormData({ ...defaultFormData, customer: customerId });
      }
      // Otherwise reset to default
      else {
        setFormData(defaultFormData);
      }
      
      // Reset form errors
      setFormErrors({});
      
      // Load customers for dropdown
      fetchCustomers();
    }
  }, [open, vehicle, customerId]);
  
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
      toast.error("Failed to load customers");
      setCustomers([]);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === "year" || name === "mileage") {
      const numericValue = parseInt(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  
  const handleCustomerChange = (value: string) => {
    const customerId = parseInt(value);
    setFormData(prev => ({
      ...prev,
      customer: isNaN(customerId) ? 0 : customerId
    }));
    
    // Clear error for customer field if it exists
    if (formErrors.customer) {
      setFormErrors(prev => ({
        ...prev,
        customer: ""
      }));
    }
  };
  
  const handleLastServiceDateChange = (date: string | null) => {
    setFormData(prev => ({
      ...prev,
      last_service_date: date
    }));
  };
  
  const handleLastServiceMileageChange = (mileage: number | null) => {
    setFormData(prev => ({
      ...prev,
      last_service_mileage: mileage
    }));
  };
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!formData.make) errors.make = "Make is required";
    if (!formData.model) errors.model = "Model is required";
    if (!formData.license_plate) errors.license_plate = "License plate is required";
    if (!formData.vin) errors.vin = "VIN is required";
    if (!formData.customer) errors.customer = "Customer is required";
    
    // Year validation
    const currentYear = new Date().getFullYear();
    if (!formData.year) {
      errors.year = "Year is required";
    } else if (formData.year < 1900 || formData.year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }
    
    // VIN validation (basic format check)
    if (formData.vin && formData.vin.length !== 17) {
      errors.vin = "VIN must be 17 characters long";
    }
    
    // Mileage validation
    if (formData.mileage && formData.mileage < 0) {
      errors.mileage = "Mileage cannot be negative";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    const toastId = toast.loading(isEditing ? "Updating vehicle..." : "Adding vehicle...");
    
    try {
      if (isEditing && vehicle?.id) {
        await vehicleService.update(vehicle.id, formData);
        toast.success("Vehicle updated successfully", { id: toastId });
      } else {
        await vehicleService.create(formData);
        toast.success("Vehicle added successfully", { id: toastId });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving vehicle:", err);
      
      let errorMessage = "Failed to save vehicle";
      
      // Handle API error responses
      if (err.response?.data) {
        // Format error messages from API
        const apiErrors = err.response.data;
        
        if (typeof apiErrors === 'object') {
          // Extract field-specific errors
          Object.entries(apiErrors).forEach(([key, value]) => {
            if (key === 'customer_id') {
              // Map customer_id error to the customer field in our form
              setFormErrors(prev => ({
                ...prev,
                customer: Array.isArray(value) ? value[0] : value
              }));
            } else if (key !== 'detail') { // Skip the generic 'detail' error
              setFormErrors(prev => ({
                ...prev,
                [key]: Array.isArray(value) ? value[0] : value
              }));
            }
          });
          
          errorMessage = "Please correct the errors in the form";
        } else if (typeof apiErrors === 'string') {
          errorMessage = apiErrors;
        }
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the vehicle information below." 
              : "Fill out the form below to add a new vehicle."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            {/* Customer dropdown */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={formData.customer ? formData.customer.toString() : ""}
                onValueChange={handleCustomerChange}
                disabled={customerId !== undefined || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem 
                      key={customer.id} 
                      value={customer.id.toString()}
                    >
                      {customer.user.first_name} {customer.user.last_name} - {customer.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.customer && <p className="text-red-500 text-sm">{formErrors.customer}</p>}
            </div>
            
            {/* Year input */}
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleInputChange}
                disabled={loading}
              />
              {formErrors.year && <p className="text-red-500 text-sm">{formErrors.year}</p>}
            </div>
            
            {/* Make input */}
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                disabled={loading}
              />
              {formErrors.make && <p className="text-red-500 text-sm">{formErrors.make}</p>}
            </div>
            
            {/* Model input */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                disabled={loading}
              />
              {formErrors.model && <p className="text-red-500 text-sm">{formErrors.model}</p>}
            </div>
            
            {/* License plate input */}
            <div className="space-y-2">
              <Label htmlFor="license_plate">License Plate</Label>
              <Input
                id="license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleInputChange}
                disabled={loading}
              />
              {formErrors.license_plate && <p className="text-red-500 text-sm">{formErrors.license_plate}</p>}
            </div>
            
            {/* Color input */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                name="color"
                value={formData.color || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            
            {/* VIN input */}
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                disabled={loading}
              />
              {formErrors.vin && <p className="text-red-500 text-sm">{formErrors.vin}</p>}
            </div>
            
            {/* Current mileage input */}
            <div className="space-y-2">
              <Label htmlFor="mileage">Current Mileage</Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formData.mileage || 0}
                onChange={handleInputChange}
                disabled={loading}
              />
              {formErrors.mileage && <p className="text-red-500 text-sm">{formErrors.mileage}</p>}
            </div>
          </div>
          
          {/* Service History Section */}
          <div className="border rounded-md mt-6">
            <ServiceHistorySection 
              lastServiceDate={formData.last_service_date}
              lastServiceMileage={formData.last_service_mileage}
              onLastServiceDateChange={handleLastServiceDateChange}
              onLastServiceMileageChange={handleLastServiceMileageChange}
              currentMileage={formData.mileage}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {isEditing ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 