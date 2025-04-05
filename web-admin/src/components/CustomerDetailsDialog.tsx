import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customerService } from "@/lib/api";
import { toast } from "sonner";
import { Edit, Eye, EyeOff, Plus, Copy } from "lucide-react";
import { CustomerVehiclesSection } from "./CustomerVehiclesSection";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Customer {
  id: number;
  user: User;
  phone: string;
  address?: string;
  vehicles?: number;
  last_visit?: string;
  status?: string;
}

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: number;
  onEditClick: (customer: Customer) => void;
  onAddVehicle: () => void;
}

export function CustomerDetailsDialog({
  open,
  onOpenChange,
  customerId,
  onEditClick,
  onAddVehicle
}: CustomerDetailsDialogProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUsername, setShowUsername] = useState(false);

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails(customerId);
    } else {
      setCustomer(null);
    }
  }, [open, customerId]);

  const fetchCustomerDetails = async (id: number) => {
    setLoading(true);
    try {
      const response = await customerService.getById(id);
      setCustomer(response.data);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (customer) {
      onEditClick(customer);
    }
  };

  const handleCopyUsername = () => {
    if (customer?.user?.username) {
      navigator.clipboard.writeText(customer.user.username);
      toast.success("Username copied to clipboard");
    }
  };

  const handleRefreshVehicles = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {loading ? (
              "Loading customer details..."
            ) : customer ? (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>Modification de Customer</span>
                </div>
                <Button
                  variant="outline"
                  className="bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => {}}
                >
                  HISTORIQUE
                </Button>
              </div>
            ) : (
              "Customer not found"
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : customer ? (
          <div className="space-y-6">
            <div className="text-xl font-semibold">{customer.user.first_name} {customer.user.last_name}</div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm">User:</label>
                <div className="relative">
                  <div className="flex">
                    <Input
                      readOnly
                      value={showUsername ? customer.user.username : "••••••••"}
                      className="flex-grow pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 top-0"
                      onClick={() => setShowUsername(!showUsername)}
                    >
                      {showUsername ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={handleCopyUsername}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm">Phone Number:</label>
                <Input readOnly value={customer.phone} />
              </div>
              
              <div className="col-span-3 space-y-2">
                <label className="text-sm">Address:</label>
                <Input readOnly value={customer.address || ''} />
              </div>
            </div>
            
            <div className="space-y-2 mt-6">
              <CustomerVehiclesSection 
                customerId={customer.id} 
                refreshTrigger={refreshTrigger}
                onAddVehicle={onAddVehicle}
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleEditClick}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Customer
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Customer not found or has been deleted.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 