import React from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { GenericDataTable } from '@/components/data-table';
import { vehicleColumns } from '@/components/vehicle-columns';
import {
    useGetCarsQuery,
    useGetCustomerVehiclesQuery, // Import the new hook
    Vehicle,
    PaginatedVehicleResponse
} from '@/store/apiSlice';
import { AddVehicleDialog } from '@/components/add-vehicle-dialog';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Standard data extractor function for paginated vehicles
const vehicleDataExtractor = (data: PaginatedVehicleResponse | undefined): Vehicle[] => {
  return data?.results ?? [];
};

const VehiclesPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const customerIdFilter = queryParams.get('customerId');
  const customerIdNum = customerIdFilter ? parseInt(customerIdFilter, 10) : null;

  // --- Conditionally select the query hook --- 
  let useSelectedQueryHook;
  let queryArg: number | undefined;

  if (customerIdNum !== null && !isNaN(customerIdNum)) {
    // Use the customer-specific query if ID is valid
    useSelectedQueryHook = useGetCustomerVehiclesQuery;
    queryArg = customerIdNum;
    console.log(`Using getCustomerVehicles query for customer ID: ${customerIdNum}`);
  } else {
    // Use the general query for all cars otherwise
    useSelectedQueryHook = useGetCarsQuery;
    queryArg = undefined; // No argument for getCars
    console.log("Using getCars query for all vehicles");
  }
  // --- End conditional hook selection --- 

  // Determine title based on filter
  const pageTitle = customerIdNum 
    ? `Vehicles for Customer #${customerIdNum}` 
    : "Vehicles";
  const pageDescription = customerIdNum 
    ? "Showing vehicles associated with the selected customer." 
    : "Manage registered vehicles.";

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
         <div>
             {/* Use dynamic title */}
             <h1 className="text-3xl font-bold">{pageTitle}</h1> 
             {/* Use dynamic description */}
             <p className="text-muted-foreground">{pageDescription}</p> 
         </div>
         <AddVehicleDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
         </AddVehicleDialog>
      </div>

      {/* Pass the *selected* hook and the standard extractor to the table */}
      {/* GenericDataTable will handle calling the hook and managing state */}
      <GenericDataTable
        columns={vehicleColumns}
        // Pass the hook function itself, selected conditionally
        useGetDataQuery={() => useSelectedQueryHook(queryArg as any)} // Pass arg, use 'as any' if TS complains about void vs number arg type mismatch
        dataExtractor={vehicleDataExtractor} // Use the standard extractor
        globalFilterPlaceholder="Filter displayed vehicles..." 
      />
      
    </div>
  );
};

export default VehiclesPage; 