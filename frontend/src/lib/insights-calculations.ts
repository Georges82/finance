// Insights Calculations Utility
// This file contains all the business logic for insights and statistics calculations

import { models, teamLeaders } from './shared-data';
import { ModelRevenueCalculator } from './salary-calculations';

export interface ModelInsightData {
  id: string;
  modelName: string;
  managerName: string;
  period: string;
  netSales: number;
  invoiceValue: number;
  invoiceStatus: 'Paid' | 'Not Paid';
  revenue: number;
  realRevenue: number;
  cost: number;
  profit: number;
  realProfit: number;
  chatterCost: number;
  managerCost: number;
  assistantCost: number;
}

export interface PeriodFinancialData {
  id: string;
  period: string;
  revenue: number;
  realRevenue: number;
  cost: number;
  realCost: number;
  profit: number;
  realProfit: number;
  modelBreakdown: ModelInsightData[];
}

export interface ChatterCostData {
  id: string;
  name: string;
  hours: number;
  hourlyCost: number;
  commission: number;
  totalCost: number;
  modelId: string;
  modelName: string;
}

export class InsightsCalculator {
  // Calculate invoice value based on model rules
  static calculateInvoiceValue(netSales: number, modelId: string): number {
    const model = models.find(m => m.id === modelId);
    if (!model) return 0;

    if (model.earningsType === 'Type 1') {
      return netSales >= model.cutLogic.threshold 
        ? netSales * (model.cutLogic.percentage1 / 100)
        : model.cutLogic.fixedAmount;
    } else {
      return netSales * (model.cutLogic.percentage2 / 100);
    }
  }

  // Calculate real revenue based on invoice status
  static calculateRealRevenue(invoiceValue: number, status: 'Paid' | 'Not Paid'): number {
    return status === 'Paid' ? invoiceValue : 0;
  }

  // Calculate profit
  static calculateProfit(revenue: number, cost: number): number {
    return revenue - cost;
  }

  // Calculate real profit
  static calculateRealProfit(realRevenue: number, cost: number): number {
    return realRevenue - cost;
  }

  // Get model manager name
  static getModelManager(modelId: string): string {
    const model = models.find(m => m.id === modelId);
    if (!model) return 'Unknown';
    
    const teamLeader = teamLeaders.find(tl => tl.name === model.teamLeader);
    return teamLeader ? teamLeader.name : model.teamLeader;
  }

  // Calculate cost attribution for a model
  static calculateModelCosts(
    modelId: string,
    period: string,
    chatterCosts: ChatterCostData[]
  ): { chatterCost: number; managerCost: number; assistantCost: number; totalCost: number } {
    // Filter costs for this model and period
    const modelChatterCosts = chatterCosts.filter(cost => cost.modelId === modelId);
    
    const chatterCost = modelChatterCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
    
    // Get manager cost (simplified - in real app this would be more complex)
    const model = models.find(m => m.id === modelId);
    const managerCost = model ? 400 : 0; // Mock value
    
    // Get assistant cost (simplified)
    const assistantCost = 250; // Mock value
    
    const totalCost = chatterCost + managerCost + assistantCost;
    
    return {
      chatterCost,
      managerCost,
      assistantCost,
      totalCost
    };
  }

  // Generate period financial data
  static generatePeriodFinancialData(
    period: string,
    modelData: ModelInsightData[]
  ): PeriodFinancialData {
    const revenue = modelData.reduce((sum, model) => sum + model.revenue, 0);
    const realRevenue = modelData.reduce((sum, model) => sum + model.realRevenue, 0);
    const cost = modelData.reduce((sum, model) => sum + model.cost, 0);
    const profit = modelData.reduce((sum, model) => sum + model.profit, 0);
    const realProfit = modelData.reduce((sum, model) => sum + model.realProfit, 0);

    return {
      id: period,
      period,
      revenue,
      realRevenue,
      cost,
      realCost: cost, // Simplified - real cost might be different
      profit,
      realProfit,
      modelBreakdown: modelData
    };
  }

  // Update model insight data when net sales changes
  static updateModelInsightData(
    modelId: string,
    period: string,
    netSales: number,
    invoiceStatus: 'Paid' | 'Not Paid',
    chatterCosts: ChatterCostData[]
  ): ModelInsightData {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model with ID ${modelId} not found`);
    }

    const invoiceValue = this.calculateInvoiceValue(netSales, modelId);
    const revenue = invoiceValue;
    const realRevenue = this.calculateRealRevenue(invoiceValue, invoiceStatus);
    
    const costs = this.calculateModelCosts(modelId, period, chatterCosts);
    const profit = this.calculateProfit(revenue, costs.totalCost);
    const realProfit = this.calculateRealProfit(realRevenue, costs.totalCost);

    return {
      id: modelId,
      modelName: model.modelName,
      managerName: this.getModelManager(modelId),
      period,
      netSales,
      invoiceValue,
      invoiceStatus,
      revenue,
      realRevenue,
      cost: costs.totalCost,
      profit,
      realProfit,
      chatterCost: costs.chatterCost,
      managerCost: costs.managerCost,
      assistantCost: costs.assistantCost
    };
  }

  // Get Y-axis scale based on period type
  static getYAxisScale(period: string): number {
    if (period.includes('Week')) return 1000; // 1K per grid line for weeks
    if (period.includes('1') || period.includes('2')) return 2000; // 2K per grid line for half-months
    return 4000; // 4K per grid line for full months
  }

  // Validate period format
  static isValidPeriod(period: string): boolean {
    const validPeriods = [
      'July', 'July 1', 'July 2', 'July 1 - Week 1', 'July 1 - Week 2', 'July 2 - Week 1', 'July 2 - Week 2',
      'August', 'August 1', 'August 2', 'August 1 - Week 1', 'August 1 - Week 2', 'August 2 - Week 1', 'August 2 - Week 2',
      'September', 'September 1', 'September 2', 'September 1 - Week 1', 'September 1 - Week 2', 'September 2 - Week 1', 'September 2 - Week 2'
    ];
    return validPeriods.includes(period);
  }

  // Get all available periods
  static getAvailablePeriods(): string[] {
    const months = [
      'January','February','March','April','May','June','July','August','September','October','November','December'
    ];
    const periods: string[] = [];
    for (const m of months) {
      periods.push(m);
      periods.push(`${m} 1`);
      periods.push(`${m} 2`);
      periods.push(`${m} 1 - Week 1`);
      periods.push(`${m} 1 - Week 2`);
      periods.push(`${m} 2 - Week 1`);
      periods.push(`${m} 2 - Week 2`);
    }
    return periods;
  }

  // Calculate performance rating based on profit
  static calculatePerformanceRating(profit: number, averageProfit: number): 'High' | 'Medium' | 'Low' {
    if (profit >= averageProfit * 1.2) return 'High';
    if (profit >= averageProfit * 0.8) return 'Medium';
    return 'Low';
  }

  // Get mock chatter costs for demonstration
  static getMockChatterCosts(modelId: string): ChatterCostData[] {
    return [
      {
        id: '1',
        name: 'John Doe',
        hours: 32,
        hourlyCost: 480,
        commission: 120,
        totalCost: 600,
        modelId,
        modelName: models.find(m => m.id === modelId)?.modelName || 'Unknown'
      },
      {
        id: '2',
        name: 'Jane Smith',
        hours: 28,
        hourlyCost: 420,
        commission: 105,
        totalCost: 525,
        modelId,
        modelName: models.find(m => m.id === modelId)?.modelName || 'Unknown'
      }
    ];
  }
}
