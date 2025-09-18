'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Plus, Trash2, Users, Calendar, Calculator } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface Model {
  model_id: string;
  modelName: string;
  clientAgencyName: string;
  teamLeader: string;
  referencedModels?: string[];
}

interface ModelEntry {
  id: string;
  modelId: string;
  modelName: string;
  clientAgencyName: string;
  teamLeader: string;
  hours: number;
  netSales: number;
  refNetSales?: number[];
  total: number;
}

interface WeekReportData {
  report_id: string;
  work_date: string;
  chatter_id: string;
  model_id: string;
  hours: number;
  net_sales: number;
  period: string;
  year: number;
  week: number;
  row_total: number;
  hourly_pay?: number;
  commission?: number;
  reference_children?: Array<{
    model_id: string;
    net_sales: number;
  }>;
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function EditWeekPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const chatterName = searchParams.get('chatterName') || 'Unknown Chatter';
  const periodKey = searchParams.get('periodKey') || 'aug1';
  const week = searchParams.get('week') || '1';
  const chatterId = searchParams.get('chatterId') || '1';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const year = searchParams.get('year') || '2025';

  const [dayEntries, setDayEntries] = useState(() => {
    // Use actual period data if available, otherwise fallback to calculated dates
    if (startDate && endDate && startDate !== '' && endDate !== '') {
      const start = new Date(startDate);
      // Validate the date is valid
      if (isNaN(start.getTime())) {
        // Invalid date, use fallback
        const weekNum = parseInt(week);
        const baseDate = weekNum === 1 ? 1 : 8;

        return weekDays.map((day, index) => ({
          id: `day-${index}`,
          date: `2025-08-${String(baseDate + index).padStart(2, '0')}`,
          models: [] as ModelEntry[]
        }));
      }

      return weekDays.map((day, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return {
          id: `day-${index}`,
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          models: [] as ModelEntry[]
        };
      });
    } else {
      // Fallback to calculated dates for Aug 2025
      const weekNum = parseInt(week);
      const baseDate = weekNum === 1 ? 1 : 8;

      return weekDays.map((day, index) => ({
        id: `day-${index}`,
        date: `2025-08-${String(baseDate + index).padStart(2, '0')}`,
        models: [] as ModelEntry[]
      }));
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [salaryResults, setSalaryResults] = useState<{ [date: string]: any }>({});

  // Load models from API
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await apiService.getAllModels({});
        console.log('Models response:', response);
        if (response.status === 'Success' && response.data) {
          console.log('Models data:', response.data);
          setModels(response.data);
        } else {
          // Still set loading to false even if no models
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading models:', error);
        toast({
          title: "Error",
          description: "Failed to load models. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadModels();
  }, [toast]);

  // Load existing report data if available
  useEffect(() => {
    const loadReportData = async () => {
      try {
        if (!chatterId || chatterId === '1') {
          setLoading(false);
          return;
        }

        const response = await apiService.getChatterWeeklyReport(chatterId, periodKey, parseInt(year), parseInt(week));
        console.log('Report data response:', response);

        if (response.status === 'Success' && response.data && response.data.length > 0) {
          // Build salaryResults from saved rows and populate dayEntries
          const tempSalaryResults: { [date: string]: any } = {};
          const updatedDayEntries = dayEntries.map(day => {
            const dayData = response.data.filter((item: WeekReportData) => item.work_date === day.date);

            // Prepare row breakdown to drive the UI "Total" per row and the day total
            if (dayData.length > 0) {
              const row_breakdown = dayData.map((item: WeekReportData) => {
                const model = models.find(m => m.model_id === item.model_id);
                const referencedModels = model?.referencedModels || [];
                const isReferenceModel = referencedModels.length > 0;
                
                // Extract refNetSales from reference_children if available
                let refNetSales: number[] = [];
                if (isReferenceModel && item.reference_children && item.reference_children.length > 0) {
                  // Map reference_children to refNetSales array based on referencedModels order
                  refNetSales = referencedModels.map((refName) => {
                    const child = item.reference_children.find((c: any) => {
                      const childModel = models.find(m => m.model_id === c.model_id);
                      return childModel?.modelName === refName;
                    });
                    return child ? child.net_sales : 0;
                  });
                } else if (isReferenceModel) {
                  // Initialize with zeros if no reference_children data
                  refNetSales = new Array(referencedModels.length).fill(0);
                }

                return {
                  model_id: item.model_id,
                  model_name: model?.modelName || `Model ${item.model_id}`,
                  hours: item.hours,
                  net_sales: item.net_sales,
                  // Use the individual calculated values from the database
                  hourly_pay: item.hourly_pay || 0,
                  commission: item.commission || 0,
                  total: item.row_total || 0,
                  is_reference_model: isReferenceModel,
                  refNetSales: refNetSales,
                  reference_children: item.reference_children || (isReferenceModel ? referencedModels.map((refName, index) => ({
                    model_id: models.find(m => m.modelName === refName)?.model_id || '',
                    model_name: refName,
                    net_sales: refNetSales[index] || 0,
                    hours: 0
                  })) : undefined)
                };
              });
              const total_salary = dayData.reduce((sum, it) => sum + (it.row_total || 0), 0);
              const total_hours = dayData.reduce((sum, it) => sum + (it.hours || 0), 0);
              const total_hourly_pay = dayData.reduce((sum, it) => sum + (it.hourly_pay || 0), 0);
              const total_commission = dayData.reduce((sum, it) => sum + (it.commission || 0), 0);
              
              // Calculate hourly rate (hourly_pay / total_hours)
              const hourly_rate = total_hours > 0 ? total_hourly_pay / total_hours : 0;

              tempSalaryResults[day.date] = {
                total_salary,
                hourly_pay: total_hourly_pay,
                commission_total: total_commission,
                net_earnings: total_salary,
                model_count: dayData.length,
                hourly_rate: hourly_rate,
                total_hours,
                row_breakdown,
              };
            }

            return {
              ...day,
              models: dayData.map((item: WeekReportData) => {
                const model = models.find(m => m.model_id === item.model_id);
                const referencedModels = model?.referencedModels || [];
                
                // Extract refNetSales from reference_children if available
                let refNetSales: number[] | undefined = undefined;
                if (item.reference_children && item.reference_children.length > 0) {
                  refNetSales = item.reference_children.map(child => child.net_sales);
                } else if (referencedModels.length > 0) {
                  // If no reference_children data, initialize with zeros
                  refNetSales = new Array(referencedModels.length).fill(0);
                }
                
                return {
                  id: `model-${item.model_id}-${day.date}`,
                  modelId: item.model_id,
                  modelName: model?.modelName || `Model ${item.model_id}`,
                  clientAgencyName: model?.clientAgencyName || '-',
                  teamLeader: model?.teamLeader || '-',
                  hours: item.hours,
                  netSales: item.net_sales,
                  refNetSales: refNetSales,
                  total: item.row_total
                };
              })
            };
          });
          setDayEntries(updatedDayEntries);
          setSalaryResults(tempSalaryResults);
        }
      } catch (error) {
        console.error('Error loading report data:', error);
        toast({
          title: "Error",
          description: "Failed to load existing report data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Only load report data if we have models, otherwise just set loading to false
    if (models.length > 0) {
      loadReportData();
    } else if (models.length === 0) {
      // If models failed to load, still set loading to false after a short delay
      const timer = setTimeout(() => setLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [chatterId, periodKey, week, year, models, toast]);

  const addModelEntry = (dayId: string) => {
    setDayEntries(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          models: [...day.models, {
            id: `model-${Date.now()}`,
            modelId: '',
            modelName: '',
            clientAgencyName: '',
            teamLeader: '',
            hours: 0,
            netSales: 0,
            total: 0
          }]
        };
      }
      return day;
    }));
  };

  const updateModelEntry = (dayId: string, modelId: string, field: string, value: any) => {
    setDayEntries(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          models: day.models.map(model => {
            if (model.id === modelId) {
              if (field === 'modelId') {
                const selectedModel = models.find(m => m.model_id === value);
                const refCount = (selectedModel as any)?.referencedModels?.length || 0;
                return {
                  ...model,
                  modelId: value,
                  modelName: selectedModel?.modelName || '',
                  clientAgencyName: selectedModel?.clientAgencyName || '',
                  teamLeader: selectedModel?.teamLeader || '',
                  refNetSales: refCount > 0 ? new Array(refCount).fill(0) : undefined,
                  total: (model.hours * 0) + model.netSales
                };
              }
              if (field.startsWith('refNetSales[')) {
                const idx = parseInt(field.match(/refNetSales\[(\d+)\]/)?.[1] || '-1', 10);
                if (idx >= 0) {
                  const nextRef = (model.refNetSales || []).slice();
                  nextRef[idx] = value;
                  const summedRef = nextRef.reduce((s, v) => s + (parseFloat(String(v)) || 0), 0);
                  return {
                    ...model,
                    refNetSales: nextRef,
                    netSales: summedRef,
                    total: (model.hours * 0) + summedRef
                  };
                }
              }
              return {
                ...model,
                [field]: value,
                total: field === 'hours' || field === 'netSales' ? (field === 'hours' ? value * 0 : model.hours * 0) + (field === 'netSales' ? value : model.netSales) : model.total
              };
            }
            return model;
          })
        };
      }
      return day;
    }));
  };

  const removeModelEntry = (dayId: string, modelId: string) => {
    setDayEntries(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          models: day.models.filter(model => model.id !== modelId)
        };
      }
      return day;
    }));
  };

  // Totals are computed by backend; keep helper only if needed for fallback
  const getDayTotal = (_models: ModelEntry[]) => 0;

  const handleSave = async () => {
    if (!chatterId) {
      toast({
        title: "Error",
        description: "Chatter ID is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        chatter_id: chatterId,
        period: periodKey,
        year: parseInt(year),
        week: parseInt(week),
        date_rows: dayEntries.map(day => ({
          date: day.date,
          rows: day.models.map(model => {
            const selectedModel = models.find(m => m.model_id === model.modelId);
            const referencedModels = selectedModel?.referencedModels || [];
            
            if (referencedModels.length > 0) {
              // Reference model - include reference_children
              const referenceChildren = referencedModels.map((refModelName, index) => {
                // Find the actual model ID for this model name
                const refModel = models.find(m => m.modelName === refModelName);
                return {
                  model_id: refModel?.model_id || refModelName, // Use model_id if found, fallback to name
                  hours: model.hours / referencedModels.length, // Distribute hours evenly
                  net_sales: model.refNetSales && model.refNetSales[index] !== undefined ? model.refNetSales[index] : 0
                };
              });
              
              return {
                model_id: model.modelId,
                hours: model.hours,
                net_sales: model.netSales,
                reference_children: referenceChildren
              };
            } else {
              // Regular model
              return {
                model_id: model.modelId,
                hours: model.hours,
                net_sales: model.netSales
              };
            }
          })
        }))
      };
      
      console.log('Save payload:', payload);

      const response = await apiService.saveChatterWeeklyReport(payload);
      if (response.status === 'Success') {
        toast({
          title: "Success",
          description: "Weekly report saved successfully.",
        });
        router.push('/dashboard/reports');
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save report.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateDay = async (dayIndex: number) => {
    if (!chatterId) {
      toast({
        title: "Error",
        description: "Chatter ID is required for calculation.",
        variant: "destructive",
      });
      return;
    }

    const dayEntry = dayEntries[dayIndex];
    if (!dayEntry || !dayEntry.models || dayEntry.models.length === 0) {
      toast({
        title: "Error",
        description: "No models assigned for this day. Cannot calculate.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalculating(true);
      const payload = {
        chatter_id: chatterId,
        work_date: dayEntry.date,
        work_rows: dayEntry.models.map(model => {
          const selectedModel = models.find(m => m.model_id === model.modelId);
          const referencedModels = selectedModel?.referencedModels || [];
          
          console.log('Processing model:', model);
          console.log('Selected model:', selectedModel);
          console.log('Referenced models:', referencedModels);
          console.log('Ref net sales:', model.refNetSales);
          
          if (referencedModels.length > 0 && model.refNetSales) {
            // Reference model - include reference_children
            const referenceChildren = referencedModels.map((refModelName, index) => {
              // Find the actual model ID for this model name
              const refModel = models.find(m => m.modelName === refModelName);
              return {
                model_id: refModel?.model_id || refModelName, // Use model_id if found, fallback to name
                hours: model.hours / referencedModels.length, // Distribute hours evenly
                net_sales: model.refNetSales[index] || 0
              };
            });
            
            console.log('Reference children:', referenceChildren);
            
            return {
              model_id: model.modelId,
              hours: model.hours,
              net_sales: model.netSales,
              reference_children: referenceChildren
            };
          } else {
            // Regular model
            return {
              model_id: model.modelId,
              hours: model.hours,
              net_sales: model.netSales
            };
          }
        })
      };
      
      console.log('Final payload:', payload);

      // Import the API function directly
      const { calculateDailySalary } = await import('@/lib/api');
      const response = await calculateDailySalary(payload);

      if (response.status === 'Success' && response.data) {
        setSalaryResults(prev => ({ ...prev, [dayEntry.date]: response.data }));
        toast({
          title: "Success",
          description: `Salary calculated for ${new Date(dayEntry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to calculate day.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error calculating day:', error);
      toast({
        title: "Error",
        description: "Failed to calculate day. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculateAllDays = async () => {
    if (!chatterId) {
      toast({
        title: "Error",
        description: "Chatter ID is required for calculation.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalculating(true);
      const results: { [date: string]: any } = {};

      for (const day of dayEntries) {
        if (day.models && day.models.length > 0) {
          const payload = {
            chatter_id: chatterId,
            work_date: day.date,
            work_rows: day.models.map(model => {
              const selectedModel = models.find(m => m.model_id === model.modelId);
              const referencedModels = selectedModel?.referencedModels || [];
              
              if (referencedModels.length > 0 && model.refNetSales) {
                // Reference model - include reference_children
                return {
                  model_id: model.modelId,
                  hours: model.hours,
                  net_sales: model.netSales,
                  reference_children: referencedModels.map((refModelName, index) => {
                    // Find the actual model ID for this model name
                    const refModel = models.find(m => m.modelName === refModelName);
                    return {
                      model_id: refModel?.model_id || refModelName, // Use model_id if found, fallback to name
                      hours: model.hours / referencedModels.length, // Distribute hours evenly
                      net_sales: model.refNetSales[index] || 0
                    };
                  })
                };
              } else {
                // Regular model
                return {
                  model_id: model.modelId,
                  hours: model.hours,
                  net_sales: model.netSales
                };
              }
            })
          };

          const { calculateDailySalary } = await import('@/lib/api');
          const response = await calculateDailySalary(payload);

          if (response.status === 'Success' && response.data) {
            results[day.date] = response.data;
          } else {
            results[day.date] = { error: response.message || 'Calculation failed' };
          }
        } else {
          results[day.date] = { error: 'No models assigned for this day' };
        }
      }
      setSalaryResults(results);
      toast({
        title: "Success",
        description: "All days calculated successfully.",
      });
    } catch (error) {
      console.error('Error calculating all days:', error);
      toast({
        title: "Error",
        description: "Failed to calculate all days. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/reports')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Reports</span>
        </Button>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCalculateAllDays}
            disabled={calculating}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Calculator className="h-4 w-4" />
            <span>Calculate All</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Report'}</span>
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{chatterName}'s Week {week} Report</h1>
        <p className="text-muted-foreground">
          {periodKey} - {year}
        </p>
      </div>

      <div className="space-y-6">
        {dayEntries.map((day, dayIndex) => (
          <div key={day.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {weekDays[dayIndex]} - {new Date(day.date).toLocaleDateString('en-GB')}
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleCalculateDay(dayIndex)}
                  disabled={calculating || !day.models || day.models.length === 0}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Calculate</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addModelEntry(day.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model Row
                </Button>
              </div>
            </div>

            {day.models.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No work entries for this day. Click "Add Model Row" to start adding assignments.
              </div>
            ) : (
              <>
                {/* Account Assignment Summary */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Models Assigned Today ({day.models.length} rows):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {day.models.map((model) => (
                      <div key={model.id} className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
                        <span className="font-medium">{model.modelName || 'Unassigned'}</span>
                        {model.modelName && (
                          <>
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span className="text-muted-foreground">{model.clientAgencyName}</span>
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span className="text-muted-foreground">TL: {model.teamLeader}</span>
                            <span className="text-blue-600 dark:text-blue-400">•</span>
                            <span className="text-muted-foreground">${model.netSales.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account/Model</TableHead>
                      <TableHead>Client Agency</TableHead>
                      <TableHead>Team Leader</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Net Sales</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {day.models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>
                          <Select
                            value={model.modelId}
                            onValueChange={(value) => updateModelEntry(day.id, model.id, 'modelId', value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                              {!models || models.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">No models available</div>
                              ) : (
                                models.map((modelOption) => (
                                  <SelectItem key={modelOption.model_id} value={modelOption.model_id}>
                                    {modelOption.modelName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {model.clientAgencyName || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {model.teamLeader || '-'}
                        </TableCell>
                        <TableCell>
                          <NumberInput
                            min="0"
                            max="24"
                            value={model.hours}
                            onChange={(e) => updateModelEntry(day.id, model.id, 'hours', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const selected = models.find(m => m.model_id === model.modelId) as any;
                            const refs: string[] = selected?.referencedModels || [];
                            const refCount = refs.length;
                            if (refCount > 0) {
                              const values = model.refNetSales && model.refNetSales.length === refCount
                                ? model.refNetSales
                                : new Array(refCount).fill(0);
                              return (
                                <div className="flex flex-col gap-2">
                                  {values.map((val, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">{refs[i] || `Ref ${i + 1}`}</span>
                                      <NumberInput
                                        min="0"
                                        value={val}
                                        onChange={(e) => updateModelEntry(day.id, model.id, `refNetSales[${i}]`, parseFloat(e.target.value) || 0)}
                                        className="w-24"
                                        placeholder={`Net ${i + 1}`}
                                      />
                                    </div>
                                  ))}
                                  <div className="text-xs text-muted-foreground">Total: ${values.reduce((s, v) => s + (parseFloat(String(v)) || 0), 0)}</div>
                                </div>
                              );
                            }
                            return (
                              <NumberInput
                                min="0"
                                value={model.netSales}
                                onChange={(e) => updateModelEntry(day.id, model.id, 'netSales', parseFloat(e.target.value) || 0)}
                                className="w-24"
                                placeholder="Net"
                              />
                            );
                          })()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {salaryResults[day.date]?.row_breakdown?.find((r: any) => r.model_id === model.modelId)
                            ? (() => {
                                const rowData = salaryResults[day.date].row_breakdown?.find((r: any) => r.model_id === model.modelId);
                                if (rowData?.is_reference_model) {
                                  // For reference models, show the total calculation
                                  return `$${rowData.hourly_pay}+$${rowData.commission}`;
                                } else if (rowData) {
                                  // For regular models, show single calculation
                                  return `$${rowData.hourly_pay}+$${rowData.commission}`;
                                }
                                return '-';
                              })()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeModelEntry(day.id, model.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="font-semibold text-right">
                        Day Total:
                      </TableCell>
                      <TableCell className="font-bold">
                        {salaryResults[day.date]?.total_salary !== undefined
                          ? `$${salaryResults[day.date].total_salary.toLocaleString()}`
                          : '-'}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Salary Results Display - Only show when calculation is done */}
                {salaryResults[day.date] && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
                    <h4 className="font-semibold text-blue-900 mb-2">Salary Calculation Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Salary:</span>
                        <div className="text-lg font-bold text-green-600">${salaryResults[day.date].total_salary}</div>
                      </div>
                      <div>
                        <span className="font-medium">Hourly Pay:</span>
                        <div>${salaryResults[day.date].hourly_pay}</div>
                      </div>
                      <div>
                        <span className="font-medium">Commission:</span>
                        <div>${salaryResults[day.date].commission_total}</div>
                      </div>
                      <div>
                        <span className="font-medium">Model Count:</span>
                        <div>{salaryResults[day.date].model_count}</div>
                      </div>
                      <div>
                        <span className="font-medium">Hourly Rate:</span>
                        <div>${salaryResults[day.date].hourly_rate}</div>
                      </div>
                      <div>
                        <span className="font-medium">Total Hours:</span>
                        <div>{salaryResults[day.date].total_hours}</div>
                      </div>
                    </div>

                    {/* Row Breakdown */}
                    <div className="mt-4">
                      <h5 className="font-medium text-blue-900 mb-2">Row Breakdown:</h5>
                      <div className="space-y-2">
                        {salaryResults[day.date].row_breakdown?.map((row: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm bg-white p-2 rounded border">
                            <span>{row.model_name}</span>
                            <div className="flex space-x-4">
                              <span>Hours: {row.hours}</span>
                              <span>Net Sales: ${row.net_sales}</span>
                              <span>Commission: ${row.commission}</span>
                              {row.is_reference_model && (
                                <span className="text-blue-600 font-medium">Reference Model</span>
                              )}
                            </div>
                          </div>
                        )) || <div className="text-sm text-muted-foreground">No breakdown data available</div>}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditWeekPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading...</span>
      </div>
    }>
      <EditWeekPageContent />
    </Suspense>
  );
}