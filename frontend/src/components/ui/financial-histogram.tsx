'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialData {
  name: string;
  revenue: number;
  cost: number;
  profit: number;
  realRevenue: number;
  realProfit: number;
}

interface FinancialHistogramProps {
  data: FinancialData[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  height?: number;
  period?: string; // For dynamic scaling
}

// Helper function to determine Y-axis scaling based on period
const getYAxisScaling = (period: string, data: FinancialData[]) => {
  const maxValue = Math.max(
    ...data.flatMap(d => [d.revenue, d.cost, d.profit, d.realRevenue, d.realProfit])
  );
  
  let gridStep = 1000; // Default 1K
  if (period.includes('Week')) {
    gridStep = 1000; // 1K per grid line for weekly
  } else if (period.includes('July 1') || period.includes('July 2') || 
             period.includes('August 1') || period.includes('August 2') ||
             period.includes('January 1') || period.includes('January 2') ||
             period.includes('February 1') || period.includes('February 2') ||
             period.includes('March 1') || period.includes('March 2') ||
             period.includes('April 1') || period.includes('April 2') ||
             period.includes('May 1') || period.includes('May 2') ||
             period.includes('June 1') || period.includes('June 2') ||
             period.includes('September 1') || period.includes('September 2') ||
             period.includes('October 1') || period.includes('October 2') ||
             period.includes('November 1') || period.includes('November 2') ||
             period.includes('December 1') || period.includes('December 2')) {
    gridStep = 2000; // 2K per grid line for half-month
  } else if (period === 'July' || period === 'August' || period === 'January' || 
             period === 'February' || period === 'March' || period === 'April' ||
             period === 'May' || period === 'June' || period === 'September' ||
             period === 'October' || period === 'November' || period === 'December') {
    gridStep = 4000; // 4K per grid line for full month
  }
  
  return Math.ceil(maxValue / gridStep) * gridStep;
};

export function FinancialHistogram({ 
  data, 
  title = "Financial Overview", 
  subtitle,
  loading = false,
  height = 400,
  period = ""
}: FinancialHistogramProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Loading financial data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          No financial data available for the selected period
        </div>
      </div>
    );
  }

  // Get Y-axis scaling based on period
  const yAxisMax = getYAxisScaling(period, data);

  // Transform data for Recharts with proper gaps
  const chartData = data.map((item, index) => ({
    name: item.name,
    Revenue: item.revenue,
    Cost: item.cost,
    Profit: item.profit,
    // Add spacer for large gap between Profit and Real Revenue
    spacer1: 0,
    spacer2: 0,
    'Real Revenue': item.realRevenue,
    'Real Profit': item.realProfit,
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            domain={[0, yAxisMax]}
            tickCount={6}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'spacer1' || name === 'spacer2') return null;
              return [`$${value.toLocaleString()}`, name];
            }}
            labelFormatter={(label) => `Period: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="Revenue" 
            fill="#16a34a" 
            name="Revenue"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="Cost" 
            fill="#dc2626" 
            name="Cost"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="Profit" 
            fill="#2563eb" 
            name="Profit"
            radius={[2, 2, 0, 0]}
          />
          {/* Spacer bars for gaps - invisible */}
          <Bar 
            dataKey="spacer1" 
            fill="transparent" 
            name=""
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="spacer2" 
            fill="transparent" 
            name=""
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="Real Revenue" 
            fill="#22c55e" 
            name="Real Revenue"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="Real Profit" 
            fill="#3b82f6" 
            name="Real Profit"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


// Single period histogram for model insights
interface SinglePeriodData {
  revenue: number;
  cost: number;
  profit: number;
  realRevenue: number;
  realProfit: number;
}

interface SinglePeriodHistogramProps {
  data: SinglePeriodData;
  period: string;
  loading?: boolean;
  height?: number;
}

export function SinglePeriodHistogram({ 
  data, 
  period,
  loading = false,
  height = 400 
}: SinglePeriodHistogramProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>Loading financial data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          No financial data available for the selected period
        </div>
      </div>
    );
  }

  // Get Y-axis scaling based on period
  const yAxisMax = getYAxisScaling(period, [{
    name: period,
    revenue: data.revenue,
    cost: data.cost,
    profit: data.profit,
    realRevenue: data.realRevenue,
    realProfit: data.realProfit,
  }]);

  // Transform data for Recharts with proper gaps
  const chartData = [{
    name: period,
    Revenue: data.revenue,
    Cost: data.cost,
    Profit: data.profit,
    // Add spacer for large gap between Profit and Real Revenue
    spacer1: 0,
    spacer2: 0,
    'Real Revenue': data.realRevenue,
    'Real Profit': data.realProfit,
  }];

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            domain={[0, yAxisMax]}
            tickCount={6}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'spacer1' || name === 'spacer2') return null;
              return [`$${value.toLocaleString()}`, name];
            }}
            labelFormatter={() => `Period: ${period}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="Revenue" 
            fill="#16a34a" 
            name="Revenue"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="Cost" 
            fill="#dc2626" 
            name="Cost"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="Profit" 
            fill="#2563eb" 
            name="Profit"
            radius={[2, 2, 0, 0]}
          />
          {/* Spacer bars for gaps - invisible */}
          <Bar 
            dataKey="spacer1" 
            fill="transparent" 
            name=""
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="spacer2" 
            fill="transparent" 
            name=""
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="Real Revenue" 
            fill="#22c55e" 
            name="Real Revenue"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="Real Profit" 
            fill="#3b82f6" 
            name="Real Profit"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
