'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { InsightsCalculator } from '@/lib/insights-calculations';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ProfitTrendChart } from '@/components/dashboard/ProfitTrendChart';
import { KPIPieChart } from '@/components/dashboard/KPIPieChart';
import { LeaderboardChart } from '@/components/dashboard/LeaderboardChart';
import { MetricsOverviewChart } from '@/components/dashboard/MetricsOverviewChart';
import { ComparisonChart } from '@/components/dashboard/ComparisonChart';

interface DashboardData {
  kpis: {
    total_chatters: number;
    total_models: number;
    total_clients: number;
  };
  snapshot: {
    revenue: number;
    real_revenue: number;
    cost: number;
    profit: number;
    real_profit: number;
  };
  month_kpis?: {
    period_breakdown: {
      period_1: { revenue: number; profit: number };
      period_2: { revenue: number; profit: number };
    };
    growth_metrics: {
      revenue_growth_pct: number;
      profit_growth_pct: number;
    };
  };
}

interface LeaderboardData {
  top_model_by_revenue: Array<{ id: string; value: number }>;
  top_model_by_profit: Array<{ id: string; value: number }>;
  most_expensive_chatter: Array<{ id: string; value: number }>;
}

// Get available periods from utility
const availablePeriods = InsightsCalculator.getAvailablePeriods();

export default function DashboardPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [chatters, setChatters] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parse week period if it's a week-level period
      const parseWeekPeriod = (label: string): { period: string; week?: number } => {
        if (label.includes(' - Week ')) {
          const [p, wk] = label.split(' - Week ');
          const weekNum = parseInt(wk, 10);
          return { period: p, week: isNaN(weekNum) ? undefined : weekNum };
        }
        return { period: label };
      };

      const { period, week } = parseWeekPeriod(selectedPeriod);
      
      // Load dashboard KPIs and snapshot
      const [kpisResponse, leaderboardResponse, modelsResponse, chattersResponse] = await Promise.all([
        apiService.getDashboardKPIs(period, currentYear, week),
        apiService.getLeaderboards(period, currentYear, week),
        apiService.getAllModels({ status_filter: 'Active' }),
        apiService.getAllChatters({ status_filter: 'active' })
      ]);

      if (kpisResponse.status === 'Success' && kpisResponse.data) {
        setDashboardData(kpisResponse.data);
      }

      if (leaderboardResponse.status === 'Success' && leaderboardResponse.data) {
        setLeaderboardData(leaderboardResponse.data);
      }

      if (modelsResponse.status === 'Success' && modelsResponse.data) {
        setModels(modelsResponse.data);
      }

      if (chattersResponse.status === 'Success' && chattersResponse.data) {
        setChatters(chattersResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Calculate unique clients from models
  const uniqueClients = models.length > 0 
    ? [...new Set(models.map(model => model.clientAgencyName))].length 
    : 0;

  // Prepare KPIs data
  const kpis = [
    {
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      title: 'Total Chatters',
      value: chatters.length.toString(),
      change: 'Active chatters only',
    },
    {
      icon: <Star className="h-6 w-6 text-muted-foreground" />,
      title: 'Total Models',
      value: models.length.toString(),
      change: 'Active models only',
    },
    {
      icon: <DollarSign className="h-6 w-6 text-muted-foreground" />,
      title: 'Total Clients',
      value: uniqueClients.toString(),
      change: 'Unique client agencies',
    },
  ];

  // Prepare weekly snapshot data with enhanced metrics
  const weeklySnapshot = (() => {
    // If we have month KPIs with period breakdown, use that
    if (dashboardData?.month_kpis?.period_breakdown) {
      const period1 = dashboardData.month_kpis.period_breakdown.period_1;
      const period2 = dashboardData.month_kpis.period_breakdown.period_2;
      
      return [
        {
          period: 'Period 1',
          week: 'Period 1',
          revenue: period1?.revenue || 0,
          costs: period1?.cost || 0,
          profit: period1?.profit || 0,
          profitMargin: period1?.revenue ? ((period1.profit / period1.revenue) * 100) : 0,
          change: dashboardData.month_kpis.growth_metrics ? 
            `${(dashboardData.month_kpis.growth_metrics.revenue_growth_pct || 0) >= 0 ? '+' : ''}${(dashboardData.month_kpis.growth_metrics.revenue_growth_pct || 0).toFixed(1)}%` : 
            'N/A'
        },
        {
          period: 'Period 2',
          week: 'Period 2',
          revenue: period2?.revenue || 0,
          costs: period2?.cost || 0,
          profit: period2?.profit || 0,
          profitMargin: period2?.revenue ? ((period2.profit / period2.revenue) * 100) : 0,
          change: dashboardData.month_kpis.growth_metrics ? 
            `${(dashboardData.month_kpis.growth_metrics.profit_growth_pct || 0) >= 0 ? '+' : ''}${(dashboardData.month_kpis.growth_metrics.profit_growth_pct || 0).toFixed(1)}%` : 
            'N/A'
        }
      ];
    }
    
    // If we have basic snapshot data, show that as a single period
    if (dashboardData?.snapshot) {
      const snapshot = dashboardData.snapshot;
      return [
        {
          period: 'Total Period',
          week: 'Total Period',
          revenue: snapshot.revenue || 0,
          costs: snapshot.cost || 0,
          profit: snapshot.profit || 0,
          profitMargin: snapshot.revenue ? ((snapshot.profit / snapshot.revenue) * 100) : 0,
          change: 'N/A'
        }
      ];
    }
    
    // No data available
    return [];
  })();

  const totalRevenue = dashboardData?.snapshot?.revenue || 0;
  const totalCosts = dashboardData?.snapshot?.cost || 0;
  const totalProfit = dashboardData?.snapshot?.profit || 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground">
              Loading your finance overview...
            </p>
          </div>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your finance overview for {selectedPeriod}.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod} total revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod} total costs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod} total profit
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Period Snapshot</CardTitle>
            <CardDescription>
              Performance breakdown for {selectedPeriod}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklySnapshot.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Costs</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklySnapshot.map((item) => (
                    <TableRow key={item.week}>
                      <TableCell>{item.week}</TableCell>
                      <TableCell className="text-right text-green-500">
                        ${item.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        ${item.costs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${item.profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-xs ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.change}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No period data available for {selectedPeriod}.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Interactive Charts Section */}
      {loading ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Costs Analysis</CardTitle>
              <CardDescription>Loading chart data...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>Loading chart...</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Profit Trend Analysis</CardTitle>
              <CardDescription>Loading chart data...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>Loading chart...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart 
            data={weeklySnapshot}
            title="Revenue vs Costs Analysis"
            description={`Financial breakdown for ${selectedPeriod}`}
          />
          <ProfitTrendChart 
            data={weeklySnapshot}
            title="Profit Trend Analysis"
            description={`Revenue and profit trends for ${selectedPeriod}`}
          />
        </section>
      )}

      <section className="grid grid-cols-1 gap-6">
        <MetricsOverviewChart 
          data={weeklySnapshot}
          title="Financial Overview"
          description={`Complete financial metrics for ${selectedPeriod}`}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComparisonChart 
          data={weeklySnapshot}
          title="Revenue vs Profit Margin"
          description={`Revenue performance and profitability analysis for ${selectedPeriod}`}
        />
        <KPIPieChart 
          data={[
            { name: 'Chatters', value: chatters.length, color: '#10b981' },
            { name: 'Models', value: models.length, color: '#3b82f6' },
            { name: 'Clients', value: uniqueClients, color: '#f59e0b' }
          ]}
          title="Resource Distribution"
          description="Count of active resources by type"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeaderboardChart 
          data={(leaderboardData?.top_model_by_revenue || []).map(item => ({
            name: models.find(m => m.model_id === item.id)?.modelName || `Model ${item.id}`,
            value: item.value,
            id: item.id
          }))}
          title="Top Models by Revenue"
          description="Revenue performance comparison"
          valueLabel="Revenue"
          color="#10b981"
        />
        <LeaderboardChart 
          data={(leaderboardData?.top_model_by_profit || []).map(item => ({
            name: models.find(m => m.model_id === item.id)?.modelName || `Model ${item.id}`,
            value: item.value,
            id: item.id
          }))}
          title="Top Models by Profit"
          description="Profit performance comparison"
          valueLabel="Profit"
          color="#3b82f6"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LeaderboardCard 
          title="Top Model by Revenue" 
          data={leaderboardData?.top_model_by_revenue || []} 
          models={models}
          valueKey="value" 
          valueHeader="Revenue" 
          linkPrefix='/dashboard/models' 
          linkKey='id' 
        />
        <LeaderboardCard 
          title="Top Model by Profit" 
          data={leaderboardData?.top_model_by_profit || []} 
          models={models}
          valueKey="value" 
          valueHeader="Profit" 
          linkPrefix='/dashboard/models' 
          linkKey='id' 
        />
        <LeaderboardCard 
          title="Most Expensive Chatter" 
          data={leaderboardData?.most_expensive_chatter || []} 
          chatters={chatters}
          valueKey="value" 
          valueHeader="Pay" 
          linkPrefix='/dashboard/chatters' 
        />
      </section>
    </div>
  );
}

