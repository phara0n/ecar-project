import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // No DialogTrigger needed here directly
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
    Customer, // Import the Customer type
    useUpdateCustomerMutation,
    UpdateCustomerRequest,
    User // Also import User type if needed for patch
} from "@/store/apiSlice";
import { toast } from "sonner";

// Define the Zod schema for editing (similar to create, but maybe different constraints)
// Exclude password, make username read-only (validation still useful)
const editCustomerFormSchema = z.object({
  user: z.object({
    first_name: z.string().min(1, { message: "First name is required." }),
    last_name: z.string().min(1, { message: "Last name is required." }),
    email: z.string().min(1, { message: "Email is required." }).email({ message: "Invalid email address." }),
    username: z.string().min(1, { message: "Username is required." }), // Keep for display, but field will be disabled
  }),
  phone: z.string().optional().or(z.literal('')), 
  address: z.string().optional().or(z.literal('')), 
});

type EditCustomerFormValues = z.infer<typeof editCustomerFormSchema>;

interface EditCustomerDialogProps {
  customer: Customer; // Customer data to edit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerDialog({ customer, open, onOpenChange }: EditCustomerDialogProps) {
  const [updateCustomer, { isLoading, isSuccess, isError, error }] = useUpdateCustomerMutation();

  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerFormSchema),
    // Pre-populate the form with existing customer data
    defaultValues: {
      user: {
        first_name: customer.user.first_name || "",
        last_name: customer.user.last_name || "",
        email: customer.user.email || "",
        username: customer.user.username || "", // For display
      },
      phone: customer.phone || "",
      address: customer.address || "",
    },
  });

  const onSubmit = async (values: EditCustomerFormValues) => {
    console.log("Form values for update:", values);

    // Prepare the partial data payload for PATCH request
    // according to UpdateCustomerRequest type
    const updatePayload: UpdateCustomerRequest = {
      id: customer.id, // Include the customer ID
      // Only include fields that might have changed
      // Compare with initial `customer` prop if needed, or send all editable fields
      phone: values.phone || undefined,
      address: values.address || undefined,
      user: { // Send nested user fields that are editable
        first_name: values.user.first_name,
        last_name: values.user.last_name,
        email: values.user.email,
        // Do NOT send username or password from this form
      }
    };

    // Filter out undefined values if the backend prefers absence over null/undefined
     if (updatePayload.phone === undefined) delete updatePayload.phone;
     if (updatePayload.address === undefined) delete updatePayload.address;
     // Clean up user object if necessary, e.g., if email is somehow undefined (though schema prevents empty)
     // if (updatePayload.user?.email === undefined) delete updatePayload.user.email;


    console.log("Submitting update payload:", updatePayload);

    try {
      await updateCustomer(updatePayload).unwrap();
      // Success handling is in useEffect
    } catch (err) {
      console.error("Failed to update customer:", err);
      // Error handling is in useEffect
    }
  };

  // Handle success/error state changes
  React.useEffect(() => {
    if (isSuccess) {
      toast.success("Customer updated successfully!");
      onOpenChange(false); // Close dialog on success
      // Optional: form.reset() with updated values if needed, but usually closing is enough
    }
    if (isError) {
      console.error("RTK Query Error Object (Update):", error);
      let errorMessage = "Failed to update customer.";
      // Use the same robust error message extraction as before
      if (error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object') {
        const errorData = error.data as Record<string, unknown>;
        const detailMessages: string[] = [];
        Object.entries(errorData).forEach(([field, value]) => {
            if (Array.isArray(value)) { detailMessages.push(`${field}: ${value.join(', ')}`); }
            else if (typeof value === 'string') { detailMessages.push(`${field}: ${value}`); }
        });
        if (detailMessages.length > 0) { errorMessage = `Update failed:\n${detailMessages.join('\n')}`; }
        else if ('detail' in errorData && typeof errorData.detail === 'string') { errorMessage = `Update failed: ${errorData.detail}`; }
      } else if (error && typeof error === 'object' && 'status' in error) {
        errorMessage = `Update failed (Status: ${error.status})`;
      }
      toast.error(errorMessage, { duration: 6000 });
    }
  }, [isSuccess, isError, error, onOpenChange]);

   // Reset form if customer prop changes (e.g., opening dialog for a different customer)
   React.useEffect(() => {
     form.reset({
       user: {
         first_name: customer.user.first_name || "",
         last_name: customer.user.last_name || "",
         email: customer.user.email || "",
         username: customer.user.username || "",
       },
       phone: customer.phone || "",
       address: customer.address || "",
     });
   }, [customer, form]);


  return (
    // Use Dialog component directly, controlled by 'open' prop
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer: {customer.user.first_name} {customer.user.last_name}</DialogTitle>
          <DialogDescription>
            Update the customer's details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 pt-4">
                <FormField control={form.control} name="user.first_name" render={({ field }) => ( <FormItem> <FormLabel>First Name *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="user.last_name" render={({ field }) => ( <FormItem> <FormLabel>Last Name *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem> <FormLabel>Phone</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Address</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-4 pt-4">
                {/* Username (Read-Only) */}
                 <FormField
                  control={form.control}
                  name="user.username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly disabled className="disabled:cursor-not-allowed disabled:opacity-70"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {/* Email (Editable) */} 
                 <FormField
                   control={form.control}
                   name="user.email"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Email *</FormLabel>
                       <FormControl>
                         <Input type="email" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 {/* Password editing is intentionally omitted */}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              {/* Use onOpenChange(false) for Cancel */}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 