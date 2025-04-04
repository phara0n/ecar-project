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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading(
      isEditing ? "Updating customer..." : "Creating customer..."
    );

    try {
      if (isEditing && customer?.id) {
        await customerService.update(customer.id, formData);
        toast.success("Customer updated successfully", { id: toastId });
      } else {
        await customerService.create(formData);
        toast.success("Customer created successfully", { id: toastId });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.response?.data) {
        // Format Django REST framework error messages
        const errors = error.response.data;
        errorMessage = Object.entries(errors)
          .map(([field, messages]: [string, any]) => `${field}: ${messages}`)
          .join(", ");
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
              />
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
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