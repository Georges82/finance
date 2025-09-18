
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { InsightsCalculator } from '@/lib/insights-calculations';
import { FinancialHistogram } from '@/components/ui/financial-histogram';

interface FinancialData {
  id: string;
  period: string;
  revenue: number;
  realRevenue: number;
  cost: number;
  realCost: number;
  profit: number;
  realProfit: number;
  invoiceStatus: 'Paid' | 'Not Paid';
}

interface ModelInsight {
  id: string;
  name: string;
  managerName: string;
  revenue: number;
  profit: number;
  performance: 'High' | 'Medium' | 'Low';
  netSales: number;
  invoiceValue: number;
  invoiceStatus: 'Paid' | 'Unpaid';
  isReference?: boolean;
  referencedModels?: Array<{ model_id: string; model_name: string }>;
  refNetSales?: number[];
}

interface AgencyInsightsData {
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

// Get available periods from utility
const availablePeriods = InsightsCalculator.getAvailablePeriods();

export default function InsightsPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [histogramPeriod, setHistogramPeriod] = useState('January');
  const [tablePeriod, setTablePeriod] = useState('January 1 - Week 1');
  const [searchTerm, setSearchTerm] = useState('');
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [modelInsights, setModelInsights] = useState<ModelInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyInsights, setAgencyInsights] = useState<AgencyInsightsData | null>(null);
  const [monthKPIs, setMonthKPIs] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [workReports, setWorkReports] = useState<any[]>([]);
  const [year] = useState<number>(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const parseWeekPeriod = (label: string): { period: string; week?: number } => {
    // Formats: "January 1 - Week 1" => { period: 'January 1', week: 1 }
    if (label.includes(' - Week ')) {
      const [p, wk] = label.split(' - Week ');
      const weekNum = parseInt(wk, 10);
      return { period: p, week: isNaN(weekNum) ? undefined : weekNum };
    }
    return { period: label };
  };

  // Load insights data
  useEffect(() => {
    loadModels();
    loadInsightsData();
  }, [histogramPeriod]);

  // Load invoices when table period changes
  useEffect(() => {
    loadInvoices();
    // loadWorkReports(); // Commented out - manual input preferred for insights
  }, [tablePeriod]);

  // Update table data when models or invoices change
  useEffect(() => {
    if (models.length > 0) {
      const { period: tableBasePeriod, week: tableWeek } = parseWeekPeriod(tablePeriod);
      const transformedData = models.map((model, index) => {
        // Find invoice data for this model and period/week
        const modelInvoice = invoices.find((invoice: any) => 
          invoice.model_id === model.model_id && 
          invoice.period === tableBasePeriod &&
          ((invoice.week || null) === (tableWeek || null))
        );

        // Since we're only showing regular models now, simplify the logic
        const netAmount = modelInvoice?.net_amount || 0;
        const invoiceAmount = modelInvoice?.invoice_amount || 0;
        const profit = invoiceAmount - netAmount;

        return {
          id: model.model_id || `model-${index}`,
          name: model.modelName || `Model ${index + 1}`,
          managerName: model.managerName || 'Unknown',
          revenue: invoiceAmount || 0,
          profit: profit,
          performance: 'Medium' as const,
          netSales: netAmount,
          invoiceValue: invoiceAmount || 0,
          invoiceStatus: ((modelInvoice?.status === 'Paid') ? 'Paid' : 'Unpaid') as 'Paid' | 'Unpaid',
          isReference: false, // All models are now regular models
          referencedModels: [], // No reference models shown
          refNetSales: [], // No reference net sales
        };
      });
      setModelInsights(transformedData);
    }
  }, [models, invoices, tablePeriod]); // Removed workReports dependency

  const loadModels = async () => {
    try {
      const response = await apiService.getAllModels({ status_filter: 'Active' });
      if (response.status === 'Success' && response.data) {
        // Filter out reference models - only show regular models
        const regularModels = response.data.filter((model: any) => {
          // A model is a reference model if:
          // 1. isReferenceModel is true, OR
          // 2. referencedModels array exists and has items
          const isReferenceModel = model.isReferenceModel === true || 
                                 (model.referencedModels && Array.isArray(model.referencedModels) && model.referencedModels.length > 0);
          return !isReferenceModel; // Only include non-reference models
        });
        setModels(regularModels);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const { period, week } = parseWeekPeriod(tablePeriod);
      const response = await apiService.listInvoices({ period, year, ...(week && { week }) });
      if (response.status === 'Success' && response.data) {
        setInvoices(response.data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  // Commented out work reports loading - manual input preferred for insights
  // const loadWorkReports = async () => {
  //   try {
  //     const { period, week } = parseWeekPeriod(tablePeriod);
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

  const loadInsightsData = async () => {
    try {
      setLoading(true);
      
      // Load agency insights
      const { period: histPeriod, week: histWeek } = parseWeekPeriod(histogramPeriod);
      const agencyResponse = await apiService.getAgencyInsights(histPeriod, year, histWeek);
      if (agencyResponse.status === 'Success' && agencyResponse.data) {
        setAgencyInsights(agencyResponse.data);
      }

      // Load dashboard KPIs
      const kpisResponse = await apiService.getDashboardKPIs(histPeriod, year, histWeek);
      if (kpisResponse.status === 'Success' && kpisResponse.data) {
        setMonthKPIs(kpisResponse.data);
      }



      // Try to load saved period data first, fallback to calculated data
      let savedData = null;
      try {
        // Check if we have saved data for this period
        const savedResponse = await apiService.getSavedAgencyInsights(histPeriod, year, histWeek);
        if (savedResponse.status === 'Success' && savedResponse.data) {
          savedData = savedResponse.data;
        }
      } catch (e) {
        console.log('No saved data found, using calculated data');
      }

      // Use saved data if available, otherwise use calculated data
      const dataSource = savedData || agencyResponse.data;
      
      const financialDataForHistogram: FinancialData[] = [
        {
          id: '1',
          period: histogramPeriod,
          revenue: dataSource?.revenue || 0,
          realRevenue: dataSource?.real_revenue || 0,
          cost: dataSource?.cost || 0,
          realCost: dataSource?.cost || 0,
          profit: dataSource?.profit || 0,
          realProfit: dataSource?.real_profit || 0,
          invoiceStatus: 'Paid'
        }
      ];
      setFinancialData(financialDataForHistogram);

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

  // Filter financial data based on search term
  const filteredFinancialData = financialData.filter(data =>
    data.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const histogramData = filteredFinancialData;

  // Get week-level periods for table
  const weekPeriods = availablePeriods.filter(period => period.includes('Week'));

  // Calculate totals
  const totalRevenue = agencyInsights?.revenue || 0;
  const totalRealRevenue = agencyInsights?.real_revenue || 0;
  const totalCost = agencyInsights?.cost || 0;
  const totalRealCost = agencyInsights?.cost || 0;
  const totalProfit = agencyInsights?.profit || 0;
  const totalRealProfit = agencyInsights?.real_profit || 0;

  const computeInvoiceForModel = (modelId: string, netSales: number): number => {
    const modelRec = models.find((m: any) => m.model_id === modelId);
    if (!modelRec || !Number.isFinite(netSales)) return 0;
    const earningsType: string | undefined = modelRec.earningsType || modelRec.earnings_type;
    const cutLogic: any = modelRec.cutLogic || modelRec.cut_logic || {};
    const safeNum = (v: any, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    try {
      if (earningsType === 'Type 1') {
        const threshold = safeNum(cutLogic.threshold, 0);
        const percentage1 = safeNum(cutLogic.percentage1, 0);
        const fixedAmount = safeNum(cutLogic.fixedAmount, 0);
        if (percentage1 > 0 || fixedAmount > 0) {
          return Math.round(netSales >= threshold ? netSales * (percentage1 / 100) : fixedAmount);
        }
        // Fallback if rules incomplete
        return Math.round(netSales * 0.2);
      }
      const percentage2 = safeNum(cutLogic.percentage2 ?? cutLogic.percentage, 20);
      return Math.round(netSales * (percentage2 / 100));
    } catch {
      // Final fallback
      return Math.round(netSales * 0.2);
    }
  };

  const handleModelNetSalesChange = async (modelId: string, value: number) => {
    // Do not auto-calc here; backend will compute on Generate
    setModelInsights(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, netSales: Math.max(0, Number(value)) }
        : model
    ));
  };

  const handleRefNetSalesChange = (modelId: string, index: number, value: number) => {
    // This function is no longer needed since we only show regular models
    // Reference models are filtered out, so this won't be called
    console.log('handleRefNetSalesChange called but not needed for regular models only');
  };

  const handleModelInvoiceValueChange = async (modelId: string, value: number) => {
    // Local-only; persist on Generate
    setModelInsights(prev => prev.map(model => model.id === modelId ? { ...model, invoiceValue: value } : model));
  };

  const handleInvoiceStatusChange = async (modelId: string, newStatus: 'Paid' | 'Unpaid') => {
    // Local-only; persist on Generate
    setModelInsights(prev => prev.map(model => model.id === modelId ? { ...model, invoiceStatus: newStatus } : model));
  };

  const generatePersistInvoices = async () => {
    try {
      setIsGenerating(true);
      const { period, week } = parseWeekPeriod(tablePeriod);
      
      // Calculate invoice amounts for all models without saving to database
      const calculatedInvoices: any[] = [];
      for (const row of modelInsights) {
        if (Number.isFinite(row.netSales) && row.netSales > 0) {
          try {
            // Prepare invoice data
            const invoiceData: any = {
              model_id: row.id,
              net_amount: Math.max(0, Number(row.netSales))
            };
            
            // Reference models are filtered out, so no need to handle reference_children
            
            const response = await apiService.calculateInvoice(invoiceData);
            
            if (response.status === 'Success' && response.data) {
              calculatedInvoices.push({
                model_id: row.id,
                net_amount: response.data.net_amount,
                calculated_invoice_amount: response.data.calculated_invoice_amount
              });
            }
          } catch (error) {
            console.error(`Error calculating invoice for model ${row.id}:`, error);
          }
        }
      }
      
      // Update the modelInsights state with calculated values
      setModelInsights(prev => prev.map(model => {
        const calculated = calculatedInvoices.find(inv => inv.model_id === model.id);
        if (calculated) {
          return {
            ...model,
            invoiceValue: calculated.calculated_invoice_amount
          };
        }
        return model;
      }));
      
      const totalCalculated = calculatedInvoices.reduce((sum, inv) => sum + inv.calculated_invoice_amount, 0);
      
      toast({ 
        title: 'Generated', 
        description: `Calculated ${calculatedInvoices.length} invoices. Total: $${totalCalculated.toLocaleString()}` 
      });
      
      // Note: The calculated values are now in the UI but not saved to database
      // User needs to click Save to persist them
      
    } catch (e) {
      console.error('Generate failed:', e);
      toast({ title: 'Error', description: 'Generate failed. Try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAllData = async () => {
    try {
      setIsSaving(true);
      
      // First generate invoices and calculate salaries
      await generatePersistInvoices();
      
      // Then save all period data using FRESH values from backend
      const { period, week } = parseWeekPeriod(tablePeriod);

      // Fetch latest agency insights snapshot for this scope
      const freshAgency = await apiService.getAgencyInsights(period, year, week);
      const agencyPayload = freshAgency?.status === 'Success' && freshAgency.data
        ? freshAgency.data
        : agencyInsights;
      if (agencyPayload) {
        await apiService.saveAgencyInsights({
          period,
          year,
          week,
          revenue: agencyPayload.revenue || 0,
          real_revenue: agencyPayload.real_revenue || 0,
          cost: agencyPayload.cost || 0,
          profit: agencyPayload.profit || 0,
          real_profit: agencyPayload.real_profit || 0,
        });
      }

      // Fetch latest invoices for this scope
      const invRes = await apiService.listInvoices({ period, year, ...(week && { week }) });
      const invList = (invRes.status === 'Success' && invRes.data) ? invRes.data : [];
      const invoiceByModel: Record<string, any> = {};
      for (const inv of invList) {
        invoiceByModel[inv.model_id] = inv;
      }

      // Save invoice data and model insights using calculated values from UI state
      for (const model of modelInsights) {
        // First save invoice data to invoices table
        const existing = invList.find((inv: any) => inv.model_id === model.id);
        const invoicePayload: any = {
          net_amount: model.netSales || 0,
          invoice_amount: model.invoiceValue || 0,
          status: model.invoiceStatus || 'Unpaid',
        };
        
        // Reference models are filtered out, so no need to handle reference_children
        
        if (existing) {
          await apiService.updateInvoice(existing.invoice_id, invoicePayload, false); // Don't auto-calculate
        } else if ((invoicePayload.net_amount > 0 || invoicePayload.invoice_amount > 0 || invoicePayload.status === 'Paid')) {
          await apiService.createInvoice({ 
            model_id: model.id, 
            period, 
            year, 
            ...(week && { week }), 
            ...invoicePayload 
          });
        }
        
        // Then save model insights data
        await apiService.saveModelInsights({
          model_id: model.id,
          period,
          year,
          week,
          net_sales: model.netSales || 0,
          invoice_value: model.invoiceValue || 0,
          invoice_status: model.invoiceStatus || 'Unpaid',
          revenue: model.invoiceValue || 0,
          profit: (model.invoiceValue || 0) - (model.netSales || 0),
        });
      }
      
      toast({ title: 'Saved', description: 'All data saved successfully for the selected period.' });
    } catch (e) {
      console.error('Save failed:', e);
      toast({ title: 'Error', description: 'Save failed. Please try again.', variant: 'destructive' });
    } finally {
      // Refresh UI with latest values
      await loadInvoices();
      await loadInsightsData();
      setIsSaving(false);
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Insights & Statistics</h1>
          <p className="text-muted-foreground">Financial overview and performance analytics</p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Real: ${totalRealRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Real: ${totalRealCost.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total {totalProfit >= 0 ? 'Profit' : 'Loss'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Real: ${totalRealProfit.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Enhanced Histogram with Proper Gaps */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Financial Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Revenue, Cost, Profit, Real Revenue, and Real Profit breakdown
                {agencyInsights?.metadata?.scope_type === 'month' && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • Month Scope: {agencyInsights.metadata.month}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={histogramPeriod} onValueChange={setHistogramPeriod}>
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
              {/* Recompute removed: Generate handles cost computation and persistence */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FinancialHistogram 
            data={histogramData.map(d => ({
              name: d.period,
              revenue: d.revenue,
              cost: d.cost,
              profit: d.profit,
              realRevenue: d.realRevenue,
              realProfit: d.realProfit,
            }))}
            loading={loading}
            height={400}
            period={histogramPeriod}
          />
        </CardContent>
      </Card>

      {/* Month-Specific KPIs */}
      {!loading && monthKPIs && monthKPIs.period_breakdown && monthKPIs.growth_metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Month Breakdown - {monthKPIs.month} {monthKPIs.year}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Period-by-period breakdown and growth metrics
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Period Breakdown */}
              <div>
                <h4 className="font-medium mb-3">Period Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Period 1 ({monthKPIs?.period_breakdown?.period_1?.revenue > 0 ? 'Active' : 'No Data'})</span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Revenue: ${monthKPIs?.period_breakdown?.period_1?.revenue?.toLocaleString() || '0'}</div>
                      <div className="text-sm text-muted-foreground">Profit: ${monthKPIs?.period_breakdown?.period_1?.profit?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Period 2 ({monthKPIs?.period_breakdown?.period_2?.revenue > 0 ? 'Active' : 'No Data'})</span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Revenue: ${monthKPIs?.period_breakdown?.period_2?.revenue?.toLocaleString() || '0'}</div>
                      <div className="text-sm text-muted-foreground">Profit: ${monthKPIs?.period_breakdown?.period_2?.profit?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Growth Metrics */}
              <div>
                <h4 className="font-medium mb-3">Growth Metrics (Period 2 vs Period 1)</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Revenue Growth</span>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${(monthKPIs?.growth_metrics?.revenue_growth_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(monthKPIs?.growth_metrics?.revenue_growth_pct || 0) >= 0 ? '+' : ''}{monthKPIs?.growth_metrics?.revenue_growth_pct || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${(monthKPIs?.growth_metrics?.revenue_growth_abs || 0) >= 0 ? '+' : ''}{(monthKPIs?.growth_metrics?.revenue_growth_abs || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Profit Growth</span>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${(monthKPIs?.growth_metrics?.profit_growth_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(monthKPIs?.growth_metrics?.profit_growth_pct || 0) >= 0 ? '+' : ''}{monthKPIs?.growth_metrics?.profit_growth_pct || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${(monthKPIs?.growth_metrics?.profit_growth_abs || 0) >= 0 ? '+' : ''}{(monthKPIs?.growth_metrics?.profit_growth_abs || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Month KPIs Data Message */}
      {!loading && histogramPeriod && !histogramPeriod.includes('Week') && (!monthKPIs || !monthKPIs.period_breakdown || !monthKPIs.growth_metrics) && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>No month-specific data available for {histogramPeriod}.</p>
              <p className="text-sm">Try selecting a different period or check if data exists for this month.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Financial Breakdown Table - Model-based */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Financial Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Model performance breakdown for {tablePeriod}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={tablePeriod} onValueChange={setTablePeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={generatePersistInvoices} disabled={isGenerating} variant="outline" type="button">
                {isGenerating ? 'Generating…' : 'Generate'}
              </Button>
              <Button onClick={saveAllData} disabled={isSaving || isGenerating} type="button">
                {isSaving ? 'Saving…' : 'Save All Data'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Loading model data...</span>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Model Name</TableHead>
                  <TableHead className="w-[160px]">Manager Name</TableHead>
                  <TableHead className="w-[190px] text-center">Selected Period</TableHead>
                  <TableHead className="w-[320px] text-center">Net</TableHead>
                  <TableHead className="w-[130px] text-center">Invoice</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelInsights.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No model data available for the selected period
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  modelInsights.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium align-middle">
                        <Link 
                          href={`/dashboard/models/${model.id}/insights`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {model.name}
                        </Link>
                      </TableCell>
                      <TableCell className="align-middle">{model.managerName}</TableCell>
                      <TableCell className="text-center align-middle">{tablePeriod}</TableCell>
                      <TableCell className="align-middle">
                        <div className="w-[320px]">
                          <div className="grid grid-cols-[180px_1fr] items-center gap-2 w-full">
                            <span className="text-xs text-muted-foreground w-[180px]">&nbsp;</span>
                            <NumberInput
                              value={Math.round(model.netSales)}
                              onChange={(e) => handleModelNetSalesChange(model.id, parseFloat(e.target.value) || 0)}
                              className="w-24 text-center justify-self-end"
                              placeholder="Manual input"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <NumberInput
                          value={Math.round(model.invoiceValue)}
                          onChange={(e) => handleModelInvoiceValueChange(model.id, parseFloat(e.target.value) || 0)}
                          className="w-24 text-center mx-auto"
                          placeholder="Auto-calculated"
                        />
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <Select 
                          value={model.invoiceStatus}
                          onValueChange={(value: 'Paid' | 'Unpaid') => 
                            handleInvoiceStatusChange(model.id, value)
                          }
                        >
                          <SelectTrigger className="w-24 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Unpaid">Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          
          {/* Table Notes */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Table Notes:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>Net:</strong> Manual input — amount earned on this model's account for the selected period</li>
              <li>• <strong>Invoice:</strong> Auto-calculated (based on model's rule) — editable if admin wants to adjust</li>
              <li>• <strong>Status:</strong> Dropdown: Paid / Unpaid — affects Real Revenue/Profit in histogram</li>
              <li>• All fields are editable inline</li>
              <li>• Changing "Status" to "Paid" triggers update to real revenue and real profit</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}    

    

