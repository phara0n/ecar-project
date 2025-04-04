import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerService } from "@/lib/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, User, Key } from "lucide-react";

export interface CustomerFormData {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  username?: string;
  password?: string;
}

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerFormData;
  onSuccess: () => void;
}

export function CustomerDialog({ open, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
  const isEditing = !!customer?.id;
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    username: "",
    password: "", 
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    // Reset errors when dialog opens/closes
    setFormErrors({});
    setActiveTab("basic");
    
    if (customer) {
      setFormData({
        id: customer.id,
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        username: customer.username || "",
        // We don't show existing password - it would be hashed in the backend
        password: "",
      });
    } else {
      // Reset form when adding a new customer
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        username: "",
        password: "",
      });
    }
  }, [customer, open]);

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
    
    // Basic info validation
    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
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
    
    // Credentials validation for new users
    if (!isEditing) {
      if (!formData.username?.trim()) {
        errors.username = "Username is required for mobile app access";
      } else if (formData.username.length < 4) {
        errors.username = "Username must be at least 4 characters";
      }
      
      if (!formData.password?.trim()) {
        errors.password = "Password is required for mobile app access";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }
    } else if (formData.password && formData.password.length > 0 && formData.password.length < 8) {
      // Password is optional when editing, but if provided should be valid
      errors.password = "Password must be at least 8 characters";
    }
    
    setFormErrors(errors);
    
    // If there are errors, switch to the tab containing the first error
    if (Object.keys(errors).length > 0) {
      if (errors.first_name || errors.last_name || errors.email || errors.phone || errors.address) {
        setActiveTab("basic");
      } else if (errors.username || errors.password) {
        setActiveTab("credentials");
      }
    }
    
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

    const dataToSend = {
      phone: formData.phone,
      address: formData.address || '',
      user: {
        email: formData.email,
        username: formData.username || '',
        first_name: formData.first_name,
        last_name: formData.last_name
      }
    };

    // Only include password when it's provided (for new customers or password changes)
    if (formData.password && formData.password.trim().length > 0) {
      dataToSend.user.password = formData.password;
    }

    try {
      console.log(`${isEditing ? 'Updating' : 'Creating'} customer with data:`, dataToSend);
      
      if (isEditing && customer?.id) {
        const response = await customerService.update(customer.id, dataToSend);
        console.log('Update response:', response.data);
        toast.success("Customer updated successfully", { id: toastId });
      } else {
        const response = await customerService.create(dataToSend);
        console.log('Create response:', response.data);
        toast.success("Customer created successfully", { id: toastId });
      }
      onSuccess();
      onOpenChange(false);
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
            // Handle nested user field errors
            if (field === 'user') {
              if (typeof messages === 'object') {
                Object.entries(messages).forEach(([userField, userMessages]: [string, any]) => {
                  const msg = Array.isArray(userMessages) ? userMessages[0] : userMessages.toString();
                  
                  // Map user fields to form fields
                  if (userField === 'email') formattedErrors['email'] = msg;
                  else if (userField === 'username') formattedErrors['username'] = msg;
                  else if (userField === 'password') formattedErrors['password'] = msg;
                  else if (userField === 'first_name') formattedErrors['first_name'] = msg;
                  else if (userField === 'last_name') formattedErrors['last_name'] = msg;
                });
              } else {
                formattedErrors['user'] = Array.isArray(messages) ? messages[0] : messages.toString();
              }
            } else {
              formattedErrors[field] = Array.isArray(messages) ? messages[0] : messages.toString();
            }
            
            // Ensure we switch to the appropriate tab for the error
            if (field === 'first_name' || field === 'last_name' || field === 'email' || field === 'phone' || field === 'address' || 
                field === 'user') {
              setActiveTab("basic");
            } else if (field === 'username' || field === 'password') {
              setActiveTab("credentials");
            }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update customer information in the system."
                : "Add a new customer to the system."}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>Basic Info</span>
              </TabsTrigger>
              <TabsTrigger value="credentials" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>App Credentials</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="p-0 pt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className={formErrors.first_name ? "border-destructive" : ""}
                    />
                    {formErrors.first_name && (
                      <p className="text-destructive text-sm">{formErrors.first_name}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={formErrors.last_name ? "border-destructive" : ""}
                    />
                    {formErrors.last_name && (
                      <p className="text-destructive text-sm">{formErrors.last_name}</p>
                    )}
                  </div>
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
            </TabsContent>
            
            {/* App Credentials Tab */}
            <TabsContent value="credentials" className="p-0 pt-4">
              <div className="grid gap-4">
                <div className="text-sm text-muted-foreground mb-2">
                  <p>These credentials will allow the customer to access the mobile app.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username || ""}
                    onChange={handleChange}
                    required={!isEditing}
                    className={formErrors.username ? "border-destructive" : ""}
                  />
                  {formErrors.username && (
                    <p className="text-destructive text-sm">{formErrors.username}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    {isEditing ? "New Password (leave blank to keep current)" : "Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password || ""}
                      onChange={handleChange}
                      required={!isEditing}
                      className={formErrors.password ? "border-destructive" : ""}
                    />
                    <div className="absolute right-2 top-2.5 text-muted-foreground">
                      <Key className="h-4 w-4" />
                    </div>
                  </div>
                  {formErrors.password && (
                    <p className="text-destructive text-sm">{formErrors.password}</p>
                  )}
                  {isEditing && (
                    <p className="text-sm text-muted-foreground">
                      Leave password blank to keep the current password.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
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