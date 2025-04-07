import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    useCreateCarMutation, 
    useGetCustomersQuery
} from "@/store/apiSlice";
import type { CreateVehicleRequest } from "@/store/apiSlice";

// Define Zod schema for form validation (matches CreateVehicleRequest)
const vehicleSchema = z.object({
  make: z.string().min(1, { message: "Make is required" }),
  model: z.string().min(1, { message: "Model is required" }),
  year: z.coerce.number().int().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  license_plate: z.string().min(1, { message: "License plate is required" }),
  vin: z.string().min(17, "VIN must be 17 characters").max(17, "VIN must be 17 characters"),
  customer: z.string({ required_error: "Please select a customer." }).min(1, "Please select a customer."),
  initial_mileage: z.coerce.number({required_error: "Initial mileage is required."}).int().min(0, "Mileage cannot be negative"),
});

// Type derived from schema, customer will be string here
type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function AddVehicleDialog() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [createVehicle, { isLoading: isCreatingVehicle }] = useCreateCarMutation();
  const { data: customersData, isLoading: isLoadingCustomers } = useGetCustomersQuery();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: "",
      model: "",
      year: undefined,
      license_plate: "",
      vin: "",
      customer: "",
      initial_mileage: undefined,
    },
  });

  async function onSubmit(values: VehicleFormValues) {
    const validatedData = vehicleSchema.parse(values);
    
    const vehicleData: CreateVehicleRequest = {
        make: validatedData.make,
        model: validatedData.model,
        year: validatedData.year,
        license_plate: validatedData.license_plate,
        vin: validatedData.vin,
        customer_id: Number(validatedData.customer),
        initial_mileage: Number(validatedData.initial_mileage),
    };

    console.log("Submitting Vehicle Data:", vehicleData);

    try {
      await createVehicle(vehicleData).unwrap();
      toast.success("Vehicle created successfully!");
      form.reset();
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create vehicle:", err);
      let errorMsg = "Failed to create vehicle.";
       if (err && typeof err === 'object' && 'data' in err && err.data) {
        const errorDetails = (err.data as any);
        const messages = Object.entries(errorDetails).map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`);
        if (messages.length > 0) {
            errorMsg = messages.join('\n');
        }
       } 
      toast.error(errorMsg);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Enter the details of the new vehicle.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2023" {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 TUN 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN (17 Characters)</FormLabel>
                    <FormControl>
                      <Input placeholder="Vehicle Identification Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        value={field.value?.toString()}
                        disabled={isLoadingCustomers}
                    > 
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {isLoadingCustomers && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                        {customersData?.results?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.user.first_name} {customer.user.last_name}
                        </SelectItem>
                        ))}
                        {(!customersData?.results || customersData.results.length === 0) && !isLoadingCustomers && (
                             <SelectItem value="no-customers" disabled>No customers found</SelectItem>
                        )}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="initial_mileage"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Initial Mileage</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="e.g., 10000" {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="outline">Cancel</Button>
               </DialogClose>
              <Button type="submit" disabled={isCreatingVehicle}>
                {isCreatingVehicle ? "Saving..." : "Save Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 