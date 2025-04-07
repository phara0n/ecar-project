import { ColumnDef } from "@tanstack/react-table"
import { Customer } from "@/store/apiSlice" // Import the Customer type
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
import { CustomerActionsCell } from "./CustomerActionsCell"; // Import the new cell component

// Define action handlers are now MOVED to CustomerActionsCell
// const handleEditCustomer = ...
// const handleDeleteCustomer = ...

export const customerColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "user.first_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "user.last_name",
     header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "user.email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
   {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "vehicle_count",
    header: "Vehicles",
    cell: ({ row }) => {
      const count = row.original.vehicle_count;
      return count !== undefined && count !== null ? count : 0; 
    },
  },
  {
    id: "actions",
    // Use the custom component for rendering the cell
    cell: ({ row }) => <CustomerActionsCell row={row} />,
  },
]
