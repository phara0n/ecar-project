import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [profileData, setProfileData] = useState<ProfileFormData>({ first_name: "", last_name: "", email: "" });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({ current_password: "", new_password: "", confirm_password: "" });
  
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch current user data when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingProfile(true);
      setProfileErrors({});
      setPasswordErrors({});
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      
      userService.getCurrentUser()
        .then(response => {
          const user = response.data;
          setProfileData({ 
            first_name: user.first_name || "", 
            last_name: user.last_name || "", 
            email: user.email || "" 
          });
        })
        .catch(err => {
          console.error("Error fetching user profile:", err);
          toast.error("Failed to load profile data.");
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [open]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
     if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profileData.first_name.trim()) errors.first_name = "First name is required";
    if (!profileData.last_name.trim()) errors.last_name = "Last name is required";
    if (!profileData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = "Email is invalid";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};
    if (!passwordData.current_password) errors.current_password = "Current password is required";
    if (!passwordData.new_password) {
      errors.new_password = "New password is required";
    } else if (passwordData.new_password.length < 8) {
        errors.new_password = "New password must be at least 8 characters";
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSavingProfile(true);
    const toastId = toast.loading("Saving profile...");
    try {
      await userService.updateCurrentUser(profileData);
      toast.success("Profile updated successfully", { id: toastId });
      // Optionally close dialog or show other feedback
      // onOpenChange(false); 
    } catch (error: any) {
      console.error("Error saving profile:", error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to save profile: ${errorMsg}`, { id: toastId });
       if (error.response?.status === 400 && typeof error.response.data === 'object') {
          setProfileErrors(error.response.data);
       }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setChangingPassword(true);
    const toastId = toast.loading("Changing password...");
    try {
      await userService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password
      });
      toast.success("Password changed successfully", { id: toastId });
      // Clear password fields and errors on success
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordErrors({});
      // Optionally close dialog or switch tab
      // onOpenChange(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      toast.error(`Failed to change password: ${errorMsg}`, { id: toastId });
       if (error.response?.status === 400 && typeof error.response.data === 'object') {
          // Map specific API errors (e.g., incorrect current password)
          const apiErrors = error.response.data;
          const formattedErrors: Record<string, string> = {};
          if (apiErrors.current_password) formattedErrors.current_password = apiErrors.current_password.join(', ');
          if (apiErrors.new_password) formattedErrors.new_password = apiErrors.new_password.join(', ');
          // Handle non_field_errors if backend sends them
          if (apiErrors.detail || apiErrors.non_field_errors) {
              toast.error(apiErrors.detail || apiErrors.non_field_errors.join(', '), { id: toastId })
          }
          setPasswordErrors(formattedErrors);
       }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>
            Update your profile information or change your password.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            {loadingProfile ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input 
                    id="first_name" 
                    name="first_name" 
                    value={profileData.first_name} 
                    onChange={handleProfileChange} 
                    disabled={savingProfile}
                  />
                  {profileErrors.first_name && <p className="text-sm text-red-500">{profileErrors.first_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name" 
                    name="last_name" 
                    value={profileData.last_name} 
                    onChange={handleProfileChange} 
                    disabled={savingProfile}
                  />
                  {profileErrors.last_name && <p className="text-sm text-red-500">{profileErrors.last_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={profileData.email} 
                    onChange={handleProfileChange} 
                    disabled={savingProfile}
                  />
                   {profileErrors.email && <p className="text-sm text-red-500">{profileErrors.email}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Profile
                  </Button>
                </DialogFooter>
              </form>
            )}
          </TabsContent>
          
          {/* Password Tab */}
          <TabsContent value="password">
             <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input 
                    id="current_password" 
                    name="current_password" 
                    type="password"
                    value={passwordData.current_password} 
                    onChange={handlePasswordChange} 
                    disabled={changingPassword}
                  />
                   {passwordErrors.current_password && <p className="text-sm text-red-500">{passwordErrors.current_password}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input 
                    id="new_password" 
                    name="new_password" 
                    type="password"
                    value={passwordData.new_password} 
                    onChange={handlePasswordChange} 
                    disabled={changingPassword}
                  />
                  {passwordErrors.new_password && <p className="text-sm text-red-500">{passwordErrors.new_password}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input 
                    id="confirm_password" 
                    name="confirm_password" 
                    type="password"
                    value={passwordData.confirm_password} 
                    onChange={handlePasswordChange} 
                    disabled={changingPassword}
                  />
                  {passwordErrors.confirm_password && <p className="text-sm text-red-500">{passwordErrors.confirm_password}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </DialogFooter>
              </form>
          </TabsContent>
        </Tabs>
        
      </DialogContent>
    </Dialog>
  );
} 