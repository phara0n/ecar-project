"use client"

import * as React from "react"
import { useTranslation } from "react-i18next";
import type { UseQueryResult } from '@tanstack/react-query'; // Use for type checking if needed, but RTK hook has its own types
import type { UseQueryHookResult } from '@reduxjs/toolkit/query/react'; // More specific type for RTK Query hooks
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

// Define base props
interface BaseDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  globalFilterPlaceholder?: string;
}

// Define props for when data is fetched internally via hook
interface FetchDataTableProps<TData, TValue> extends BaseDataTableProps<TData, TValue> {
  useGetDataQuery: () => UseQueryHookResult<any>; // RTK Query hook signature
  dataExtractor: (data: any) => TData[]; // Function to extract TData[] from hook result
  data?: never; // Ensure data prop is not provided when hook is used
}

// Define props for when data is passed directly
interface DirectDataDataTableProps<TData, TValue> extends BaseDataTableProps<TData, TValue> {
  data: TData[];
  useGetDataQuery?: never; // Ensure hook is not provided when data is used
  dataExtractor?: never;
}

// Combine props using a union type
type GenericDataTableProps<TData, TValue> = FetchDataTableProps<TData, TValue> | DirectDataDataTableProps<TData, TValue>;

export function GenericDataTable<TData, TValue>({
  columns,
  useGetDataQuery, // Optional hook
  dataExtractor, // Optional extractor
  data: directData, // Optional direct data
  globalFilterPlaceholder = "Filter items..."
}: GenericDataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({}) 
  const [rowSelection, setRowSelection] = React.useState({}) 
  const [globalFilter, setGlobalFilter] = React.useState('')

  // --- Conditional Data Fetching --- 
  let queryResult: UseQueryHookResult<any> | undefined;
  let fetchedData: TData[] | undefined;
  let isLoading: boolean = false;
  let error: any;

  if (useGetDataQuery && dataExtractor) {
    // --- Mode 1: Fetch data using the provided hook --- 
    queryResult = useGetDataQuery(); // Call the hook
    fetchedData = React.useMemo(() => dataExtractor(queryResult?.data), [queryResult?.data, dataExtractor]);
    isLoading = queryResult?.isLoading ?? false;
    error = queryResult?.error;
  } else if (directData) {
     // --- Mode 2: Use directly provided data --- 
     fetchedData = directData;
     // isLoading and error are false/null by default when data is passed directly
  } else {
     // --- Error Mode: Invalid props combination --- 
     console.error("GenericDataTable requires either 'useGetDataQuery' + 'dataExtractor' OR 'data' prop.");
     fetchedData = []; // Default to empty array on error
     error = new Error("Invalid props configuration for GenericDataTable.");
  }
  // --- End Conditional Data Fetching --- 

  const data = React.useMemo(() => fetchedData ?? [], [fetchedData]); // Ensure data is always an array

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Render loading state if fetching via hook
  if (isLoading) {
     return <div>Loading...</div>; // Simple loading indicator
  }

  // Render error state if fetching via hook failed OR if props were invalid
  if (error) {
    console.error("Data table error:", error);
    // Consider showing more specific error details from `error` object
    return <div className="text-destructive">Error loading data. Please try again.</div>;
  }
  
  // Render table
  return (
    <div className="w-full">
       {/* Filtering and View Options */}
      <div className="flex items-center py-4 gap-4">
         <Input
           placeholder={globalFilterPlaceholder}
           value={globalFilter ?? ''}
           onChange={(event) => setGlobalFilter(String(event.target.value))}
           className="max-w-sm"
         />
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="outline" className="ml-auto">
               Columns <ChevronDown className="ml-2 h-4 w-4" />
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             {table
               .getAllColumns()
               .filter((column) => column.getCanHide())
               .map((column) => {
                 return (
                   <DropdownMenuCheckboxItem
                     key={column.id}
                     className="capitalize"
                     checked={column.getIsVisible()}
                     onCheckedChange={(value) =>
                       column.toggleVisibility(!!value)
                     }
                   >
                     {column.id}
                   </DropdownMenuCheckboxItem>
                 )
               })}
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
       {/* Table */}
       <div className="rounded-md border">
         <Table>
           <TableHeader>
             {table.getHeaderGroups().map((headerGroup) => (
               <TableRow key={headerGroup.id}>
                 {headerGroup.headers.map((header) => {
                   return (
                     <TableHead key={header.id}>
                       {header.isPlaceholder
                         ? null
                         : flexRender(
                             header.column.columnDef.header,
                             header.getContext()
                           )}
                     </TableHead>
                   )
                 })}
               </TableRow>
             ))}
           </TableHeader>
           <TableBody>
             {table.getRowModel().rows?.length ? (
               table.getRowModel().rows.map((row) => (
                 <TableRow
                   key={row.id}
                   data-state={row.getIsSelected() && "selected"}
                 >
                   {row.getVisibleCells().map((cell) => (
                     <TableCell key={cell.id}>
                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
                     </TableCell>
                   ))}
                 </TableRow>
               ))
             ) : (
               <TableRow>
                 <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('common.noResults')}
                 </TableCell>
               </TableRow>
             )}
           </TableBody>
         </Table>
       </div>
        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                 {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                 {t('common.next')}
              </Button>
          </div>
       </div>
    </div>
  )
}

