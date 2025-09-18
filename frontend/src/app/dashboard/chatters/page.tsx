
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Loader2, Settings } from 'lucide-react';
import { ChatterFormSheet } from '@/components/dashboard/chatters/chatter-form-sheet';
import { DeleteChatterDialog } from '@/components/dashboard/chatters/delete-chatter-dialog';
import { ChatterRateModal } from '@/components/dashboard/chatters/chatter-rate-modal';
import { apiService, Chatter, ChatterUpdatePayload } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// Generate periods dynamically based on monthsToShow
const generatePeriods = (monthsCount: number) => {
  const periods = [];
  const currentDate = new Date();
  
  // Generate periods for the specified number of months back
  for (let monthOffset = monthsCount - 1; monthOffset >= 0; monthOffset--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    // Add two periods per month (1st half: 1-15, 2nd half: 16-end)
    periods.push({
      id: `${monthName} 1_${year}`,
      name: `${monthName} 1`,
      range: `${String(date.getMonth() + 1).padStart(2, '0')}/01-${String(date.getMonth() + 1).padStart(2, '0')}/15`,
      year: year,
      month: monthName
    });
    
    periods.push({
      id: `${monthName} 2_${year}`,
      name: `${monthName} 2`,
      range: `${String(date.getMonth() + 1).padStart(2, '0')}/16-${String(date.getMonth() + 1).padStart(2, '0')}/31`,
      year: year,
      month: monthName
    });
  }
  
  return periods;
};

