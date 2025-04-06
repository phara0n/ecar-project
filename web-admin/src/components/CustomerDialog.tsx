import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerService, userService } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as LucideUserIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from 'react-i18next';
import { Loader2 } from "lucide-react";

export interface CustomerFormData {
  user_id: number | null;
  phone: string;
  address?: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FullCustomer {
  id: number;
  user: User;
  phone: string;
  address?: string;
}

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number;
  onSuccess: () => void;
}

export function CustomerDialog({ open, onOpenChange, customerId, onSuccess }: CustomerDialogProps) {
  const { t } = useTranslation();
  const isEditing = typeof customerId === 'number';
  const [formData, setFormData] = useState<CustomerFormData>({
    user_id: null,
    phone: "",
    address: "",
  });
  const [displayUserData, setDisplayUserData] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  useEffect(() => {
    setFormErrors({});
    setFormData({ user_id: null, phone: "", address: "" });
    setDisplayUserData(null);
    setAvailableUsers([]);
    
    if (open) {
      setIsFetchingData(true);
      if (isEditing && customerId) {
        customerService.getById(customerId)
          .then(response => {
            const customerData: FullCustomer = response.data;
            setFormData({ 
              user_id: customerData.user.id,
              phone: customerData.phone || "",
              address: customerData.address || ""
            });
            setDisplayUserData(customerData.user);
          })
          .catch(err => {
            console.error("Error fetching customer data:", err);
            toast.error(t('customerDialog.errors.loadFailed', 'Failed to load customer details.'));
            onOpenChange(false);
          })
          .finally(() => setIsFetchingData(false));
      } else {
        userService.getUnassociated()
          .then(response => {
            const users = Array.isArray(response.data) 
                ? response.data 
                : (response.data && Array.isArray(response.data.results)) 
                  ? response.data.results 
                  : [];
            setAvailableUsers(users);
            console.log("Available users fetched and processed:", users);
          })
          .catch(err => {
            console.error("Error fetching available users:", err);
            toast.error(t('customerDialog.errors.usersLoadFailed', 'Failed to load users for selection.'));
            setAvailableUsers([]);
          })
          .finally(() => setIsFetchingData(false));
      }
    }
  }, [open, customerId, isEditing, onOpenChange, t]);

  const handleSelectUserChange = (userIdString: string) => {
    console.log("User selected (string value from Select):", userIdString);
    const userId = userIdString ? parseInt(userIdString, 10) : null;
    console.log("Parsed user ID to set:", userId);
    setFormData((prev) => ({
      ...prev,
      user_id: userId,
    }));
    // Clear potential error when a valid selection is made
    if (userId !== null && formErrors.user_id) {
        setFormErrors(prev => ({ ...prev, user_id: "" }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    console.log("validateForm called. formData state:", JSON.stringify(formData));
    const errors: Record<string, string> = {};
    
    if (!isEditing && formData.user_id === null) { 
        console.log("Validation Error: user_id is null in create mode.");
        errors.user_id = t('customerDialog.validation.userRequired', 'Please select a user');
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }
    
    setFormErrors(errors);
    console.log("Validation result (errors object):", JSON.stringify(errors));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called. formData state:", JSON.stringify(formData));
    if (!validateForm()) {
      console.log("Submit stopped because validateForm returned false.");
      return;
    }
    setLoading(true);

    const toastId = toast.loading(
      isEditing ? "Updating customer..." : "Creating customer..."
    );

    try {
      if (isEditing && customerId) {
        const updateData = {
            phone: formData.phone,
            address: formData.address || null,
        };
        await customerService.update(customerId, updateData);
        toast.success("Customer updated successfully", { id: toastId });
      } else {
        if (formData.user_id === null) {
            throw new Error("User ID is null during creation.");
        }
        const createData = {
            user_id: formData.user_id,
            phone: formData.phone,
            address: formData.address || null,
        };
        console.log("Corrected createData to send:", JSON.stringify(createData, null, 2));
        await customerService.create(createData);
        toast.success("Customer created successfully", { id: toastId });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving customer:", error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} customer: ${errorMsg}`, { id: toastId });
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the customer's phone number and address." : "Select a user and add their contact details."}
          </DialogDescription>
        </DialogHeader>
        
        {isFetchingData ? (
            <div className="py-6 text-center">Loading data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            
            {isEditing && displayUserData ? (
              <div className="space-y-2">
                  <Label>User (Read-only)</Label>
                  <p className="text-sm p-2 border rounded bg-muted">
                      {displayUserData.first_name} {displayUserData.last_name} ({displayUserData.username}) - {displayUserData.email}
                  </p>
              </div>
            ) : (
              <div className="grid gap-2">
                  <Label htmlFor="user_id">Select User</Label>
                  <Select 
                    onValueChange={handleSelectUserChange} 
                    value={formData.user_id?.toString() || ""}
                    disabled={isFetchingData || availableUsers.length === 0}
                  >
                      <SelectTrigger id="user_id" className="w-full">
                          <SelectValue placeholder="Select an existing user..." />
                      </SelectTrigger>
                      <SelectContent>
                          {availableUsers.length > 0 ? (
                              availableUsers.map(user => (
                                  user && user.id ? (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.first_name} {user.last_name} ({user.username}) - {user.email}
                                    </SelectItem>
                                  ) : null
                              ))
                          ) : (
                              <SelectItem value="no-users-placeholder" disabled>
                                  {isFetchingData ? "Loading users..." : "No available users found"}
                              </SelectItem>
                          )}
                      </SelectContent>
                  </Select>
                  {formErrors.user_id && <p className="text-sm text-red-500">{formErrors.user_id}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 123 456 7890"
                required
              />
              {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="123 Main St, Anytown, USA"
              />
              {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isFetchingData}>
                {loading ? "Saving..." : (isEditing ? "Save Changes" : "Create Customer")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 