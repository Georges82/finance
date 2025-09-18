'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, DollarSign, Users, TrendingUp } from 'lucide-react';
import { ManagerFormSheet } from '@/components/dashboard/managers/manager-form-sheet';
import { AssistantFormSheet } from '@/components/dashboard/managers/assistant-form-sheet';
import { DeleteManagerDialog } from '@/components/dashboard/managers/delete-manager-dialog';
import { DeleteAssistantDialog } from '@/components/dashboard/managers/delete-assistant-dialog';
import { LeaderFormSheet } from '@/components/dashboard/team-leaders/leader-form-sheet';
import { DeleteLeaderDialog } from '@/components/dashboard/team-leaders/delete-leader-dialog';
import { ManagerPeriodTable } from '@/components/dashboard/managers/manager-period-table';
import { PeriodSelector } from '@/components/dashboard/managers/period-selector';
import { useToast } from '@/hooks/use-toast';
import { apiService, Manager, Assistant, TeamLeader } from '@/lib/api';

interface ManagerWithSalaries extends Manager {
  period_salaries: {
    [periodId: string]: {
      week1_salary: number;
      week2_salary: number;
      total_salary: number;
      payment_status: 'Paid' | 'Not Paid';
    };
  };
}

interface Period {
  id: string;
  name: string;
}

const availablePeriods: Period[] = [
  { id: 'jul1', name: 'Jul 1' },
  { id: 'jul2', name: 'Jul 2' },
  { id: 'aug1', name: 'Aug 1' },
  { id: 'aug2', name: 'Aug 2' },
  { id: 'sep1', name: 'Sep 1' },
  { id: 'sep2', name: 'Sep 2' },
];

