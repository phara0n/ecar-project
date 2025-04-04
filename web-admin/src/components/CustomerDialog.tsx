import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerService } from "@/lib/api";
import { toast } from "sonner";

export interface CustomerFormData {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface CustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerFormData;
  onSuccess: () => void;
}

export function CustomerDialog({ isOpen, onClose, customer, onSuccess }: CustomerDialogProps) {
  const isEditing = !!customer?.id;
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset errors when dialog opens/closes
    setFormErrors({});
    
    if (customer) {
      setFormData({
        id: customer.id,
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    } else {
      // Reset form when adding a new customer
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
      });
    }
  }, [customer, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
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

    const toastId = toast.loading(
      isEditing ? "Updating customer..." : "Creating customer..."
    );

    try {
      console.log(`${isEditing ? 'Updating' : 'Creating'} customer with data:`, formData);
      
      if (isEditing && customer?.id) {
        const response = await customerService.update(customer.id, formData);
        console.log('Update response:', response.data);
        toast.success("Customer updated successfully", { id: toastId });
      } else {
        const response = await customerService.create(formData);
        console.log('Create response:', response.data);
        toast.success("Customer created successfully", { id: toastId });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
        console.error('Response error headers:', error.response.headers);
        
        // Handle validation errors from Django REST Framework
        if (error.response.status === 400 && typeof error.response.data === 'object') {
          const apiErrors = error.response.data;
          const formattedErrors: Record<string, string> = {};
          
          Object.entries(apiErrors).forEach(([field, messages]: [string, any]) => {
            formattedErrors[field] = Array.isArray(messages) ? messages[0] : messages.toString();
          });
          
          setFormErrors(formattedErrors);
        }
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.response?.data) {
        // Format Django REST framework error messages
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join(', ');
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update customer information in the system."
                : "Add a new customer to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-destructive text-sm">{formErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && (
                <p className="text-destructive text-sm">{formErrors.email}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={formErrors.phone ? "border-destructive" : ""}
              />
              {formErrors.phone && (
                <p className="text-destructive text-sm">{formErrors.phone}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                className={formErrors.address ? "border-destructive" : ""}
              />
              {formErrors.address && (
                <p className="text-destructive text-sm">{formErrors.address}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 