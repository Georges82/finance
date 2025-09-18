'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

import { Plus, Search, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AdminFormSheet } from '@/components/dashboard/manage-admins/admin-form-sheet';
import { DeleteAdminDialog } from '@/components/dashboard/manage-admins/delete-admin-dialog';
import { Admin } from '@/lib/types';
import { apiService, AdminCreatePayload } from '@/lib/api';

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();

  // Fetch all admins on component mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAuthError = async (error: any): Promise<boolean> => {
    console.error('Authentication error:', error);
    
    // If it's an authentication error, logout and redirect to login
    if (error.message?.includes('Authentication failed') || 
        error.message?.includes('Authentication token missing') ||
        error.message?.includes('Token has expired')) {
      
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      
      try {
        await logout();
      } catch (logoutError) {
        console.error('Logout failed:', logoutError);
      }
      router.push('/login');
      return true; // Indicates auth error was handled
    }
    return false; // Indicates auth error was not handled
  };

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching all admins...');
      
      const response = await apiService.getAllAdmins({
        limit: 100,
        offset: 0,
        query: searchTerm,
        sort: 'desc',
        sort_by: 'created_at'
      });

      console.log('Get all admins response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');

      if (response.status === 'Success' && response.data) {
        // Transform API response to match frontend Admin interface
        console.log('Raw admin data:', response.data);
        
        const transformedAdmins: Admin[] = response.data.map((adminData: any, index: number) => {
          console.log(`Processing admin ${index}:`, adminData);
          
          // Handle role transformation - convert "Role.ADMIN" to "admin", "Role.SUPER_ADMIN" to "super admin"
          let role = 'admin';
          if (adminData.role) {
            console.log(`Admin ${index} role:`, adminData.role);
            if (adminData.role === 'Role.ADMIN' || adminData.role === 'admin') {
              role = 'admin';
            } else if (adminData.role === 'Role.SUPER_ADMIN' || adminData.role === 'super admin') {
              role = 'super admin';
            }
          }
          
          const transformedAdmin = {
            id: adminData.admin_id,
            admin_first_name: adminData.first_name || '',
            admin_last_name: adminData.last_name || '',
            admin_email: adminData.email || '',
            admin_username: adminData.username || '',
            admin_role: role,
            createdAt: adminData.created_at || new Date().toISOString().split('T')[0]
          };
          
          console.log(`Transformed admin ${index}:`, transformedAdmin);
          return transformedAdmin;
        });

        console.log('Transformed admins:', transformedAdmins);

        setAdmins(transformedAdmins);
        setTotalCount(response.total_count || 0);
        
        toast({
          title: "Success!",
          description: response.message || `Loaded ${transformedAdmins.length} admin(s)`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load admins",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      
      // Handle authentication errors
      if (await handleAuthError(error)) {
        return;
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load admins. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter admins based on search term (client-side filtering for now)
  const filteredAdmins = admins.filter(admin => {
    const fullName = `${admin.admin_first_name} ${admin.admin_last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         admin.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.admin_username.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) {
      console.log(`Admin filtered out: ${admin.admin_first_name} ${admin.admin_last_name} (${admin.admin_email})`);
    }
    
    return matchesSearch;
  });

  console.log('Total admins:', admins.length);
  console.log('Filtered admins:', filteredAdmins.length);
  console.log('Search term:', searchTerm);

  const handleAddAdmin = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the payload according to the API specification
      const payload: AdminCreatePayload = {
        admin_email: formData.admin_email,
        admin_username: formData.admin_username,
        admin_password: formData.admin_password,
        admin_first_name: formData.admin_first_name,
        admin_last_name: formData.admin_last_name,
        admin_role: formData.admin_role,
        status: 'active' // Default status
      };

      console.log('Sending payload to API:', payload);

      const response = await apiService.registerAdmin(payload);
      
      if (response.status === 'Success') {
        toast({
          title: "Success!",
          description: response.message || "Admin created successfully",
        });

        // Refresh the admin list
        await fetchAdmins();
        setIsFormOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      
      // Handle authentication errors
      if (await handleAuthError(error)) {
        return;
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create admin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAdmin = async (formData: any) => {
    if (!editingAdmin) return;
    
    setIsSubmitting(true);
    try {
      // Transform role format for backend (convert frontend format to backend format)
      let backendRole = 'admin';
      if (formData.admin_role === 'admin') {
        backendRole = 'admin';
      } else if (formData.admin_role === 'super admin') {
        backendRole = 'super admin';
      }

      // Prepare the payload according to the API specification
      const payload: AdminUpdatePayload = {
        admin_email: formData.admin_email,
        admin_username: formData.admin_username,
        admin_first_name: formData.admin_first_name,
        admin_last_name: formData.admin_last_name,
        admin_role: backendRole
      };

      // Only include password if it's provided (not empty)
      if (formData.admin_password && formData.admin_password.trim() !== '') {
        payload.admin_password = formData.admin_password;
      }

      console.log('Sending update payload to API:', payload);
      console.log('Updating admin with ID:', editingAdmin.id);

      const response = await apiService.updateAdmin(editingAdmin.id, payload);
      
      console.log('Update response:', response);
      
      if (response.status === 'Success') {
        toast({
          title: "Success!",
          description: response.message || "Admin updated successfully",
        });

        console.log('About to refresh admin list...');
        // Refresh the admin list
        await fetchAdmins();
        console.log('Admin list refreshed');
        setEditingAdmin(null);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      
      // Handle authentication errors
      if (await handleAuthError(error)) {
        return;
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update admin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    setIsDeleting(true);
    try {
      console.log('Deleting admin with ID:', admin.id);
      
      const response = await apiService.deleteAdmin(admin.id);
      
      if (response.status === 'Success') {
        toast({
          title: "Success!",
          description: response.message || "Admin deleted successfully",
        });
        
        // Refresh the admin list
        await fetchAdmins();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete admin",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      
      // Handle authentication errors
      if (await handleAuthError(error)) {
        return;
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete admin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingAdmin(null);
    }
  };

  // Handle search with debouncing
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submission (for server-side search)
  const handleSearchSubmit = () => {
    fetchAdmins();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Admins</h1>
          <p className="text-muted-foreground">Manage admin accounts and their permissions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              All admin accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently loaded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(admin => admin.admin_role === 'super admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Super admin accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle>Admin List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSearchSubmit}
                disabled={isLoading}
              >
                Search
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAdmins}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading admins...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No admins found matching your search.' : 'No admins found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.admin_first_name} {admin.admin_last_name}
                      </TableCell>
                      <TableCell>{admin.admin_username}</TableCell>
                      <TableCell>{admin.admin_email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.admin_role === 'super admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.admin_role}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingAdmin(admin)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingAdmin(admin)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddAdmin}
        isSubmitting={isSubmitting}
      />

      {editingAdmin && (
        <AdminFormSheet
          open={!!editingAdmin}
          onOpenChange={() => setEditingAdmin(null)}
          admin={editingAdmin}
          onSubmit={handleEditAdmin}
        />
      )}

      {deletingAdmin && (
        <DeleteAdminDialog
          admin={deletingAdmin}
          onConfirm={() => handleDeleteAdmin(deletingAdmin)}
          onCancel={() => setDeletingAdmin(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

