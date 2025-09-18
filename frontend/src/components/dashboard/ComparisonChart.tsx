'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ComparisonChartProps {
  data: Array<{
    period: string;
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
  }>;
  title?: string;
  description?: string;
}

export function ComparisonChart({ data, title = "Revenue vs Profit Margin", description = "Combined view of revenue and profitability" }: ComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'profitMargin') {
                    return [`${value.toFixed(1)}%`, 'Profit Margin'];
                  }
                  return [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)];
                }}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar yAxisId="left" dataKey="costs" fill="#ef4444" name="Costs" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="profitMargin" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Profit Margin"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