export default function ChattersPage() {
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChatter, setEditingChatter] = useState<Chatter | null>(null);
  const [deletingChatter, setDeletingChatter] = useState<Chatter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rateModalChatter, setRateModalChatter] = useState<Chatter | null>(null);
  const [monthsToShow, setMonthsToShow] = useState(6); // Start with 6 months

  // Generate periods dynamically
  const availablePeriods = generatePeriods(monthsToShow);

  // Fetch chatters on component mount and when period changes
  useEffect(() => {
    fetchChatters();
  }, [selectedPeriod]);

  const fetchChatters = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getChattersWithSalaryData({
        limit: 100,
        query: searchTerm,
        sort: 'desc',
        sort_by: 'created_at',
        period: selectedPeriod !== 'all' ? selectedPeriod : undefined
      });

      if (response.status === 'Success' && response.data) {
        setChatters(response.data);
      } else {
        console.error('Failed to fetch chatters:', response.message);
        toast({
          title: "Error",
          description: "Failed to fetch chatters",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching chatters:', error);
      toast({
        title: "Error",
        description: "Failed to load chatters",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChatters = chatters.filter(chatter => {
    const matchesSearch = chatter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chatter.telegram_username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chatter.status === statusFilter;
    const matchesShift = shiftFilter === 'all' || chatter.shift === shiftFilter;
    return matchesSearch && matchesStatus && matchesShift;
  });

  const handleAddChatter = async (formData: any) => {
    // This will be handled by the ChatterFormSheet component now
    // We just need to refresh the list after creation
    await fetchChatters();
  };

  const handleEditChatter = async (formData: any) => {
    if (!editingChatter) return;

    try {
      const payload: ChatterUpdatePayload = {
        name: formData.name,
        country: formData.country,
        shift: formData.shift,
        notes: formData.notes,
        status: formData.status,
        payment_status: formData.payment_status,
      };

      const response = await apiService.updateChatter(editingChatter.chatter_id, payload);
      
      if (response.status === 'Success') {
        toast({
          title: "Success",
          description: "Chatter updated successfully!",
        });
        await fetchChatters();
        setEditingChatter(null);
      } else {
        throw new Error(response.message || 'Failed to update chatter');
      }
    } catch (error) {
      console.error('Error updating chatter:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update chatter',
        variant: "destructive",
      });
    }
  };

  const handleDeleteChatter = async (chatter: Chatter) => {
    try {
      const response = await apiService.deleteChatter(chatter.chatter_id);
      
      if (response.status === 'Success') {
        toast({
          title: "Success",
          description: "Chatter deleted successfully!",
        });
        await fetchChatters();
        setDeletingChatter(null);
      } else {
        throw new Error(response.message || 'Failed to delete chatter');
      }
    } catch (error) {
      console.error('Error deleting chatter:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete chatter',
        variant: "destructive",
      });
    }
  };

  const handleUpdatePaymentStatus = async (chatterId: string, paymentStatus: 'Paid' | 'Not Paid') => {
    try {
      const payload: ChatterUpdatePayload = {
        payment_status: paymentStatus,
      };

      const response = await apiService.updateChatter(chatterId, payload);
      
      if (response.status === 'Success') {
        // Update local state immediately for better UX
        setChatters(chatters.map(c => 
          c.chatter_id === chatterId ? { ...c, payment_status: paymentStatus } : c
        ));
      } else {
        throw new Error(response.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update payment status',
        variant: "destructive",
      });
    }
  };



  const handleUpdateRates = async (chatterId: string, rates: {
    rate1Model: number;
    rate2Models: number;
    rate3Models: number;
    rate4Models: number;
    rate5Models: number;
  }) => {
    try {
      // Convert rates to the format expected by the API
      const ratePayloads = [
        { models_count: 1, hourly_rate: rates.rate1Model },
        { models_count: 2, hourly_rate: rates.rate2Models },
        { models_count: 3, hourly_rate: rates.rate3Models },
        { models_count: 4, hourly_rate: rates.rate4Models },
        { models_count: 5, hourly_rate: rates.rate5Models },
      ];

      // First, check if the chatter has existing rates
      const existingRatesResponse = await apiService.getChatterRates(chatterId);
      const hasExistingRates = existingRatesResponse.status === 'Success' && 
                              existingRatesResponse.data && 
                              existingRatesResponse.data.length > 0;

      let response;
      
      if (hasExistingRates) {
        // Use update API for existing rates
        console.log('Updating existing rates for chatter:', chatterId);
        response = await apiService.updateChatterRates(chatterId, { rates: ratePayloads });
      } else {
        // Use add API for new rates
        console.log('Adding new rates for chatter:', chatterId);
        // Add rates one by one using the add endpoint
        const addPromises = ratePayloads.map(rate => 
          apiService.addChatterRate(chatterId, rate)
        );
        
        const addResponses = await Promise.all(addPromises);
        
        // Check if all additions were successful
        const allSuccessful = addResponses.every(resp => resp.status === 'Success');
        
        if (allSuccessful) {
          response = {
            status: 'Success',
            message: `All ${ratePayloads.length} rates added successfully`
          };
        } else {
          response = {
            status: 'Failed',
            message: 'Some rates failed to be added'
          };
        }
      }
      
      console.log('Rate operation response:', response);
      
      if (response.status === 'Success') {
        toast({
          title: "Success",
          description: response.message || "Hourly rates updated successfully!",
        });
        setRateModalChatter(null);
        // Refresh the chatters list to show updated rates
        await fetchChatters();
      } else {
        throw new Error(response.message || 'Failed to update rates');
      }
    } catch (error) {
      console.error('Error updating rates:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update hourly rates',
        variant: "destructive",
      });
    }
  };

  const handleChatterCreated = async (newChatter: Chatter) => {
    // Add the new chatter to the list
    setChatters(prev => [newChatter, ...prev]);
    toast({
      title: "Success",
      description: "Chatter created successfully!",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Not Paid': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'A': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'B': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'C': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleSearch = async () => {
    setIsRefreshing(true);
    await fetchChatters();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading chatters...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h1 className="text-3xl font-bold">🧑‍💼 Chatters</h1>
           <p className="text-muted-foreground">Manage your chat agents and their performance</p>
         </div>
                   <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 sm:mt-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Period:</span>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {availablePeriods.map((period) => (
                    <SelectItem key={period.id} value={period.name}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                ({monthsToShow} months)
              </span>
              {monthsToShow < 12 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMonthsToShow(prev => Math.min(prev + 6, 12))}
                  className="text-xs"
                >
                  Load More
                </Button>
              )}
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Chatter
            </Button>
          </div>
       </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chatters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatters.length}</div>
            <p className="text-xs text-muted-foreground">
              {chatters.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chatters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chatters.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chatters.filter(c => c.payment_status === 'Not Paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need payment
            </p>
          </CardContent>
        </Card>
                 <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">
               {selectedPeriod === 'all' ? 'Total Payroll' : `${selectedPeriod} Payroll`}
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               ${selectedPeriod === 'all' 
                 ? chatters.reduce((sum, c) => sum + (c.amount_for_period || 0), 0).toLocaleString()
                 : chatters.reduce((sum, c) => sum + (c.last_salary_period === selectedPeriod ? (c.amount_for_period || 0) : 0), 0).toLocaleString()
               }
             </div>
             <p className="text-xs text-muted-foreground">
               {selectedPeriod === 'all' ? 'All periods' : selectedPeriod}
             </p>
           </CardContent>
         </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle>Chatter List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or telegram..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="A">Shift A</SelectItem>
                  <SelectItem value="B">Shift B</SelectItem>
                  <SelectItem value="C">Shift C</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSearch}
                disabled={isRefreshing}
              >
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Telegram Username</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Status</TableHead>
                                 <TableHead>
                   {selectedPeriod === 'all' ? 'Last Salary Period' : `Amount for ${selectedPeriod}`}
                 </TableHead>
                 <TableHead>
                   {selectedPeriod === 'all' ? 'Amount for Period' : `Amount for ${selectedPeriod}`}
                 </TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChatters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : filteredChatters.map((chatter) => (
                <TableRow key={chatter.chatter_id}>
                  <TableCell className="font-medium">{chatter.name}</TableCell>
                  <TableCell className="font-mono text-sm">{chatter.telegram_username}</TableCell>
                  <TableCell>{chatter.country}</TableCell>
                  <TableCell>
                    <Badge className={getShiftColor(chatter.shift)}>
                      {chatter.shift}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(chatter.status)}>
                      {chatter.status}
                    </Badge>
                  </TableCell>
                                     <TableCell>
                     <div className="flex flex-col">
                       <div className="font-medium">
                         {selectedPeriod === 'all' 
                           ? (chatter.last_salary_period || 'No Data')
                           : (chatter.last_salary_period === selectedPeriod ? selectedPeriod : 'No Data')
                         }
                       </div>
                       <div className="text-xs text-muted-foreground">
                         {selectedPeriod === 'all' 
                           ? (chatter.last_salary_period !== 'No Data' ? 'Latest Period' : '')
                           : (chatter.last_salary_period === selectedPeriod ? 'Selected Period' : 'No Data for Period')
                         }
                       </div>
                     </div>
                   </TableCell>
                                     <TableCell className="font-semibold">
                     ${selectedPeriod === 'all' 
                       ? (chatter.amount_for_period || 0).toLocaleString()
                       : (chatter.last_salary_period === selectedPeriod ? (chatter.amount_for_period || 0).toLocaleString() : '0')
                     }
                   </TableCell>
                  <TableCell>
                    <Select 
                      value={chatter.payment_status} 
                      onValueChange={(value: 'Paid' | 'Not Paid') => handleUpdatePaymentStatus(chatter.chatter_id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Not Paid">Not Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingChatter(chatter)}
                        title="Edit ✏️"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingChatter(chatter)}
                        title="Delete 🗑️"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRateModalChatter(chatter)}
                        title="Settings ⚙️"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ChatterFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddChatter}
        onChatterCreated={handleChatterCreated}
      />

      {editingChatter && (
        <ChatterFormSheet
          open={!!editingChatter}
          onOpenChange={() => setEditingChatter(null)}
          chatter={editingChatter}
          onSubmit={handleEditChatter}
        />
      )}

      {deletingChatter && (
        <DeleteChatterDialog
          chatter={deletingChatter}
          onConfirm={() => handleDeleteChatter(deletingChatter)}
          onCancel={() => setDeletingChatter(null)}
        />
      )}

      {rateModalChatter && (
        <ChatterRateModal
          open={!!rateModalChatter}
          onOpenChange={() => setRateModalChatter(null)}
          onSubmit={(rates) => handleUpdateRates(rateModalChatter.chatter_id, rates)}
          chatterName={rateModalChatter.name}
          chatterId={rateModalChatter.chatter_id}
        />
      )}
    </div>
  );
}
