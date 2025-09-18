'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, DollarSign, Users } from 'lucide-react';
import { ManagerFormSheet } from '@/components/dashboard/managers/manager-form-sheet';
import { AssistantFormSheet } from '@/components/dashboard/managers/assistant-form-sheet';
import { ManagerPeriodTable } from '@/components/dashboard/managers/manager-period-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssistantPeriodTable } from '@/components/dashboard/managers/assistant-period-table';
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

export default function ManagersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('managers');
  const [managers, setManagers] = useState<ManagerWithSalaries[]>([]);
  const [baseManagers, setBaseManagers] = useState<ManagerWithSalaries[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assistantsWithSalaries, setAssistantsWithSalaries] = useState<any[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState<Period[]>([]);
  const [selectedPeriod1Id, setSelectedPeriod1Id] = useState<string>('');
  const [selectedPeriod2Id, setSelectedPeriod2Id] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [salariesLoaded, setSalariesLoaded] = useState(false);
  
  // Form state management
  const [isManagerFormOpen, setIsManagerFormOpen] = useState(false);
  const [isAssistantFormOpen, setIsAssistantFormOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadPeriods();
    loadManagers();
    loadAssistants();
    loadTeamLeaders();
  }, []);

  // Ensure selected periods are valid strictly within their half-year groups
  useEffect(() => {
    const monthKey = (p: Period) => (p.id || p.name || '').toLowerCase().substring(0,3);
    const h1 = availablePeriods.filter(p => ['jan','feb','mar','apr','may','jun'].includes(monthKey(p)));
    const h2 = availablePeriods.filter(p => ['jul','aug','sep','oct','nov','dec'].includes(monthKey(p)));
    if (selectedPeriod1Id && !h1.some(p => p.id === selectedPeriod1Id)) {
      setSelectedPeriod1Id(h1[0]?.id || '');
    }
    if (selectedPeriod2Id && !h2.some(p => p.id === selectedPeriod2Id)) {
      setSelectedPeriod2Id(h2[0]?.id || '');
    }
  }, [availablePeriods, selectedPeriod1Id, selectedPeriod2Id]);

  // Reload managers when search term changes
  useEffect(() => {
    if (activeTab !== 'managers') return;
    if (selectedPeriod1Id || selectedPeriod2Id) {
      loadManagersWithSalaries();
    } else {
      loadManagers();
    }
  }, [searchTerm]);

  // Load assistants with salaries when tab is switched to assistants
  useEffect(() => {
    if (activeTab !== 'assistants') return;
    const periodIds = [selectedPeriod1Id, selectedPeriod2Id].filter(Boolean);
    (async () => {
      if (periodIds.length > 0) {
        const resp = await apiService.getAssistantsWithPeriodSalaries(periodIds, selectedYear);
        if ((resp as any).status === 'Success' && (resp as any).data) {
          setAssistantsWithSalaries(((resp as any).data.assistants) || []);
        }
      } else {
        // If no periods selected, load basic assistant data
        loadAssistants();
      }
    })();
  }, [activeTab]);

  // Reload assistants salaries when periods change
  useEffect(() => {
    if (activeTab !== 'assistants') return;
    const periodIds = [selectedPeriod1Id, selectedPeriod2Id].filter(Boolean);
    (async () => {
      if (periodIds.length > 0) {
        const resp = await apiService.getAssistantsWithPeriodSalaries(periodIds, selectedYear);
        if ((resp as any).status === 'Success' && (resp as any).data) {
          setAssistantsWithSalaries(((resp as any).data.assistants) || []);
        }
      }
    })();
  }, [selectedPeriod1Id, selectedPeriod2Id, selectedYear]);

  // Reload managers with salaries when selected periods change
  useEffect(() => {
    if (activeTab === 'managers' && (selectedPeriod1Id || selectedPeriod2Id)) {
      loadManagersWithSalaries();
    }
  }, [selectedPeriod1Id, selectedPeriod2Id, activeTab]);

  // Ensure initial salaries fetch after base managers and period defaults are ready
  useEffect(() => {
    if (activeTab !== 'managers') return;
    if (baseManagers.length === 0) return;
    if (!selectedPeriod1Id && !selectedPeriod2Id) return;
    if (salariesLoaded) return;
    loadManagersWithSalaries();
  }, [baseManagers.length, selectedPeriod1Id, selectedPeriod2Id, activeTab, salariesLoaded]);

  const loadPeriods = async () => {
    try {
      setLoadingPeriods(true);
      const resp = await apiService.getManagerSalaryPeriods();
      if ((resp as any).status === 'Success' && (resp as any).data) {
        const periods = (resp as any).data.periods as Period[];
        setAvailablePeriods(periods);
        setSelectedYear((resp as any).data.year || new Date().getFullYear());
        // Strict split: Period 1 (Jan–Jun), Period 2 (Jul–Dec)
        const monthKey = (p: Period) => (p.id || p.name || '').toLowerCase().substring(0,3);
        const half1 = periods.filter(p => ['jan','feb','mar','apr','may','jun'].includes(monthKey(p)));
        const half2 = periods.filter(p => ['jul','aug','sep','oct','nov','dec'].includes(monthKey(p)));
        setSelectedPeriod1Id(half1[0]?.id || '');
        setSelectedPeriod2Id(half2[0]?.id || '');
      }
    } catch (e) {
      console.error('Error loading periods:', e);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const loadManagers = async () => {
    try {
      // Always load all managers for the table display
      const response = await apiService.getAllManagers({
        limit: 100,
        offset: 0,
        query: searchTerm,
        sort: 'desc',
        sort_by: 'created_at'
      });
      
      if (response.status === 'Success' && response.data) {
        // Add empty period_salaries to each manager for consistency
        const managersWithSalaries = response.data.map(m => ({ ...m, period_salaries: {} }));
        setBaseManagers(managersWithSalaries);
        // Do not overwrite the salary-enriched list if periods are selected
        if (!selectedPeriod1Id && !selectedPeriod2Id && !salariesLoaded) {
          setManagers(managersWithSalaries);
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load managers",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading managers:', error);
      toast({
        title: "Error",
        description: "Failed to load managers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadManagersWithSalaries = async () => {
    try {
      const periodIds = [selectedPeriod1Id, selectedPeriod2Id].filter(Boolean);
      if (periodIds.length === 0) return;
      setLoading(true);
      setSalariesLoaded(false);
      const resp = await apiService.getManagersWithPeriodSalaries(periodIds, selectedYear);
      if ((resp as any).status === 'Success' && (resp as any).data) {
        const payload = (resp as any).data;
        const salaryById: Record<string, any> = {};
        (payload.managers || []).forEach((m: any) => {
          salaryById[m.manager_id] = m.period_salaries || {};
        });
        // Merge with base list and PRESERVE any existing in-memory statuses to avoid flicker
        const sourceList = baseManagers.length ? baseManagers : managers;
        const merged = sourceList.map((bm) => {
          const existingPS = (managers.find(m => m.manager_id === bm.manager_id)?.period_salaries) || {};
          const fetchedPS = salaryById[bm.manager_id] || {};
          return {
            ...bm,
            period_salaries: {
              ...existingPS,
              ...fetchedPS
            }
          };
        });
        setManagers(merged);
        setSalariesLoaded(true);
      }
    } catch (e) {
      console.error('Error loading managers with salaries:', e);
      // On error, keep base managers to still render rows with zeros
      if (baseManagers.length) {
        setManagers(baseManagers);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAssistants = async () => {
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
        // If periods are selected, also fetch assistants with salaries
        const periodIds = [selectedPeriod1Id, selectedPeriod2Id].filter(Boolean);
        if (periodIds.length > 0) {
          const resp2 = await apiService.getAssistantsWithPeriodSalaries(periodIds, selectedYear);
          if ((resp2 as any).status === 'Success' && (resp2 as any).data) {
            setAssistantsWithSalaries(((resp2 as any).data.assistants) || []);
          }
        } else {
          setAssistantsWithSalaries([]);
        }
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
    }
  };

  const loadTeamLeaders = async () => {
    try {
      const response = await apiService.getAllTeamLeaders();
      
      if (response.status === 'Success' && response.data) {
        setTeamLeaders(response.data);
      }
    } catch (error) {
      console.error('Error loading team leaders:', error);
    }
  };

  // Period management removed - no longer needed for managers table

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

  // Team Leaders filtering and calculations
  const filteredLeaders = teamLeaders.filter(leader => 
    leader.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    leader.telegram_username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalLeaders = teamLeaders.length;
  const activeLeaders = teamLeaders.filter(l => l.status === 'Active').length;
  const totalLeaderPeriodSalary = managers
    .filter(m => m.role === 'Team Leader')
    .reduce((sum, m) => {
      const periodTotal = Object.values(m.period_salaries || {}).reduce((acc, ps) => acc + (ps as any).total_salary, 0);
      return sum + periodTotal;
    }, 0);

  // Assistants filtering and calculations
  const filteredAssistants = assistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assistant.telegram_username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalAssistants = assistants.length;
  const activeAssistants = assistants.filter(a => a.status === 'Active').length;
  const totalAssistantSalary = assistantsWithSalaries.reduce((sum, assistant) => {
    // Calculate total from period salaries if available, otherwise use fixed salary
    if (assistant.period_salaries && Object.keys(assistant.period_salaries).length > 0) {
      const periodTotal = Object.values(assistant.period_salaries).reduce((periodSum, salary) => {
        return periodSum + (salary.total_salary || 0);
      }, 0);
      return sum + periodTotal;
    }
    // Fallback to fixed salary if no period salaries are available
    return sum + (assistant.fixed_salary || 0);
  }, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (amount: number) => `$${amount.toLocaleString()}`;

  const handleDeleteManager = async (manager: Manager) => {
    try {
      const res = await apiService.deleteManager(manager.manager_id);
      if (res.status === 'Success') {
        toast({ title: 'Deleted', description: `${manager.name} deleted.` });
        loadManagersWithSalaries();
      } else {
        toast({ title: 'Error', description: res.message || 'Failed to delete', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete manager', variant: 'destructive' });
    }
  };

  const handleUpdatePaymentStatus = async (managerId: string, periodId: string, status: 'Paid' | 'Not Paid') => {
    try {
      console.log('Updating manager payment status', { managerId, periodId, status, year: selectedYear });
      const params = new URLSearchParams({
        manager_id: managerId,
        period: periodId,
        year: selectedYear.toString(),
        payment_status: status
      });
      await (apiService as any)['request'](`/manager/salary/payment-status?${params.toString()}`, { method: 'PUT' });
      console.log('Manager payment status updated OK');
      setManagers(prev => prev.map(m => {
        if (m.manager_id !== managerId) return m;
        const current = (m.period_salaries && m.period_salaries[periodId]) || {
          week1_salary: 0,
          week2_salary: 0,
          total_salary: 0,
          payment_status: 'Not Paid' as const
        };
        return {
          ...m,
          period_salaries: {
            ...(m.period_salaries || {}),
            [periodId]: { ...current, payment_status: status }
          }
        };
      }));
    } catch (e) {
      console.error('Failed to update payment status', e);
      toast({ title: 'Error', description: 'Failed to update payment status', variant: 'destructive' });
    }
  };

  const handleUpdateAssistantPaymentStatus = async (assistantId: string, periodId: string, status: 'Paid' | 'Not Paid') => {
    try {
      await apiService.updateAssistantPaymentStatus(assistantId, periodId, selectedYear, status);
      setAssistantsWithSalaries(prev => prev.map(a => {
        if (a.assistant_id !== assistantId) return a;
        const current = (a.period_salaries && a.period_salaries[periodId]) || {
          week1_salary: 0,
          week2_salary: 0,
          total_salary: 0,
          payment_status: 'Not Paid' as const
        };
        return {
          ...a,
          period_salaries: {
            ...(a.period_salaries || {}),
            [periodId]: { ...current, payment_status: status }
          }
        };
      }));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update payment status', variant: 'destructive' });
    }
  };

  // Form handlers
  const handleAddManager = () => {
    setEditingManager(null);
    setIsManagerFormOpen(true);
  };

  const handleEditManager = (manager: Manager) => {
    setEditingManager(manager);
    setIsManagerFormOpen(true);
  };

  const handleEditTeamLeader = (leader: TeamLeader) => {
    setEditingManager(leader as Manager); // Cast to Manager since they share the same structure
    setIsManagerFormOpen(true);
  };

  const handleAddAssistant = () => {
    setEditingAssistant(null);
    setIsAssistantFormOpen(true);
  };

  const handleEditAssistant = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setIsAssistantFormOpen(true);
  };

  const getAddButtonLabel = () => {
    switch (activeTab) {
      case 'managers':
        return 'Add Manager';
      case 'team_leaders':
        return 'Add Team Leader';
      case 'assistants':
        return 'Add Assistant';
      default:
        return 'Add';
    }
  };

  const handleAddClick = () => {
    switch (activeTab) {
      case 'managers':
        handleAddManager();
        break;
      case 'team_leaders':
        handleAddManager(); // Use manager form for team leaders
        break;
      case 'assistants':
        handleAddAssistant();
        break;
    }
  };

  const getFormType = () => {
    switch (activeTab) {
      case 'managers':
        return 'manager';
      case 'team_leaders':
        return 'team_leader';
      default:
        return 'manager';
    }
  };

  // getPeriodData function removed - no longer needed for managers table

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
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {getAddButtonLabel()}
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
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? 'Loading...' : 'Ready'}</div>
                <p className="text-xs text-muted-foreground">
                  Data status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Period Selectors (match chatter page style) */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Period 1</span>
              <Select value={selectedPeriod1Id} onValueChange={setSelectedPeriod1Id}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods
                    .filter((p) => {
                      const m = (p.id || p.name || '').toLowerCase().substring(0,3);
                      return ['jan','feb','mar','apr','may','jun'].includes(m);
                    })
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Period 2</span>
              <Select value={selectedPeriod2Id} onValueChange={setSelectedPeriod2Id}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods
                    .filter((p) => {
                      const m = (p.id || p.name || '').toLowerCase().substring(0,3);
                      return ['jul','aug','sep','oct','nov','dec'].includes(m);
                    })
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
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
          </div>

          {/* Managers Table with dynamic periods */}
          <Card>
            <CardHeader>
              <CardTitle>Managers</CardTitle>
            </CardHeader>
            <CardContent>
              {(!selectedPeriod1Id && !selectedPeriod2Id) || !salariesLoaded ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Loading salaries...
                </div>
              ) : (
                <ManagerPeriodTable
                  key={`${selectedPeriod1Id}-${selectedPeriod2Id}-${salariesLoaded}`}
                  managers={filteredManagers as any}
                  selectedPeriods={[selectedPeriod1Id, selectedPeriod2Id]
                    .filter(Boolean)
                    .map((id) => ({ id, name: availablePeriods.find(p => p.id === id)?.name || id }))}
                  loading={loading || loadingPeriods}
                  onEditManager={handleEditManager}
                  onDeleteManager={handleDeleteManager}
                  getStatusColor={getStatusColor}
                  onUpdatePaymentStatus={handleUpdatePaymentStatus}
                />
              )}
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
                <div className="text-2xl font-bold">{formatSalary(totalLeaderPeriodSalary)}</div>
                <p className="text-xs text-muted-foreground">Current period</p>
              </CardContent>
            </Card>
          </div>

          {/* Period Selectors (match manager tab style) */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Period 1</span>
              <Select value={selectedPeriod1Id} onValueChange={setSelectedPeriod1Id}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods
                    .filter((p) => {
                      const m = (p.id || p.name || '').toLowerCase().substring(0,3);
                      return ['jan','feb','mar','apr','may','jun'].includes(m);
                    })
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Period 2</span>
              <Select value={selectedPeriod2Id} onValueChange={setSelectedPeriod2Id}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods
                    .filter((p) => {
                      const m = (p.id || p.name || '').toLowerCase().substring(0,3);
                      return ['jul','aug','sep','oct','nov','dec'].includes(m);
                    })
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team Leaders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Leaders</CardTitle>
            </CardHeader>
            <CardContent>
              {(!selectedPeriod1Id && !selectedPeriod2Id) || !salariesLoaded ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Loading salaries...
                </div>
              ) : (
                <ManagerPeriodTable
                  key={`tl-${selectedPeriod1Id}-${selectedPeriod2Id}-${salariesLoaded}`}
                  managers={filteredManagers as any}
                  selectedPeriods={[selectedPeriod1Id, selectedPeriod2Id]
                    .filter(Boolean)
                    .map((id) => ({ id, name: availablePeriods.find(p => p.id === id)?.name || id }))}
                  loading={loading || loadingPeriods}
                  onEditManager={(m) => handleEditTeamLeader(m as any)}
                  onDeleteManager={() => {}}
                  getStatusColor={getStatusColor}
                  onUpdatePaymentStatus={handleUpdatePaymentStatus}
                  roleFilter="Team Leader"
                />
              )}
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
          </div>

          {/* Period Selectors (match manager tab style) */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Period 1</span>
              <Select value={selectedPeriod1Id} onValueChange={setSelectedPeriod1Id}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods
                    .filter((p) => {
                      const m = (p.id || p.name || '').toLowerCase().substring(0,3);
                      return ['jan','feb','mar','apr','may','jun'].includes(m);
                    })
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Period 2</span>
              <Select value={selectedPeriod2Id} onValueChange={setSelectedPeriod2Id}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods
                    .filter((p) => {
                      const m = (p.id || p.name || '').toLowerCase().substring(0,3);
                      return ['jul','aug','sep','oct','nov','dec'].includes(m);
                    })
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assistants Table with dynamic periods */}
          <Card>
            <CardHeader>
              <CardTitle>Assistants</CardTitle>
            </CardHeader>
            <CardContent>
              {(!selectedPeriod1Id && !selectedPeriod2Id) || !salariesLoaded ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Loading salaries...
                </div>
              ) : (
                <AssistantPeriodTable
                  assistants={assistantsWithSalaries as any}
                  selectedPeriods={[selectedPeriod1Id, selectedPeriod2Id]
                    .filter(Boolean)
                    .map((id) => ({ id, name: availablePeriods.find(p => p.id === id)?.name || id }))}
                  loading={loading || loadingPeriods}
                  getStatusColor={getStatusColor}
                  onUpdatePaymentStatus={handleUpdateAssistantPaymentStatus}
                  onEditAssistant={handleEditAssistant}
                  onDeleteAssistant={async (a) => {
                    const res = await apiService.deleteAssistant(a.assistant_id);
                    if (res.status === 'Success') {
                      toast({ title: 'Deleted', description: `${a.name} deleted.` });
                      setAssistants(prev => prev.filter(x => x.assistant_id !== a.assistant_id));
                      setAssistantsWithSalaries(prev => prev.filter(x => x.assistant_id !== a.assistant_id));
                    } else {
                      toast({ title: 'Error', description: res.message || 'Failed to delete', variant: 'destructive' });
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Components */}
      <ManagerFormSheet
        open={isManagerFormOpen}
        onOpenChange={setIsManagerFormOpen}
        manager={editingManager}
        type={getFormType()}
        onSave={async (data) => {
          try {
            if (editingManager) {
              // Update existing manager
              const response = await apiService.updateManager(editingManager.manager_id, {
                name: data.name,
                role: data.role,
                telegram_username: data.telegramUsername,
                status: data.status,
                salary_type: 'Commission-based',
                revenue_threshold: data.revenueThreshold,
                commission_rate: data.commissionRate,
                fixed_salary: data.fixedSalary,
              });
              
              if (response.status === 'Success') {
                toast({
                  title: "Success",
                  description: `${data.role} updated successfully!`,
                });
                // Optimistically update in-memory managers and baseManagers
                setManagers(prev => prev.map(m => m.manager_id === editingManager.manager_id ? ({
                  ...m,
                  name: data.name,
                  role: data.role,
                  telegram_username: data.telegramUsername,
                  status: data.status,
                  salary_type: 'Commission-based',
                  revenue_threshold: data.revenueThreshold,
                  commission_rate: data.commissionRate,
                  fixed_salary: data.fixedSalary,
                }) : m));
                setBaseManagers(prev => prev.map(m => m.manager_id === editingManager.manager_id ? ({
                  ...m,
                  name: data.name,
                  role: data.role,
                  telegram_username: data.telegramUsername,
                  status: data.status,
                  salary_type: 'Commission-based',
                  revenue_threshold: data.revenueThreshold,
                  commission_rate: data.commissionRate,
                  fixed_salary: data.fixedSalary,
                }) : m));
              } else {
                toast({
                  title: "Error",
                  description: response.message || "Failed to update manager",
                  variant: "destructive",
                });
                return;
              }
            } else {
              // Create new manager
              const response = await apiService.createManager({
                name: data.name,
                role: data.role,
                telegram_username: data.telegramUsername,
                status: data.status,
                salary_type: 'Commission-based',
                revenue_threshold: data.revenueThreshold,
                commission_rate: data.commissionRate,
                fixed_salary: data.fixedSalary,
              });
              
              if (response.status === 'Success') {
                toast({
                  title: "Success",
                  description: `${data.role} created successfully!`,
                });
                // Optimistically add new manager to lists
                const newManager: ManagerWithSalaries = {
                  manager_id: (response.data as any)?.manager_id || `temp_${Date.now()}`,
                  name: data.name,
                  role: data.role,
                  telegram_username: data.telegramUsername,
                  status: data.status,
                  salary_type: 'Commission-based',
                  revenue_threshold: data.revenueThreshold,
                  commission_rate: data.commissionRate,
                  fixed_salary: data.fixedSalary,
                  assigned_models: [],
                  period_salaries: {}
                } as ManagerWithSalaries;
                setBaseManagers(prev => [newManager, ...prev]);
                setManagers(prev => [newManager, ...prev]);
              } else {
                toast({
                  title: "Error",
                  description: response.message || "Failed to create manager",
                  variant: "destructive",
                });
                return;
              }
            }
            
            setIsManagerFormOpen(false);
            setEditingManager(null);
            // Keep UI responsive without refetch conflict; refresh team leaders if needed
            loadTeamLeaders();
          } catch (error) {
            console.error('Error saving manager:', error);
            toast({
              title: "Error",
              description: "An unexpected error occurred. Please try again.",
              variant: "destructive",
            });
          }
        }}
      />

      <AssistantFormSheet
        open={isAssistantFormOpen}
        onOpenChange={setIsAssistantFormOpen}
        assistant={editingAssistant}
        onSubmit={async (data) => {
          try {
            if (editingAssistant) {
              // Update existing assistant
              const response = await apiService.updateAssistant(editingAssistant.assistant_id, {
                name: data.fullName,
                telegram_username: data.telegramUsername,
                status: data.status,
                fixed_salary: data.fixedSalary,
                salary_period: data.salaryPeriod,
              });
              
              if (response.status === 'Success') {
                toast({
                  title: "Success",
                  description: "Assistant updated successfully!",
                });
              } else {
                toast({
                  title: "Error",
                  description: response.message || "Failed to update assistant",
                  variant: "destructive",
                });
                return;
              }
            } else {
              // Create new assistant
              const response = await apiService.createAssistant({
                name: data.fullName,
                telegram_username: data.telegramUsername,
                status: data.status,
                salary_type: 'Fixed',
                fixed_salary: data.fixedSalary,
                salary_period: data.salaryPeriod,
              });
              
              if (response.status === 'Success') {
                toast({
                  title: "Success",
                  description: "Assistant created successfully!",
                });
              } else {
                toast({
                  title: "Error",
                  description: response.message || "Failed to create assistant",
                  variant: "destructive",
                });
                return;
              }
            }
            
            setIsAssistantFormOpen(false);
            setEditingAssistant(null);
            loadAssistants();
          } catch (error) {
            console.error('Error saving assistant:', error);
            toast({
              title: "Error",
              description: "An unexpected error occurred. Please try again.",
              variant: "destructive",
            });
          }
        }}
      />
    </div>
  );
}
