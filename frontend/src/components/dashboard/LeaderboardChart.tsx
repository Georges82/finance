'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LeaderboardChartProps {
  data: Array<{
    name: string;
    value: number;
    id: string;
  }>;
  title?: string;
  description?: string;
  valueLabel?: string;
  color?: string;
}

export function LeaderboardChart({ 
  data, 
  title = "Top Performers", 
  description = "Performance comparison",
  valueLabel = "Value",
  color = "#3b82f6"
}: LeaderboardChartProps) {
  // Take top 5 items for better visualization
  const chartData = data.slice(0, 5).map(item => ({
    name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name,
    value: item.value,
    fullName: item.name,
    id: item.id
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, valueLabel]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `Name: ${payload[0].payload.fullName}`;
                  }
                  return `Name: ${label}`;
                }}
              />
              <Bar dataKey="value" fill={color} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
