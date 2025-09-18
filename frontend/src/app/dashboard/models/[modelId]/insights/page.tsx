
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Users, Activity } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { InsightsCalculator } from '@/lib/insights-calculations';
import { SinglePeriodHistogram } from '@/components/ui/financial-histogram';

interface ModelInsightsData {
  revenue: number;
  real_revenue: number;
  cost: number;
  profit: number;
  real_profit: number;
  metadata?: {
    scope_type: string;
    month?: string;
    period?: string;
    periods_included?: string[];
  };
}

interface ModelData {
  model_id: string;
  model_name: string;
  manager_name?: string;
  team_leader?: string;
  client_agency_name?: string;
  earnings_type?: string;
  cut_logic?: any;
  referenced_models?: string[];
}

interface CostBreakdown {
  chatter_cost: number;
  tl_cost: number;
  manager_cost: number;
  assistant_cost: number;
  total_cost: number;
}

interface WeeklySummaryRow {
  label: string;
  period: string;
  week: number;
  revenue: number;
  real_revenue: number;
  cost: number;
  profit: number;
  real_profit: number;
}

export default function ModelInsightsPage() {
  const params = useParams();
  const modelId = params.modelId as string;
  const { toast } = useToast();
  
  const [selectedPeriod, setSelectedPeriod] = useState('January 1');
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [insightsData, setInsightsData] = useState<ModelInsightsData | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [netAmount, setNetAmount] = useState(0);
  const [invoiceValue, setInvoiceValue] = useState(0);
  const [invoiceStatus, setInvoiceStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [year] = useState<number>(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refNetSales, setRefNetSales] = useState<number[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [workReports, setWorkReports] = useState<any[]>([]);

  const parseWeekPeriod = (label: string): { period: string; week?: number } => {
    if (label.includes(' - Week ')) {
      const [p, wk] = label.split(' - Week ');
      const weekNum = parseInt(wk, 10);
      return { period: p, week: isNaN(weekNum) ? undefined : weekNum };
    }
    return { period: label };
  };

  // Available periods for selection (reuse same as Insights page)
  const availablePeriods = InsightsCalculator.getAvailablePeriods();

  useEffect(() => {
    loadModelData();
    loadInsightsData();
    loadWeeklySummary();
    // loadWorkReports(); // Commented out - manual input preferred for insights
  }, [modelId, selectedPeriod]);

  const loadModelData = async () => {
    try {
      const response = await apiService.getModelDetails(modelId);
      if (response.status === 'Success' && response.data) {
        const d: any = response.data;
        // Normalize camelCase/snake_case fields from backend
        setModelData({
          model_id: d.model_id || d.modelId,
          model_name: d.model_name || d.modelName,
          manager_name: d.manager_name || d.managerName,
          team_leader: d.team_leader || d.teamLeader,
          client_agency_name: d.client_agency_name || d.clientAgencyName,
          earnings_type: d.earnings_type || d.earningsType,
          cut_logic: d.cut_logic || d.cutLogic,
          referenced_models: d.referenced_models || d.referencedModels || [],
        });
      }
      // Load all models for reference children ID mapping
      try {
        const list = await apiService.getAllModels({});
        if (list.status === 'Success' && Array.isArray(list.data)) {
          setAllModels(list.data as any[]);
        }
      } catch {}
    } catch (error) {
      console.error('Error loading model data:', error);
      toast({
        title: "Error",
        description: "Failed to load model data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadInsightsData = async () => {
    try {
      setLoading(true);
      
      // Load model-specific insights
      const { period, week } = parseWeekPeriod(selectedPeriod);
      const insightsResponse = await apiService.getModelInsights(modelId, period, year, week);
      if (insightsResponse.status === 'Success' && insightsResponse.data) {
        setInsightsData(insightsResponse.data);
      }

      // Auto-populate Net Amount and Invoice Value based on period scope
      await populatePeriodData();

      // Load real cost breakdown from backend
      const costRes = await apiService.getModelCostBreakdown(modelId, period, year, week);
      if (costRes.status === 'Success' && costRes.data) {
        setCostBreakdown({
          chatter_cost: costRes.data.chatter_cost,
          tl_cost: costRes.data.tl_cost,
          manager_cost: costRes.data.manager_cost,
          assistant_cost: costRes.data.assistant_cost,
          total_cost: costRes.data.total_cost,
        });
      }

    } catch (error) {
      console.error('Error loading insights data:', error);
      toast({
        title: "Error",
        description: "Failed to load insights data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const populatePeriodData = async () => {
    try {
      const isRef = Array.isArray(modelData?.referenced_models) && (modelData!.referenced_models!.length > 0);
      
      if (isRef) {
        // For reference models, populate child net sales based on period scope
        await populateReferenceModelData();
      } else {
        // For regular models, populate net amount and invoice value based on period scope
        await populateRegularModelData();
      }
    } catch (error) {
      console.error('Error populating period data:', error);
    }
  };

  const populateReferenceModelData = async () => {
    try {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const isMonth = months.includes(selectedPeriod);
      const isHalf = !selectedPeriod.includes(' - Week ') && !isMonth;
      
      let targetPeriods: Array<{ period: string; week?: number }> = [];
      
      if (selectedPeriod.includes(' - Week ')) {
        // Specific week: only that week
        const { period, week } = parseWeekPeriod(selectedPeriod);
        targetPeriods = [{ period, week }];
      } else if (isHalf) {
        // Half-month: both weeks of that half
        targetPeriods = [
          { period: selectedPeriod, week: 1 },
          { period: selectedPeriod, week: 2 }
        ];
      } else if (isMonth) {
        // Full month: all 4 weeks
        const half1 = `${selectedPeriod} 1`;
        const half2 = `${selectedPeriod} 2`;
        targetPeriods = [
          { period: half1, week: 1 },
          { period: half1, week: 2 },
          { period: half2, week: 1 },
          { period: half2, week: 2 }
        ];
      }

      // Fetch invoices for all target periods
      const invoicePromises = targetPeriods.map(t => 
        apiService.listInvoices({ model_id: modelId, period: t.period, year, ...(t.week && { week: t.week }) })
      );
      const invoiceResults = await Promise.all(invoicePromises);
      
      // Sum up net amounts and invoice values across all periods
      let totalNetAmount = 0;
      let totalInvoiceValue = 0;
      let hasPaidInvoice = false;
      
      // Initialize child net sales arrays
      const childNetSales: number[] = new Array(modelData!.referenced_models!.length).fill(0);
      
      invoiceResults.forEach((result, idx) => {
        if (result.status === 'Success' && Array.isArray(result.data)) {
          const inv = result.data.find((i: any) => 
            i.model_id === modelId && 
            i.period === targetPeriods[idx].period && 
            i.year === year && 
            ((i.week || null) === (targetPeriods[idx].week || null))
          );
          
          if (inv) {
            totalNetAmount += Number(inv.net_amount || 0);
            totalInvoiceValue += Number(inv.invoice_amount || 0);
            if (inv.status === 'Paid') hasPaidInvoice = true;
            
            // Parse reference children nets from invoice notes
            if (inv.notes) {
              try {
                const parsed = JSON.parse(inv.notes);
                const children = Array.isArray(parsed?.reference_children) ? parsed.reference_children : [];
                (modelData!.referenced_models || []).forEach((name, childIdx) => {
                  const childId = (allModels.find((m: any) => (m.modelName || m.model_name) === name) || {}).model_id;
                  const hit = children.find((c: any) => c.model_id === childId);
                  childNetSales[childIdx] += Number(hit?.net_sales || 0);
                });
              } catch {}
            }
          }
        }
      });
      
      // Commented out work reports loading - manual input preferred for insights
      // If no data from invoices, try to get from work reports
      // if (childNetSales.length === 0 || childNetSales.every(n => n === 0)) {
      //   const { period, week } = parseWeekPeriod(selectedPeriod);
      //   const modelWorkReport = workReports.find((report: any) => 
      //     report.model_id === modelId && 
      //     report.period === period &&
      //     ((report.week || null) === (week || null))
      //   );
      //   
      //   if (modelWorkReport?.reference_children) {
      //     try {
      //       let referenceChildren = modelWorkReport.reference_children;
      //       // Handle potential double-encoded JSON
      //       if (typeof referenceChildren === 'string') {
      //         referenceChildren = JSON.parse(referenceChildren);
      //         if (typeof referenceChildren === 'string') {
      //           referenceChildren = JSON.parse(referenceChildren);
      //         }
      //       }
      //       
      //       if (Array.isArray(referenceChildren)) {
      //         (modelData!.referenced_models || []).forEach((name, childIdx) => {
      //           const childId = (allModels.find((m: any) => (m.modelName || m.model_name) === name) || {}).model_id;
      //           const hit = referenceChildren.find((c: any) => c.model_id === childId);
      //           childNetSales[childIdx] = Number(hit?.net_sales || 0);
      //         });
      //         
      //         // Recalculate totals from work reports
      //         totalNetAmount = childNetSales.reduce((s, n) => s + (Number.isFinite(n) ? Number(n) : 0), 0);
      //       }
      //     } catch (error) {
      //       console.error('Error parsing reference_children from work report:', error);
      //     }
      //   }
      // }
      
      setNetAmount(totalNetAmount);
      setInvoiceValue(totalInvoiceValue);
      setInvoiceStatus(hasPaidInvoice ? 'Paid' : 'Unpaid');
      setRefNetSales(childNetSales);
      
    } catch (error) {
      console.error('Error populating reference model data:', error);
    }
  };

  const populateRegularModelData = async () => {
    try {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const isMonth = months.includes(selectedPeriod);
      const isHalf = !selectedPeriod.includes(' - Week ') && !isMonth;
      
      let targetPeriods: Array<{ period: string; week?: number }> = [];
      
      if (selectedPeriod.includes(' - Week ')) {
        // Specific week: only that week
        const { period, week } = parseWeekPeriod(selectedPeriod);
        targetPeriods = [{ period, week }];
      } else if (isHalf) {
        // Half-month: both weeks of that half
        targetPeriods = [
          { period: selectedPeriod, week: 1 },
          { period: selectedPeriod, week: 2 }
        ];
      } else if (isMonth) {
        // Full month: all 4 weeks
        const half1 = `${selectedPeriod} 1`;
        const half2 = `${selectedPeriod} 2`;
        targetPeriods = [
          { period: half1, week: 1 },
          { period: half1, week: 2 },
          { period: half2, week: 1 },
          { period: half2, week: 2 }
        ];
      }

      // Fetch invoices for all target periods
      const invoicePromises = targetPeriods.map(t => 
        apiService.listInvoices({ model_id: modelId, period: t.period, year, ...(t.week && { week: t.week }) })
      );
      const invoiceResults = await Promise.all(invoicePromises);
      
      // Sum up net amounts and invoice values across all periods
      let totalNetAmount = 0;
      let totalInvoiceValue = 0;
      let hasPaidInvoice = false;
      
      invoiceResults.forEach((result, idx) => {
        if (result.status === 'Success' && Array.isArray(result.data)) {
          const inv = result.data.find((i: any) => 
            i.model_id === modelId && 
            i.period === targetPeriods[idx].period && 
            i.year === year && 
            ((i.week || null) === (targetPeriods[idx].week || null))
          );
          
          if (inv) {
            totalNetAmount += Number(inv.net_amount || 0);
            totalInvoiceValue += Number(inv.invoice_amount || 0);
            if (inv.status === 'Paid') hasPaidInvoice = true;
          }
        }
      });
      
      setNetAmount(totalNetAmount);
      setInvoiceValue(totalInvoiceValue);
      setInvoiceStatus(hasPaidInvoice ? 'Paid' : 'Unpaid');
      
    } catch (error) {
      console.error('Error populating regular model data:', error);
    }
  };

  const handleNetAmountChange = async (value: number) => {
    // Do not auto-calc on client; backend computes on Generate
    setNetAmount(value);
    // Defer persistence to Generate
  };

  const handleRefNetChange = (index: number, value: number) => {
    const next = [...refNetSales];
    next[index] = Math.max(0, Number(value) || 0);
    setRefNetSales(next);
    const total = next.reduce((s, n) => s + (Number.isFinite(n) ? Number(n) : 0), 0);
    setNetAmount(total);
  };

  const generatePersistModel = async () => {
    try {
      setIsGenerating(true);
      
      // Calculate invoice amount without saving to database
      console.log('Generate - Current netAmount:', netAmount);
      const response = await apiService.calculateInvoice({
        model_id: modelId,
        net_amount: Math.max(0, Number(netAmount))
      });
      
      if (response.status === 'Success' && response.data) {
        // Update the UI with calculated values
        const calculatedAmount = response.data.calculated_invoice_amount;
        setInvoiceValue(calculatedAmount);
        
        toast({
          title: "Success",
          description: `Invoice calculated: $${calculatedAmount.toLocaleString()}`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to calculate invoice",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error calculating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to calculate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveModelData = async () => {
    try {
      setIsSaving(true);
      
      const { period, week } = parseWeekPeriod(selectedPeriod);
      
      // Save invoice data to database
      const list = await apiService.listInvoices({ model_id: modelId, period, year, ...(week && { week }) });
      const existing = (list.data || []).find((i: any) => i.model_id === modelId && i.period === period && i.year === year && (i.week || null) === (week || null));
      
      const payload: any = {
        net_amount: Math.max(0, Number(netAmount)),
        invoice_amount: Number(invoiceValue || 0), // Use the current invoice value (could be calculated or manually edited)
        status: invoiceStatus === 'Paid' ? 'Paid' : 'Unpaid',
      };
      
      console.log('Save payload:', payload);
      console.log('State values:', { netAmount, invoiceValue, invoiceStatus });
      
      // For reference models, include reference_children and notes
      const isRef = Array.isArray(modelData?.referenced_models) && (modelData!.referenced_models!.length > 0);
      if (isRef) {
        const refChildren = (modelData!.referenced_models || []).map((name, idx) => {
          const child = (allModels.find((m: any) => (m.modelName || m.model_name) === name) || {}) as any;
          return {
            model_id: child.model_id,
            net_sales: Number(refNetSales[idx] || 0)
          };
        });
        payload.reference_children = refChildren;
        try { payload.notes = JSON.stringify({ reference_children: refChildren }); } catch {}
      }
      
      if (existing) {
        await apiService.updateInvoice(existing.invoice_id, payload, false); // Don't auto-calculate, use provided values
      } else if (payload.net_amount > 0 || payload.invoice_amount > 0 || payload.status === 'Paid') {
        await apiService.createInvoice({ model_id: modelId, period, year, ...(week && { week }), ...payload });
      }
      
      // Save model insights data using the saved invoice values
      await apiService.saveModelInsights({
        model_id: modelId,
        period,
        year,
        week,
        net_sales: payload.net_amount,
        invoice_value: payload.invoice_amount,
        invoice_status: payload.status,
        revenue: payload.invoice_amount,
        profit: payload.invoice_amount - payload.net_amount
      });
      
      toast({ title: 'Saved', description: 'Model data saved successfully for the selected period.' });
    } catch (e) {
      console.error('Save failed:', e);
      toast({ title: 'Error', description: 'Save failed. Please try again.', variant: 'destructive' });
    } finally {
      // Reload latest values
      await Promise.all([loadInsightsData(), loadWeeklySummary()]);
      setIsSaving(false);
    }
  };

  const loadWeeklySummary = async () => {
    try {
      setLoadingSummary(true);
      const rows: WeeklySummaryRow[] = [];
      // Build target (period, week) tuples based on selection
      const targets: Array<{ period: string; week: number; label: string }> = [];
      const label = selectedPeriod;
      const months = [
        'January','February','March','April','May','June','July','August','September','October','November','December'
      ];
      const isMonth = months.includes(label);
      const isHalf = !label.includes(' - Week ') && !isMonth; // e.g., "January 1" or "January 2"
      if (label.includes(' - Week ')) {
        const { period, week } = parseWeekPeriod(label);
        if (period && typeof week === 'number') {
          targets.push({ period, week, label: `${period} • W${week}` });
        }
      } else if (isHalf) {
        // Two weeks for half-month
        targets.push({ period: label, week: 1, label: `${label} • W1` });
        targets.push({ period: label, week: 2, label: `${label} • W2` });
      } else if (isMonth) {
        // Four rows: 2 weeks each half
        const half1 = `${label} 1`;
        const half2 = `${label} 2`;
        targets.push({ period: half1, week: 1, label: `${half1} • W1` });
        targets.push({ period: half1, week: 2, label: `${half1} • W2` });
        targets.push({ period: half2, week: 1, label: `${half2} • W1` });
        targets.push({ period: half2, week: 2, label: `${half2} • W2` });
      }

      // Fetch insights for each target
      const promises = targets.map(t => apiService.getModelInsights(modelId, t.period, year, t.week));
      const results = await Promise.all(promises);
      results.forEach((res, idx) => {
        const t = targets[idx];
        if (res.status === 'Success' && res.data) {
          rows.push({
            label: t.label,
            period: t.period,
            week: t.week,
            revenue: res.data.revenue || 0,
            real_revenue: res.data.real_revenue || 0,
            cost: res.data.cost || 0,
            profit: res.data.profit || 0,
            real_profit: res.data.real_profit || 0,
          });
        } else {
          rows.push({
            label: t.label,
            period: t.period,
            week: t.week,
            revenue: 0,
            real_revenue: 0,
            cost: 0,
            profit: 0,
            real_profit: 0,
          });
        }
      });
      setWeeklySummary(rows);
    } catch (e) {
      console.error('Error loading weekly summary:', e);
      setWeeklySummary([]);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Commented out work reports loading - manual input preferred for insights
  // const loadWorkReports = async () => {
  //   try {
  //     const { period, week } = parseWeekPeriod(selectedPeriod);
  //     // Load work reports for all chatters for this period/week
  //     const chattersResponse = await apiService.getAllChatters();
  //     if (chattersResponse.status === 'Success' && chattersResponse.data) {
  //       const allWorkReports: any[] = [];
  //       
  //       // Load work reports for each chatter
  //       for (const chatter of chattersResponse.data) {
  //         try {
  //           const reportResponse = await apiService.getChatterWeeklyReport(
  //             chatter.chatter_id, 
  //             period, 
  //             year, 
  //             week || 1
  //           );
  //           if (reportResponse.status === 'Success' && reportResponse.data) {
  //             // Aggregate daily reports for the week
  //             const aggregatedReports = aggregateWeeklyReports(reportResponse.data);
  //             allWorkReports.push(...aggregatedReports);
  //           }
  //         } catch (error) {
  //           console.error(`Error loading work reports for chatter ${chatter.chatter_id}:`, error);
  //         }
  //       }
  //       
  //       setWorkReports(allWorkReports);
  //     }
  //   } catch (error) {
  //     console.error('Error loading work reports:', error);
  //   }
  // };

  // const aggregateWeeklyReports = (dailyReports: any[]) => {
  //   // Group reports by model_id
  //   const modelGroups: { [key: string]: any[] } = {};
  //   
  //   dailyReports.forEach(report => {
  //     const modelId = report.model_id;
  //     if (!modelGroups[modelId]) {
  //       modelGroups[modelId] = [];
  //     }
  //     modelGroups[modelId].push(report);
  //   });
  //   
  //   // Aggregate data for each model
  //   const aggregatedReports: any[] = [];
  //   
  //   Object.keys(modelGroups).forEach(modelId => {
  //     const reports = modelGroups[modelId];
  //     if (reports.length === 0) return;
  //     
  //     // Sum up hours and net_sales
  //     let totalHours = 0;
  //     let totalNetSales = 0;
  //     let aggregatedReferenceChildren: any[] = [];
  //     
  //     reports.forEach(report => {
  //       totalHours += Number(report.hours || 0);
  //       totalNetSales += Number(report.net_sales || 0);
  //       
  //       // Aggregate reference_children if present
  //       if (report.reference_children) {
  //         try {
  //           let referenceChildren = report.reference_children;
  //           // Handle potential double-encoded JSON
  //           if (typeof referenceChildren === 'string') {
  //             referenceChildren = JSON.parse(referenceChildren);
  //             if (typeof referenceChildren === 'string') {
  //               referenceChildren = JSON.parse(referenceChildren);
  //             }
  //           }
  //           
  //           if (Array.isArray(referenceChildren)) {
  //             // If this is the first report, initialize aggregated children
  //             if (aggregatedReferenceChildren.length === 0) {
  //               aggregatedReferenceChildren = referenceChildren.map(child => ({
  //                 model_id: child.model_id,
  //                 hours: 0,
  //                 net_sales: 0
  //               }));
  //             }
  //             
  //             // Add to aggregated children
  //             referenceChildren.forEach((child, index) => {
  //               if (aggregatedReferenceChildren[index]) {
  //                 aggregatedReferenceChildren[index].hours += Number(child.hours || 0);
  //                 aggregatedReferenceChildren[index].net_sales += Number(child.net_sales || 0);
  //               }
  //             });
  //           }
  //         } catch (error) {
  //           console.error('Error aggregating reference_children:', error);
  //         }
  //       }
  //     });
  //     
  //     // Create aggregated report
  //     const aggregatedReport = {
  //       ...reports[0], // Use first report as base
  //       hours: totalHours,
  //       net_sales: totalNetSales,
  //       reference_children: aggregatedReferenceChildren.length > 0 ? aggregatedReferenceChildren : null
  //     };
  //     
  //     aggregatedReports.push(aggregatedReport);
  //   });
  //   
  //   return aggregatedReports;
  // };

  // Calculate dynamic Y-axis scaling
  const getYAxisMax = () => {
    if (!insightsData) return 4000;
    
    const maxValue = Math.max(
      insightsData.revenue,
      insightsData.cost,
      insightsData.profit,
      insightsData.real_revenue,
      insightsData.real_profit
    );
    
    // Dynamic scaling based on period type
    let gridStep = 1000; // Default 1K
    if (selectedPeriod.includes('Week')) {
      gridStep = 1000; // 1K per grid line for weekly
    } else if (selectedPeriod.includes('July 1') || selectedPeriod.includes('July 2') || 
               selectedPeriod.includes('August 1') || selectedPeriod.includes('August 2')) {
      gridStep = 2000; // 2K per grid line for half-month
    } else if (selectedPeriod === 'July' || selectedPeriod === 'August') {
      gridStep = 4000; // 4K per grid line for full month
    }
    
    return Math.ceil(maxValue / gridStep) * gridStep;
  };

  const yAxisMax = getYAxisMax();
  const maxHeight = 180;

  // Use backend cost breakdown when available for more accurate model cost/profit
  const effectiveRevenue = insightsData?.revenue ?? 0;
  const effectiveCost = (costBreakdown?.total_cost ?? insightsData?.cost ?? 0);
  const effectiveProfit = effectiveRevenue - effectiveCost;
  const effectiveProfitMargin = effectiveRevenue ? ((effectiveProfit / effectiveRevenue) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/insights">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Insights
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{modelData?.model_name || 'Model'}</h1>
            <p className="text-muted-foreground">Performance Overview</p>
          </div>
        </div>
      </div>

      {/* Overview Cards removed as per request */}

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Date Range Selection</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select the period to view model performance
              </p>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Revenue, Cost, Profit, Real Revenue, and Real Profit breakdown for {selectedPeriod}
          </p>
        </CardHeader>
        <CardContent>
          <SinglePeriodHistogram 
            data={insightsData ? {
              revenue: insightsData.revenue,
              cost: insightsData.cost,
              profit: insightsData.profit,
              realRevenue: insightsData.real_revenue,
              realProfit: insightsData.real_profit,
            } : {
              revenue: 0,
              cost: 0,
              profit: 0,
              realRevenue: 0,
              realProfit: 0,
            }}
            period={selectedPeriod}
            loading={loading}
            height={400}
          />
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      {costBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Source of Cost</CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown of costs for this model
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Chatter Salaries</div>
                <div className="text-2xl font-bold">${costBreakdown.chatter_cost.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Hourly + commissions
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Team Leaders</div>
                <div className="text-2xl font-bold">${costBreakdown.tl_cost.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Commission-based
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">Managers</div>
                <div className="text-2xl font-bold">${costBreakdown.manager_cost.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Fixed + commission
                </div>
              </div>
              {/* Assistants tile removed as requested */}
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-900">
                Total Cost: ${costBreakdown.total_cost.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Summary for {selectedPeriod}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Net Amount</span>
                <div className="flex items-center space-x-2">
                  {Array.isArray(modelData?.referenced_models) && modelData!.referenced_models!.length > 0 ? (
                    <div className="flex flex-col gap-1 items-end">
                      {modelData!.referenced_models!.map((name, idx) => (
                        <div key={`${name}-${idx}`} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20 truncate" title={name}>{name}</span>
                          <span className="w-24 text-right font-medium">
                            ${Math.round(refNetSales[idx] || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground mt-1">
                        Total: ${netAmount.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <span className="w-32 text-right font-medium">
                      ${netAmount.toLocaleString()}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">(from admin)</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Invoice Value</span>
                <div className="flex items-center space-x-2">
                  <span className="w-32 text-right font-medium">
                    ${invoiceValue.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">(auto)</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Invoice Status</span>
                <span className="w-32 text-right font-medium">
                  {invoiceStatus}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Model Rules</h4>
                <div className="text-sm space-y-1">
                  <div>Earnings Type: {modelData?.earnings_type || 'Not set'}</div>
                  <div>Cut Logic: {modelData?.cut_logic ? 'Configured' : 'Not configured'}</div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Performance Metrics</h4>
                <div className="text-sm space-y-1">
                  <div>Revenue: ${effectiveRevenue.toLocaleString()}</div>
                  <div>Cost: ${effectiveCost.toLocaleString()}</div>
                  <div>Profit: ${effectiveProfit.toLocaleString()}</div>
                  <div>Profit Margin: {effectiveProfitMargin}</div>
                </div>
              </div>
              {/* Weekly Summary Table */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Weekly Summary</h4>
                {loadingSummary ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : weeklySummary.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No data</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scope</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklySummary.map((r) => (
                        <TableRow key={`${r.period}-${r.week}`}>
                          <TableCell className="font-medium">{r.label}</TableCell>
                          <TableCell className="text-right">${r.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${r.cost.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${r.profit.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    

    
