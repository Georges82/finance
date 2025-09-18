
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, DollarSign, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface Chatter {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

interface SalaryPeriod {
  id: string;
  name: string;
  week1Range: string;
  week2Range: string;
  week1Salary: number;
  week2Salary: number;
  totalSalary: number;
}

interface ChatterReport {
  chatterId: string;
  chatterName: string;
  periods: {
    [periodId: string]: SalaryPeriod;
  };
}

interface PeriodData {
  label: string;
  year: number;
  start: string;
  end: string;
  week1_start: string;
  week1_end: string;
  week2_start: string;
  week2_end: string;
}

interface ReportsSummaryItem {
  summary_id: string;
  chatter_id: string;
  period: string;
  year: number;
  week: number;
  hours_total: number;
  hourly_pay_total: number;
  commission_total: number;
  total_payout: number;
}



export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reports, setReports] = useState<ChatterReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod1, setSelectedPeriod1] = useState('August 1');
  const [selectedPeriod2, setSelectedPeriod2] = useState('August 2');
  const [availablePeriods, setAvailablePeriods] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsSummary, setReportsSummary] = useState<ReportsSummaryItem[]>([]);
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [periodsLoaded, setPeriodsLoaded] = useState(false);
  const [chattersLoaded, setChattersLoaded] = useState(false);

  // Load periods, chatters and reports data
  useEffect(() => {
    loadPeriods();
    loadChatters();
  }, []);

  // Load reports when periods change
  useEffect(() => {
    if (availablePeriods.length > 0 && chatters.length > 0) {
      loadReportsSummary();
    }
  }, [selectedPeriod1, selectedPeriod2, availablePeriods, chatters]);

  // Manage overall loading state
  useEffect(() => {
    if (periodsLoaded && chattersLoaded) {
      // Both periods and chatters are loaded, now load reports
      if (availablePeriods.length > 0 && chatters.length > 0) {
        loadReportsSummary();
      } else {
        // No data available, stop loading
        setLoading(false);
      }
    }
  }, [periodsLoaded, chattersLoaded, availablePeriods.length, chatters.length]);

  const loadPeriods = async () => {
    try {
      const response = await apiService.getReportsPeriods();
      console.log('Periods response:', response);
      if (response.status === 'Success' && response.data) {
        setAvailablePeriods(response.data.periods);
        console.log('Available periods:', response.data.periods);
        console.log('First few period labels:', response.data.periods.slice(0, 5).map(p => p.label));
        // Set default periods if not already set
        if (response.data.periods.length > 0) {
          if (!selectedPeriod1) setSelectedPeriod1(response.data.periods[0].label);
          if (!selectedPeriod2 && response.data.periods.length > 1) {
            setSelectedPeriod2(response.data.periods[1].label);
          }
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load periods",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading periods:', error);
      toast({
        title: "Error",
        description: "Failed to load periods. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPeriodsLoaded(true);
    }
  };

  const loadChatters = async () => {
    try {
      const response = await apiService.getAllChatters({ status_filter: 'active' });
      console.log('Chatters response:', response);
      if (response.status === 'Success' && response.data) {
        setChatters(response.data);
      }
    } catch (error) {
      console.error('Error loading chatters:', error);
      toast({
        title: "Error",
        description: "Failed to load chatters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChattersLoaded(true);
    }
  };

  const loadReportsSummary = async () => {
    try {
      // Load summary for both selected periods using standard format
      console.log('Selected periods:', { selectedPeriod1, selectedPeriod2 });
      
      const [period1Response, period2Response] = await Promise.all([
        apiService.getReportsSummary(selectedPeriod1),
        apiService.getReportsSummary(selectedPeriod2)
      ]);

      console.log('Reports summary responses:', { 
        period1: { status: period1Response.status, data: period1Response.data },
        period2: { status: period2Response.status, data: period2Response.data }
      });
      
      const period1Data = period1Response.status === 'Success' ? period1Response.data?.items || [] : [];
      const period2Data = period2Response.status === 'Success' ? period2Response.data?.items || [] : [];

      // Combine and organize data by chatter
      const chatterMap = new Map<string, ChatterReport>();

      // Process period 1 data
      period1Data.forEach((item: ReportsSummaryItem) => {
        if (!chatterMap.has(item.chatter_id)) {
          const chatter = chatters.find(c => c.chatter_id === item.chatter_id);
          chatterMap.set(item.chatter_id, {
            chatterId: item.chatter_id,
            chatterName: chatter?.name || `Chatter ${item.chatter_id}`,
            periods: {}
          });
        }
        
        const chatter = chatterMap.get(item.chatter_id)!;
        
        // Initialize period if it doesn't exist
        if (!chatter.periods[selectedPeriod1]) {
          chatter.periods[selectedPeriod1] = {
            id: selectedPeriod1,
            name: selectedPeriod1,
            week1Range: getWeekRange(selectedPeriod1, 1),
            week2Range: getWeekRange(selectedPeriod1, 2),
            week1Salary: 0,
            week2Salary: 0,
            totalSalary: 0
          };
        }
        
        // Accumulate weekly data instead of overwriting
        const period = chatter.periods[selectedPeriod1];
        if (item.week === 1) {
          period.week1Salary = item.total_payout;
        } else if (item.week === 2) {
          period.week2Salary = item.total_payout;
        }
        period.totalSalary = period.week1Salary + period.week2Salary;
      });

      // Process period 2 data
      period2Data.forEach((item: ReportsSummaryItem) => {
        if (!chatterMap.has(item.chatter_id)) {
          const chatter = chatters.find(c => c.chatter_id === item.chatter_id);
          chatterMap.set(item.chatter_id, {
            chatterId: item.chatter_id,
            chatterName: chatter?.name || `Chatter ${item.chatter_id}`,
            periods: {}
          });
        }
        
        const chatter = chatterMap.get(item.chatter_id)!;
        
        // Initialize period if it doesn't exist
        if (!chatter.periods[selectedPeriod2]) {
          chatter.periods[selectedPeriod2] = {
            id: selectedPeriod2,
            name: selectedPeriod2,
            week1Range: getWeekRange(selectedPeriod2, 1),
            week2Range: getWeekRange(selectedPeriod2, 2),
            week1Salary: 0,
            week2Salary: 0,
            totalSalary: 0
          };
        }
        
        // Accumulate weekly data instead of overwriting
        const period = chatter.periods[selectedPeriod2];
        if (item.week === 1) {
          period.week1Salary = item.total_payout;
        } else if (item.week === 2) {
          period.week2Salary = item.total_payout;
        }
        period.totalSalary = period.week1Salary + period.week2Salary;
      });

      // Ensure all chatters are included with zeroed periods if missing
      if (chatters.length > 0) {
        chatters.forEach((chatter) => {
          if (!chatterMap.has(chatter.chatter_id)) {
            chatterMap.set(chatter.chatter_id, {
              chatterId: chatter.chatter_id,
              chatterName: chatter.name,
              periods: {
                [selectedPeriod1]: {
                  id: selectedPeriod1,
                  name: selectedPeriod1,
                  week1Range: getWeekRange(selectedPeriod1, 1),
                  week2Range: getWeekRange(selectedPeriod1, 2),
                  week1Salary: 0,
                  week2Salary: 0,
                  totalSalary: 0
                },
                [selectedPeriod2]: {
                  id: selectedPeriod2,
                  name: selectedPeriod2,
                  week1Range: getWeekRange(selectedPeriod2, 1),
                  week2Range: getWeekRange(selectedPeriod2, 2),
                  week1Salary: 0,
                  week2Salary: 0,
                  totalSalary: 0
                }
              }
            });
          } else {
            const entry = chatterMap.get(chatter.chatter_id)!;
            if (!entry.periods[selectedPeriod1]) {
              entry.periods[selectedPeriod1] = {
                id: selectedPeriod1,
                name: selectedPeriod1,
                week1Range: getWeekRange(selectedPeriod1, 1),
                week2Range: getWeekRange(selectedPeriod1, 2),
                week1Salary: 0,
                week2Salary: 0,
                totalSalary: 0
              };
            }
            if (!entry.periods[selectedPeriod2]) {
              entry.periods[selectedPeriod2] = {
                id: selectedPeriod2,
                name: selectedPeriod2,
                week1Range: getWeekRange(selectedPeriod2, 1),
                week2Range: getWeekRange(selectedPeriod2, 2),
                week1Salary: 0,
                week2Salary: 0,
                totalSalary: 0
              };
            }
          }
        });
      }

      // If no reports data from summary, try to fetch individual chatter salary data
      if (chatterMap.size === 0 && chatters.length > 0) {
        console.log('No reports data found, fetching individual chatter salary data');
        
        // Fetch salary data for each chatter for both periods
        const chatterSalaryPromises = chatters.map(async (chatter) => {
          const [period1Salary, period2Salary] = await Promise.all([
            apiService.getChatterSalaryData(chatter.chatter_id, selectedPeriod1),
            apiService.getChatterSalaryData(chatter.chatter_id, selectedPeriod2)
          ]);
          
          return {
            chatter,
            period1Salary: period1Salary.status === 'Success' ? period1Salary.data : null,
            period2Salary: period2Salary.status === 'Success' ? period2Salary.data : null
          };
        });
        
        const chatterSalaryResults = await Promise.all(chatterSalaryPromises);
        
        chatterSalaryResults.forEach(({ chatter, period1Salary, period2Salary }) => {
          chatterMap.set(chatter.chatter_id, {
            chatterId: chatter.chatter_id,
            chatterName: chatter.name,
            periods: {
              [selectedPeriod1]: {
                id: selectedPeriod1,
                name: selectedPeriod1,
                week1Range: getWeekRange(selectedPeriod1, 1),
                week2Range: getWeekRange(selectedPeriod1, 2),
                week1Salary: period1Salary?.week1_salary || 0,
                week2Salary: period1Salary?.week2_salary || 0,
                totalSalary: period1Salary?.total_salary || 0
              },
              [selectedPeriod2]: {
                id: selectedPeriod2,
                name: selectedPeriod2,
                week1Range: getWeekRange(selectedPeriod2, 1),
                week2Range: getWeekRange(selectedPeriod2, 2),
                week1Salary: period2Salary?.week1_salary || 0,
                week2Salary: period2Salary?.week2_salary || 0,
                totalSalary: period2Salary?.total_salary || 0
              }
            }
          });
        });
      }

      // If no reports data, create entries for all chatters with empty periods
      if (chatterMap.size === 0 && chatters.length > 0) {
        console.log('No reports data found, creating entries for all chatters');
        chatters.forEach(chatter => {
          chatterMap.set(chatter.chatter_id, {
            chatterId: chatter.chatter_id,
            chatterName: chatter.name,
            periods: {
              [selectedPeriod1]: {
                id: selectedPeriod1,
                name: selectedPeriod1,
                week1Range: getWeekRange(selectedPeriod1, 1),
                week2Range: getWeekRange(selectedPeriod1, 2),
                week1Salary: 0,
                week2Salary: 0,
                totalSalary: 0
              },
              [selectedPeriod2]: {
                id: selectedPeriod2,
                name: selectedPeriod2,
                week1Range: getWeekRange(selectedPeriod2, 1),
                week2Range: getWeekRange(selectedPeriod2, 2),
                week1Salary: 0,
                week2Salary: 0,
                totalSalary: 0
              }
            }
          });
        });
      }

      setReports(Array.from(chatterMap.values()));
      setReportsSummary([...period1Data, ...period2Data]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading reports summary:', error);
      
      // Fallback: create entries for all chatters with empty periods
      if (chatters.length > 0) {
        console.log('Creating fallback entries for chatters');
        const chatterMap = new Map<string, ChatterReport>();
        chatters.forEach(chatter => {
          chatterMap.set(chatter.chatter_id, {
            chatterId: chatter.chatter_id,
            chatterName: chatter.name,
            periods: {
              [selectedPeriod1]: {
                id: selectedPeriod1,
                name: selectedPeriod1,
                week1Range: getWeekRange(selectedPeriod1, 1),
                week2Range: getWeekRange(selectedPeriod1, 2),
                week1Salary: 0,
                week2Salary: 0,
                totalSalary: 0
              },
              [selectedPeriod2]: {
                id: selectedPeriod2,
                name: selectedPeriod2,
                week1Range: getWeekRange(selectedPeriod2, 1),
                week2Range: getWeekRange(selectedPeriod2, 2),
                week1Salary: 0,
                week2Salary: 0,
                totalSalary: 0
              }
            }
          });
        });
        setReports(Array.from(chatterMap.values()));
      }
      
      setLoading(false);
      toast({
        title: "Warning",
        description: "Reports summary data unavailable. Showing chatters with empty salary data.",
        variant: "default",
      });
    }
  };

  const getWeekRange = (periodId: string, week: number): string => {
    const period = availablePeriods.find(p => p.label === periodId);
    if (!period) return '';
    
    if (week === 1) {
      return `${new Date(period.week1_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(period.week1_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return `${new Date(period.week2_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(period.week2_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  const filteredReports = reports.filter(report => 
    report.chatterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPeriodData = (report: ChatterReport, periodId: string) => {
    return report.periods[periodId] || {
      id: periodId,
      name: periodId,
      week1Range: getWeekRange(periodId, 1),
      week2Range: getWeekRange(periodId, 2),
      week1Salary: 0,
      week2Salary: 0,
      totalSalary: 0,
    };
  };

  const handleSalaryClick = (chatterId: string, periodId: string, week: 'week1' | 'week2') => {
    const chatter = chatters.find(c => c.chatter_id === chatterId) || { name: `Chatter ${chatterId}` };
    const chatterName = chatter.name;

    // Get the actual period data with date ranges
    const period = availablePeriods.find(p => p.label === periodId);

    if (!period) {
      toast({
        title: "Error",
        description: `Period "${periodId}" not found. Please try again.`,
        variant: "destructive",
      });
      return;
    }

    const weekNum = week === 'week1' ? 1 : 2;
    const startDate = week === 'week1' ? period?.week1_start : period?.week2_start;
    const endDate = week === 'week1' ? period?.week1_end : period?.week2_end;

    // Use periodId directly since it's already in standard format
    const periodKey = periodId;

    router.push(`/dashboard/reports/edit-week?chatterName=${encodeURIComponent(chatterName)}&periodKey=${encodeURIComponent(periodKey)}&week=${weekNum}&chatterId=${chatterId}&startDate=${startDate}&endDate=${endDate}&year=${period?.year || 2025}`);
  };

  const totalPeriod1Salary = filteredReports.reduce((sum, report) => {
    const period = getPeriodData(report, selectedPeriod1);
    return sum + period.totalSalary;
  }, 0);

  const totalPeriod2Salary = filteredReports.reduce((sum, report) => {
    const period = getPeriodData(report, selectedPeriod2);
    return sum + period.totalSalary;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Bi-weekly salary breakdown by chatter</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chatters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Active chatters
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period 1 Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPeriod1Salary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod1}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period 2 Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPeriod2Salary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod2}
            </p>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle>Salary Breakdown</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chatters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Chatter Name</TableHead>
                  <TableHead colSpan={3} className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Select value={selectedPeriod1} onValueChange={setSelectedPeriod1}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePeriods.map((period) => (
                            <SelectItem key={period.label} value={period.label}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getWeekRange(selectedPeriod1, 1)} - {getWeekRange(selectedPeriod1, 2)}
                    </div>
                  </TableHead>
                  <TableHead colSpan={3} className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Select value={selectedPeriod2} onValueChange={setSelectedPeriod2}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePeriods.map((period) => (
                            <SelectItem key={period.label} value={period.label}>
                              {period.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getWeekRange(selectedPeriod2, 1)} - {getWeekRange(selectedPeriod2, 2)}
                    </div>
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background"></TableHead>
                  <TableHead className="text-center">Week 1</TableHead>
                  <TableHead className="text-center">Week 2</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Week 1</TableHead>
                  <TableHead className="text-center">Week 2</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Loading reports...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No reports found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => {
                  const period1 = getPeriodData(report, selectedPeriod1);
                  const period2 = getPeriodData(report, selectedPeriod2);
                  
                  return (
                    <TableRow key={report.chatterId}>
                      <TableCell className="font-medium sticky left-0 bg-background">
                        {report.chatterName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          className="h-auto p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                          onClick={() => handleSalaryClick(report.chatterId, selectedPeriod1, 'week1')}
                          title={`Click to edit ${report.chatterName}'s Week 1 report`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">${period1.week1Salary.toLocaleString()}</span>
                            <span className="text-xs text-blue-500">Click to edit</span>
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          className="h-auto p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                          onClick={() => handleSalaryClick(report.chatterId, selectedPeriod1, 'week2')}
                          title={`Click to edit ${report.chatterName}'s Week 2 report`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">${period1.week2Salary.toLocaleString()}</span>
                            <span className="text-xs text-blue-500">Click to edit</span>
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        ${period1.totalSalary.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          className="h-auto p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                          onClick={() => handleSalaryClick(report.chatterId, selectedPeriod2, 'week1')}
                          title={`Click to edit ${report.chatterName}'s Week 1 report`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">${period2.week1Salary.toLocaleString()}</span>
                            <span className="text-xs text-blue-500">Click to edit</span>
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          className="h-auto p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                          onClick={() => handleSalaryClick(report.chatterId, selectedPeriod2, 'week2')}
                          title={`Click to edit ${report.chatterName}'s Week 2 report`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-medium">${period2.week2Salary.toLocaleString()}</span>
                            <span className="text-xs text-blue-500">Click to edit</span>
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        ${period2.totalSalary.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
