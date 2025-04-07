import { ColumnDef } from "@tanstack/react-table"
import { Vehicle } from "@/store/apiSlice" // Import the Vehicle type
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

// Define action handlers (replace with actual logic later)
const handleEdit = (vehicleId: number) => {
  console.log("Edit vehicle:", vehicleId);
  // TODO: Implement edit logic (e.g., open dialog)
  alert(`Edit vehicle ID: ${vehicleId}`);
};

const handleDelete = (vehicleId: number) => {
  console.log("Delete vehicle:", vehicleId);
  // TODO: Implement delete logic (e.g., show confirmation, call API)
  alert(`Delete vehicle ID: ${vehicleId}`);
};

export const vehicleColumns: ColumnDef<Vehicle>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "make",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Make
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "year",
    header: "Year",
  },
  {
    accessorKey: "license_plate",
    header: "License Plate",
  },
  {
    accessorKey: "vin",
    header: "VIN",
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      if (!customer || !customer.user) {
        return "N/A";
      }
      return `${customer.user.first_name || ''} ${customer.user.last_name || ''}`.trim();
    },
  },
  {
    accessorKey: "mileage",
    header: "Mileage",
    cell: ({ row }) => {
        const mileage = parseFloat(row.getValue("mileage"))
        return mileage ? mileage.toLocaleString() : "N/A"
      },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const vehicle = row.original

      return (
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
              onClick={() => navigator.clipboard.writeText(vehicle.vin)}
            >
              Copy VIN
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEdit(vehicle.id)}>Edit Vehicle</DropdownMenuItem>
            <DropdownMenuItem
             onClick={() => alert(`View services for ${vehicle.id}`)}
             // TODO: Navigate to vehicle services page
            >
                View Services
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
             className="text-destructive focus:text-destructive focus:bg-destructive/10"
             onClick={() => handleDelete(vehicle.id)}
            >Delete Vehicle</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 