export default function ManagersPageNew() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('managers');
  const [managers, setManagers] = useState<ManagerWithSalaries[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isManagerFormOpen, setIsManagerFormOpen] = useState(false);
  const [isAssistantFormOpen, setIsAssistantFormOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [deletingManager, setDeletingManager] = useState<Manager | null>(null);
  const [deletingAssistant, setDeletingAssistant] = useState<Assistant | null>(null);
  const [editingLeader, setEditingLeader] = useState<TeamLeader | null>(null);
  const [deletingLeader, setDeletingLeader] = useState<TeamLeader | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<Period[]>([
    { id: 'jul1', name: 'Jul 1' },
    { id: 'jul2', name: 'Jul 2' },
    { id: 'aug1', name: 'Aug 1' }
  ]);
  const [loading, setLoading] = useState(true);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [loadingTeamLeaders, setLoadingTeamLeaders] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadManagers();
    loadAssistants();
    loadTeamLeaders();
  }, []);

  // Reload data when search term changes
  useEffect(() => {
    if (searchTerm.length > 0) {
      loadManagers();
      loadAssistants();
      loadTeamLeaders();
    }
  }, [searchTerm]);

  // Reload managers when selected periods change
  useEffect(() => {
    if (activeTab === 'managers' && selectedPeriods.length > 0) {
      loadManagers();
    }
  }, [selectedPeriods, activeTab]);

  const loadManagers = async () => {
    setLoadingManagers(true);
    try {
      if (activeTab === 'managers' && selectedPeriods.length > 0) {
        // Load managers with period salaries
        const periodIds = selectedPeriods.map(p => p.id);
        const response = await apiService.getManagersWithPeriodSalaries(periodIds);
        
        if (response.status === 'Success' && response.data) {
          setManagers(response.data.managers);
          toast({
            title: "Managers Loaded",
            description: `Successfully loaded ${response.data.managers.length} managers with salary data.`,
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load managers",
            variant: "destructive",
          });
        }
      } else {
        // Load basic manager list for other tabs
        const response = await apiService.getAllManagers({
          limit: 100,
          offset: 0,
          query: searchTerm,
          sort: 'desc',
          sort_by: 'created_at'
        });
        
        if (response.status === 'Success' && response.data) {
          setManagers(response.data.map(m => ({ ...m, period_salaries: {} })));
          toast({
            title: "Managers Loaded",
            description: `Successfully loaded ${response.data.length} managers.`,
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to load managers",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error loading managers:', error);
      toast({
        title: "Error",
        description: "Failed to load managers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingManagers(false);
      setLoading(false);
    }
  };

  const loadAssistants = async () => {
    setLoadingAssistants(true);
    try {
      const response = await apiService.getAllAssistants({
        limit: 100,
        offset: 0,
        query: searchTerm,
        sort: 'desc',
        sort_by: 'created_at'
      });
      
      if (response.status === 'Success' && response.data) {
        setAssistants(response.data);
        toast({
          title: "Assistants Loaded",
          description: `Successfully loaded ${response.data.length} assistants.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load assistants",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
      toast({
        title: "Error",
        description: "Failed to load assistants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAssistants(false);
    }
  };

  const loadTeamLeaders = async () => {
    setLoadingTeamLeaders(true);
    try {
      const response = await apiService.getAllTeamLeaders();
      
      if (response.status === 'Success' && response.data) {
        setTeamLeaders(response.data);
        toast({
          title: "Team Leaders Loaded",
          description: `Successfully loaded ${response.data.length} team leaders.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load team leaders",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading team leaders:', error);
      toast({
        title: "Error",
        description: "Failed to load team leaders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTeamLeaders(false);
    }
  };

  // Period management
  const handlePeriodToggle = (period: Period) => {
    setSelectedPeriods(prev => {
      const isSelected = prev.some(p => p.id === period.id);
      if (isSelected) {
        return prev.filter(p => p.id !== period.id);
      } else {
        return [...prev, period];
      }
    });
  };

  // Managers filtering and calculations
  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.telegram_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalManagers = managers.filter(m => m.role === 'Manager').length;
  const activeManagers = managers.filter(m => m.role === 'Manager' && m.status === 'Active').length;
  const totalManagerSalary = managers.reduce((sum, manager) => {
    // Calculate total from period salaries
    const periodTotal = Object.values(manager.period_salaries || {}).reduce((periodSum, salary) => {
      return periodSum + salary.total_salary;
    }, 0);
    return sum + periodTotal;
  }, 0);

  // Assistants filtering and calculations
  const filteredAssistants = assistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assistant.telegram_username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAssistants = assistants.length;
  const activeAssistants = assistants.filter(a => a.status === 'Active').length;
  const totalAssistantSalary = assistants.reduce((sum, assistant) => {
    return sum + (assistant.fixed_salary || 0);
  }, 0);

  // Team Leaders filtering and calculations
  const filteredLeaders = teamLeaders.filter(leader => 
    leader.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    leader.telegram_username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalLeaders = teamLeaders.length;
  const activeLeaders = teamLeaders.filter(l => l.status === 'Active').length;
  const totalLeaderSalary = teamLeaders.reduce((sum, leader) => sum + (leader.fixed_salary || 0), 0);

  // Managers handlers
  const handleOpenManagerForm = (manager?: Manager) => {
    setEditingManager(manager || null);
    setIsManagerFormOpen(true);
  };

  const handleAddManager = async (managerData: any) => {
    try {
      const response = await apiService.createManager(managerData);
      
      if (response.status === 'Success') {
        toast({
          title: "Manager Added",
          description: `${managerData.name} has been successfully added.`,
        });
        loadManagers(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add manager",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding manager:', error);
      toast({
        title: "Error",
        description: "Failed to add manager. Please try again.",
        variant: "destructive",
      });
    }
    setIsManagerFormOpen(false);
    setEditingManager(null);
  };

  const handleEditManager = async (managerData: any) => {
    if (!editingManager) return;
    
    try {
      const response = await apiService.updateManager(editingManager.manager_id, managerData);
      
      if (response.status === 'Success') {
        toast({
          title: "Manager Updated",
          description: `${managerData.name} has been successfully updated.`,
        });
        loadManagers(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update manager",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating manager:', error);
      toast({
        title: "Error",
        description: "Failed to update manager. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsManagerFormOpen(false);
    setEditingManager(null);
  };

  const handleDeleteManager = async () => {
    if (!deletingManager) return;
    
    try {
      const response = await apiService.deleteManager(deletingManager.manager_id);
      
      if (response.status === 'Success') {
        toast({
          title: "Manager Deleted",
          description: `${deletingManager.name} has been successfully deleted.`,
        });
        loadManagers(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete manager",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting manager:', error);
      toast({
        title: "Error",
        description: "Failed to delete manager. Please try again.",
        variant: "destructive",
      });
    }
    
    setDeletingManager(null);
  };

  // Team Leaders handlers
  const handleAddLeader = async (leaderData: any) => {
    try {
      const payload = {
        name: leaderData.name,
        telegram_username: leaderData.telegramUsername,
        email: leaderData.email || '',
        phone: leaderData.phone || '',
        status: leaderData.status,
        salary_type: leaderData.salaryType,
        revenue_threshold: leaderData.revenueThreshold,
        commission_rate: leaderData.commissionRate,
        fixed_salary: leaderData.fixedSalary
      };

      const response = await apiService.createTeamLeader(payload);
      
      if (response.status === 'Success') {
        toast({
          title: "Team Leader Added",
          description: `${leaderData.name} has been successfully added.`,
        });
        loadTeamLeaders(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add team leader",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding team leader:', error);
      toast({
        title: "Error",
        description: "Failed to add team leader. Please try again.",
        variant: "destructive",
      });
    }
    setEditingLeader(null);
  };

  const handleEditLeader = async (leaderData: any) => {
    if (!editingLeader) return;
    
    try {
      const payload = {
        name: leaderData.name,
        telegram_username: leaderData.telegramUsername,
        email: leaderData.email || '',
        phone: leaderData.phone || '',
        status: leaderData.status,
        salary_type: leaderData.salaryType,
        revenue_threshold: leaderData.revenueThreshold,
        commission_rate: leaderData.commissionRate,
        fixed_salary: leaderData.fixedSalary
      };

      const response = await apiService.updateTeamLeader(editingLeader.team_leader_id, payload);
      
      if (response.status === 'Success') {
        toast({
          title: "Team Leader Updated",
          description: `${leaderData.name} has been successfully updated.`,
        });
        loadTeamLeaders(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update team leader",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating team leader:', error);
      toast({
        title: "Error",
        description: "Failed to update team leader. Please try again.",
        variant: "destructive",
      });
    }
    
    setEditingLeader(null);
  };

  const handleDeleteLeader = async () => {
    if (!deletingLeader) return;
    
    try {
      const response = await apiService.deleteTeamLeader(deletingLeader.team_leader_id);
      
      if (response.status === 'Success') {
        toast({
          title: "Team Leader Deleted",
          description: `${deletingLeader.name} has been successfully deleted.`,
        });
        loadTeamLeaders(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete team leader",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting team leader:', error);
      toast({
        title: "Error",
        description: "Failed to delete team leader. Please try again.",
        variant: "destructive",
      });
    }
    
    setDeletingLeader(null);
  };

  // Assistants handlers
  const handleOpenAssistantForm = (assistant?: Assistant) => {
    setEditingAssistant(assistant || null);
    setIsAssistantFormOpen(true);
  };

  const handleAddAssistant = async (assistantData: any) => {
    try {
      const response = await apiService.createAssistant(assistantData);
      
      if (response.status === 'Success') {
        toast({
          title: "Assistant Added",
          description: `${assistantData.name} has been successfully added.`,
        });
        loadAssistants(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add assistant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding assistant:', error);
      toast({
        title: "Error",
        description: "Failed to add assistant. Please try again.",
        variant: "destructive",
      });
    }
    setIsAssistantFormOpen(false);
    setEditingAssistant(null);
  };

  const handleEditAssistant = async (assistantData: any) => {
    if (!editingAssistant) return;
    
    try {
      const response = await apiService.updateAssistant(editingAssistant.assistant_id, assistantData);
      
      if (response.status === 'Success') {
        toast({
          title: "Assistant Updated",
          description: `${assistantData.name} has been successfully updated.`,
        });
        loadAssistants(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update assistant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating assistant:', error);
      toast({
        title: "Error",
        description: "Failed to update assistant. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsAssistantFormOpen(false);
    setEditingAssistant(null);
  };

  const handleDeleteAssistant = async () => {
    if (!deletingAssistant) return;
    
    try {
      const response = await apiService.deleteAssistant(deletingAssistant.assistant_id);
      
      if (response.status === 'Success') {
        toast({
          title: "Assistant Deleted",
          description: `${deletingAssistant.name} has been successfully deleted.`,
        });
        loadAssistants(); // Reload the list
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete assistant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting assistant:', error);
      toast({
        title: "Error",
        description: "Failed to delete assistant. Please try again.",
        variant: "destructive",
      });
    }
    
    setDeletingAssistant(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Management</h1>
          <p className="text-muted-foreground">
            Manage managers, team leaders, and assistants with salary rules and period tracking
          </p>
        </div>
        <Button onClick={() => {
          if (activeTab === 'managers') {
            handleOpenManagerForm();
          } else if (activeTab === 'team_leaders') {
            setEditingLeader({
              team_leader_id: 'new',
              name: '',
              telegram_username: '',
              email: '',
              phone: '',
              status: 'Active',
              salary_type: 'Fixed',
              revenue_threshold: 0,
              commission_rate: 0,
              fixed_salary: 0,
              created_at: new Date().toISOString()
            });
          } else {
            handleOpenAssistantForm();
          }
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add {activeTab === 'managers' ? 'Manager' : activeTab === 'team_leaders' ? 'Team Leader' : 'Assistant'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="team_leaders">Team Leaders</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
        </TabsList>

        <TabsContent value="managers" className="space-y-6">
          {/* Managers KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalManagers}</div>
                <p className="text-xs text-muted-foreground">
                  {activeManagers} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatSalary(totalManagerSalary)}</div>
                <p className="text-xs text-muted-foreground">
                  Combined payroll
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingManagers ? 'Loading...' : 'Ready'}</div>
                <p className="text-xs text-muted-foreground">
                  Data status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Period Selector */}
          <PeriodSelector
            availablePeriods={availablePeriods}
            selectedPeriods={selectedPeriods}
            onPeriodToggle={handlePeriodToggle}
          />

          {/* Search and Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Managers Table with Period Columns */}
          <Card>
            <CardHeader>
              <CardTitle>Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <ManagerPeriodTable
                managers={filteredManagers}
                selectedPeriods={selectedPeriods}
                loading={loadingManagers}
                onEditManager={handleOpenManagerForm}
                onDeleteManager={setDeletingManager}
                getStatusColor={getStatusColor}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team_leaders" className="space-y-6">
          {/* Team Leaders KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Team Leaders</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeaders}</div>
                <p className="text-xs text-muted-foreground">
                  {activeLeaders} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatSalary(totalLeaderSalary)}</div>
                <p className="text-xs text-muted-foreground">
                  Current period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingTeamLeaders ? 'Loading...' : 'Ready'}</div>
                <p className="text-xs text-muted-foreground">
                  Data status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team leaders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Leaders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Leaders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-left">Contact</th>
                      <th className="text-left">Salary Type</th>
                      <th className="text-left">Fixed Salary</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTeamLeaders ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          Loading team leaders...
                        </td>
                      </tr>
                    ) : filteredLeaders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          No team leaders found
                        </td>
                      </tr>
                    ) : (
                      filteredLeaders.map((leader) => (
                        <tr key={leader.team_leader_id}>
                          <td className="font-medium">{leader.name}</td>
                          <td>{leader.telegram_username}</td>
                          <td>
                            <Badge variant="outline">{leader.salary_type}</Badge>
                          </td>
                          <td>
                            <div className="text-sm">
                              <div className="font-medium">${leader.fixed_salary?.toLocaleString()}</div>
                            </div>
                          </td>
                          <td>
                            <Badge className={getStatusColor(leader.status)}>
                              {leader.status}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingLeader(leader)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingLeader(leader)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistants" className="space-y-6">
          {/* Assistants KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assistants</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAssistants}</div>
                <p className="text-xs text-muted-foreground">
                  {activeAssistants} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatSalary(totalAssistantSalary)}</div>
                <p className="text-xs text-muted-foreground">
                  Combined payroll
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingAssistants ? 'Loading...' : 'Ready'}</div>
                <p className="text-xs text-muted-foreground">
                  Data status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assistants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assistants Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assistants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-left">Contact</th>
                      <th className="text-left">Salary Type</th>
                      <th className="text-left">Fixed Salary</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAssistants ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          Loading assistants...
                        </td>
                      </tr>
                    ) : filteredAssistants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          No assistants found
                        </td>
                      </tr>
                    ) : (
                      filteredAssistants.map((assistant) => (
                        <tr key={assistant.assistant_id}>
                          <td className="font-medium">{assistant.name}</td>
                          <td>{assistant.telegram_username}</td>
                          <td>
                            <Badge variant="outline">{assistant.salary_type}</Badge>
                          </td>
                          <td>
                            <div className="text-sm">
                              <div className="font-medium">${assistant.fixed_salary?.toLocaleString()}</div>
                            </div>
                          </td>
                          <td>
                            <Badge className={getStatusColor(assistant.status)}>
                              {assistant.status}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAssistantForm(assistant)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingAssistant(assistant)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Sheets */}
      {isManagerFormOpen && (
        <ManagerFormSheet
          isOpen={isManagerFormOpen}
          onClose={() => setIsManagerFormOpen(false)}
          manager={editingManager}
          onSubmit={editingManager ? handleEditManager : handleAddManager}
        />
      )}

      {isAssistantFormOpen && (
        <AssistantFormSheet
          isOpen={isAssistantFormOpen}
          onClose={() => setIsAssistantFormOpen(false)}
          assistant={editingAssistant}
          onSubmit={editingAssistant ? handleEditAssistant : handleAddAssistant}
        />
      )}

      {/* Delete Dialogs */}
      {deletingManager && (
        <DeleteManagerDialog
          isOpen={!!deletingManager}
          onClose={() => setDeletingManager(null)}
          manager={deletingManager}
          onConfirm={handleDeleteManager}
        />
      )}

      {deletingAssistant && (
        <DeleteAssistantDialog
          isOpen={!!deletingAssistant}
          onClose={() => setDeletingAssistant(null)}
          assistant={deletingAssistant}
          onConfirm={handleDeleteAssistant}
        />
      )}

      {/* Team Leader Form and Dialog */}
      {editingLeader && (
        <LeaderFormSheet
          isOpen={!!editingLeader}
          onClose={() => setEditingLeader(null)}
          leader={editingLeader.team_leader_id && editingLeader.team_leader_id !== 'new' ? editingLeader : undefined}
          onSubmit={editingLeader.team_leader_id && editingLeader.team_leader_id !== 'new' ? handleEditLeader : handleAddLeader}
        />
      )}

      {deletingLeader && (
        <DeleteLeaderDialog
          isOpen={!!deletingLeader}
          onClose={() => setDeletingLeader(null)}
          leader={deletingLeader}
          onConfirm={handleDeleteLeader}
        />
      )}
    </div>
  );
}










