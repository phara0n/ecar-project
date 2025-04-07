import { GenericDataTable } from "@/components/data-table";
import { customerColumns } from "@/components/customer-columns";
import { useGetCustomersQuery, Customer, PaginatedCustomerResponse } from "@/store/apiSlice";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Data extractor function for customers
const customerDataExtractor = (data: PaginatedCustomerResponse | undefined): Customer[] => {
  return data?.results ?? []; // Extract the results array, return empty if data is undefined
};

export function CustomersPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <AddCustomerDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </AddCustomerDialog>
      </div>

      <GenericDataTable
        columns={customerColumns}
        useGetDataQuery={useGetCustomersQuery}
        dataExtractor={customerDataExtractor}
        globalFilterPlaceholder="Filter customers..."
      />
    </div>
  );
} 