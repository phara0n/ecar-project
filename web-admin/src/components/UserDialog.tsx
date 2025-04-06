import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/lib/api";
import { toast } from "sonner";

interface UserFormData {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string; // Password might be optional if set automatically or required only on create
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback after successful user creation
}

export function UserDialog({ open, onOpenChange, onSuccess }: UserDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "", // Initialize password field
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setFormData({ username: "", first_name: "", last_name: "", email: "", password: "" });
      setFormErrors({});
      setLoading(false);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.username.trim()) errors.username = "Username is required";
    if (!formData.first_name.trim()) errors.first_name = "First name is required";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    // Basic password validation (e.g., minimum length) - adjust as needed
    if (!formData.password || formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const toastId = toast.loading("Creating user...");

    try {
      // Ensure password is included in the data sent to the API
      const userData = { ...formData }; 
      await userService.create(userData); 
      toast.success("User created successfully", { id: toastId });
      onSuccess(); // Call the success callback (e.g., to refresh lists)
      onOpenChange(false); // Close the dialog
    } catch (error: any) {
      console.error("Error creating user:", error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to create user: ${errorMsg}`, { id: toastId });
      // Optionally handle specific API validation errors
      if (error.response?.status === 400 && typeof error.response.data === 'object') {
        const apiErrors = error.response.data;
        const formattedErrors: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([field, messages]) => {
          formattedErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setFormErrors(formattedErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. They can then be assigned as a customer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input 
              id="username" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              className="col-span-3" 
              disabled={loading}
            />
            {formErrors.username && <p className="col-span-4 text-sm text-red-500 text-right">{formErrors.username}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="first_name" className="text-right">First Name</Label>
            <Input 
              id="first_name" 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
              className="col-span-3" 
              disabled={loading}
            />
             {formErrors.first_name && <p className="col-span-4 text-sm text-red-500 text-right">{formErrors.first_name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="last_name" className="text-right">Last Name</Label>
            <Input 
              id="last_name" 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
              className="col-span-3" 
              disabled={loading}
            />
            {formErrors.last_name && <p className="col-span-4 text-sm text-red-500 text-right">{formErrors.last_name}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="col-span-3" 
              disabled={loading}
            />
            {formErrors.email && <p className="col-span-4 text-sm text-red-500 text-right">{formErrors.email}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password || ''} 
              onChange={handleChange} 
              className="col-span-3" 
              disabled={loading}
            />
            {formErrors.password && <p className="col-span-4 text-sm text-red-500 text-right">{formErrors.password}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 