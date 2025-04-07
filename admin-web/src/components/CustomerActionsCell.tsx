import * as React from "react";
import { Row } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { Customer, useDeleteCustomerMutation } from "@/store/apiSlice";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { EditCustomerDialog } from './EditCustomerDialog';

interface CustomerActionsCellProps {
  row: Row<Customer>;
}

export function CustomerActionsCell({ row }: CustomerActionsCellProps) {
  const customer = row.original;
  const navigate = useNavigate();
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete customer ${customer.user.first_name} ${customer.user.last_name} (ID: ${customer.id})? This action cannot be undone.`)) {
      try {
        await deleteCustomer(customer.id).unwrap();
        toast.success(`Customer ${customer.id} deleted successfully.`);
      } catch (err) {
        console.error("Failed to delete customer:", err);
        let errorMessage = "Failed to delete customer.";
         if (err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object') {
             const errorData = err.data as Record<string, unknown>;
             if ('detail' in errorData && typeof errorData.detail === 'string') {
                 errorMessage = `Deletion failed: ${errorData.detail}`;
             } else {
                errorMessage = `Deletion failed: ${JSON.stringify(err.data)}`;
             }
         } else if (err && typeof err === 'object' && 'status' in err) {
             errorMessage = `Deletion failed (Status: ${err.status})`;
         }
        toast.error(errorMessage, { duration: 5000 });
      }
    }
  };

  const handleEdit = () => {
     console.log("Opening edit dialog for customer:", customer.id);
     setIsEditDialogOpen(true);
  }

  const handleViewVehicles = () => {
    console.log(`Navigating to view vehicles for customer ID: ${customer.id}`);
    navigate(`/vehicles?customerId=${customer.id}`);
  };

  return (
    <>
      {isEditDialogOpen && (
        <EditCustomerDialog 
            customer={customer}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(customer.user.email || '')}
            disabled={!customer.user.email}
          >
            Copy Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEdit}>Edit Customer</DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewVehicles}>View Vehicles</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Customer"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
} 