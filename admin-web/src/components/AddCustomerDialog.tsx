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
  DialogTrigger,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useCreateCustomerMutation,
  useRegisterUserMutation,
  CreateCustomerRequest,
  RegisterUserRequest,
  RegisterUserResponse
} from "@/store/apiSlice";
import { toast } from "sonner";

// Define the Zod schema - add password confirmation
const customerFormSchema = z.object({
  user: z.object({
    first_name: z.string().min(1, { message: "First name is required." }),
    last_name: z.string().min(1, { message: "Last name is required." }),
    email: z.string().min(1, { message: "Email is required." }).email({ message: "Invalid email address." }), 
    username: z.string().min(1, { message: "Username is required." }), 
    password: z.string().min(8, { message: "Password must be at least 8 characters." }), 
    password_confirm: z.string().min(8, { message: "Please confirm your password." }), // Add confirmation field
  }),
  phone: z.string().optional().or(z.literal('')), 
  address: z.string().optional().or(z.literal('')), 
})
// Add refinement to check if passwords match
.refine((data) => data.user.password === data.user.password_confirm, {
  message: "Passwords do not match",
  path: ["user", "password_confirm"], // Apply error to the confirmation field
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface AddCustomerDialogProps {
  // Add any necessary props, e.g., onCustomerAdded callback
  children: React.ReactNode; // To wrap the trigger button
}

export function AddCustomerDialog({ children }: AddCustomerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [registerUser, { isLoading: isRegistering, isError: isRegisterError, error: registerError }] = useRegisterUserMutation();
  const [createCustomer, { isLoading: isCreatingCustomer, isSuccess, isError: isCreateError, error: createError }] = useCreateCustomerMutation();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      user: {
        first_name: "",
        last_name: "",
        email: "",
        username: "",
        password: "",
        password_confirm: "", // Add default for confirmation
      },
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    console.log("Form values for registration/creation:", values);
    let userId: number | null = null;

    // Step 1: Register the user
    try {
      const registrationPayload: RegisterUserRequest = {
        username: values.user.username,
        email: values.user.email,
        password: values.user.password,
        password_confirm: values.user.password_confirm, // Include confirmation
        first_name: values.user.first_name,
        last_name: values.user.last_name,
      };
      console.log("Attempting user registration with payload:", registrationPayload);
      const registeredUser = await registerUser(registrationPayload).unwrap();
      userId = registeredUser.id;
      console.log("User registration successful, User ID:", userId);
    } catch (regErr: any) {
      console.error("User registration failed:", regErr);
      // Display registration error (adapt error handling as needed)
      let regErrorMessage = "Failed to register user.";
       if (regErr && typeof regErr === 'object' && 'data' in regErr && regErr.data) {
          // Extract specific errors from regErr.data if backend provides them
          // Example: const errorData = regErr.data as Record<string, string[]>; ...
          regErrorMessage = `Registration failed: ${JSON.stringify(regErr.data)}`;
       }
      toast.error(regErrorMessage, { duration: 6000 });
      return; // Stop if registration fails
    }

    // Step 2: Create the customer profile using the obtained userId
    if (userId) {
      try {
        const customerPayload: CreateCustomerRequest = {
          user_id: userId,
          phone: values.phone || undefined,
          address: values.address || undefined,
        };
        console.log("Attempting customer profile creation with payload:", customerPayload);
        await createCustomer(customerPayload).unwrap();
        // Success handling is now managed by the useEffect listening to createCustomer's state
         console.log("Customer profile creation successful.");
      } catch (custErr: any) {
        console.error("Customer profile creation failed:", custErr);
        // Optional: Add specific error handling/toast for customer creation failure
        // The useEffect below will still catch this via isCreateError, but you might want
        // a more immediate message here.
        // toast.error("Failed to create customer profile after registration.", { duration: 6000 });
      }
    }
  };

  // Update useEffect to handle combined loading/error states
  React.useEffect(() => {
    // isSuccess only relates to createCustomer now
    if (isSuccess) {
      toast.success("Customer created successfully!");
      form.reset();
      setOpen(false);
    }
    // Handle errors from either mutation
    const combinedError = createError || registerError;
    if (combinedError) {
        console.error("RTK Query Error Object (Create or Register):", combinedError);
        let errorMessage = "An error occurred.";
        
        if (combinedError && typeof combinedError === 'object' && 'data' in combinedError && combinedError.data && typeof combinedError.data === 'object') {
            const errorData = combinedError.data as Record<string, unknown>;
            const detailMessages: string[] = [];
            Object.entries(errorData).forEach(([field, value]) => {
                if (Array.isArray(value)) {
                    detailMessages.push(`${field}: ${value.join(', ')}`);
                } else if (typeof value === 'string') {
                    detailMessages.push(`${field}: ${value}`);
                }
            });
            if (detailMessages.length > 0) {
                errorMessage = `Operation failed:\n${detailMessages.join('\n')}`;
            } else if ('detail' in errorData && typeof errorData.detail === 'string') {
               errorMessage = `Operation failed: ${errorData.detail}`;
            }
        } else if (combinedError && typeof combinedError === 'object' && 'status' in combinedError) {
             errorMessage = `Operation failed (Status: ${combinedError.status})`;
        }
        // Avoid duplicate toasts if already handled in onSubmit's catch block for registration
        if (!registerError) { // Only show generic toast if it wasn't a registration error handled above
            toast.error(errorMessage, { duration: 6000 });
        } 
    }
  // Depend on states from both hooks
  }, [isSuccess, isCreateError, isRegisterError, createError, registerError, form]); 

  // Combine loading states for the submit button
  const isLoading = isRegistering || isCreatingCustomer;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Enter the details for the new customer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab Content */}
              <TabsContent value="profile" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="user.first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user.last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Account Tab Content */}
              <TabsContent value="account" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="user.username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user.password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user.password_confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 