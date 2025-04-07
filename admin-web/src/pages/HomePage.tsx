import React from 'react';
import { SectionCards } from '@/components/section-cards';
import { GenericDataTable } from '@/components/data-table';
import { vehicleColumns } from '@/components/vehicle-columns';
import { useGetCarsQuery, Vehicle, PaginatedVehicleResponse } from '@/store/apiSlice';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';

// Data extractor function for vehicles (similar to CustomersPage)
const vehicleDataExtractor = (data: PaginatedVehicleResponse | undefined): Vehicle[] => {
  // Optional: You might want to limit the number of vehicles shown on the homepage, e.g., data?.results.slice(0, 5) ?? []
  return data?.results ?? []; 
};

const HomePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Section 1: Cards */}
      <SectionCards />

      {/* Section 2: Charts/Tables */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Chart Section */}
        <div className="bg-card p-4 rounded-lg shadow">
          <ChartAreaInteractive />
        </div>
        
        {/* Data Table Section - Updated to use GenericDataTable */}
        <div className="bg-card p-4 rounded-lg shadow xl:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Recent Vehicles</h2>
          <GenericDataTable
            columns={vehicleColumns}
            useGetDataQuery={useGetCarsQuery}
            dataExtractor={vehicleDataExtractor}
            globalFilterPlaceholder="Filter vehicles..."
          />
        </div>
      </div>

      {/* Add more dashboard sections as needed */}
    </div>
  );
};

export default HomePage;