interface LeaderboardCardProps {
    title: string;
    data: Array<{ id: string; value: number }>;
    models?: any[];
    chatters?: any[];
    valueKey: string;
    valueHeader: string;
    linkPrefix: string;
    linkKey?: string;
}

function LeaderboardCard({ title, data, models = [], chatters = [], valueKey, valueHeader, linkPrefix, linkKey }: LeaderboardCardProps) {
  const router = useRouter();

  const handleRowClick = (item: any) => {
      if (linkKey) {
          router.push(`${linkPrefix}/${item[linkKey]}/insights`);
      } else {
          router.push(linkPrefix);
      }
  }

  const getEntityName = (id: string) => {
    // Try to find in models first
    const model = models.find(m => m.model_id === id);
    if (model) return model.modelName;
    
    // Then try chatters
    const chatter = chatters.find(c => c.chatter_id === id);
    if (chatter) return chatter.name;
    
    return `Entity ${id}`;
  }

  const formatValue = (value: number) => {
    if (valueKey === 'value') {
      return `$${value.toLocaleString()}`;
    }
    return value.toString();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">{valueHeader}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                      <Button variant='link' className='p-0 h-auto' onClick={() => handleRowClick(item)}>
                          {getEntityName(item.id)}
                      </Button>
                  </TableCell>
                  <TableCell className="text-right">{formatValue(item.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
} 