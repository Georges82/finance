'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Clock, 
  DollarSign, 
  Bell, 
  Database, 
  Shield, 
  RefreshCw,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PeriodAutomationService, { AutomationConfig } from '@/lib/period-automation';
import { PeriodManager } from '@/lib/salary-calculations';

interface SystemStatus {
  automationRunning: boolean;
  currentPeriod: any;
  lastCalculation: string;
  nextPeriod: any;
  totalChatters: number;
  totalModels: number;
  pendingPayments: number;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>({
    autoCalculateSalaries: true,
    autoUpdatePaymentStatus: true,
    notificationEnabled: true,
    emailNotifications: false
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    automationRunning: false,
    currentPeriod: null,
    lastCalculation: 'Never',
    nextPeriod: null,
    totalChatters: 78,
    totalModels: 32,
    pendingPayments: 15
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize automation service
    PeriodAutomationService.initialize(automationConfig);
    
    // Get current status
    const status = PeriodAutomationService.getStatus();
    const currentPeriod = PeriodManager.getCurrentPeriod();
    const nextPeriod = currentPeriod ? PeriodManager.getNextPeriod(currentPeriod.id) : null;
    
    setSystemStatus(prev => ({
      ...prev,
      automationRunning: status.isRunning,
      currentPeriod,
      nextPeriod
    }));
  }, []);

  const handleConfigChange = (key: keyof AutomationConfig, value: boolean) => {
    const newConfig = { ...automationConfig, [key]: value };
    setAutomationConfig(newConfig);
    PeriodAutomationService.updateConfig(newConfig);
    
    toast({
      title: "Configuration Updated",
      description: `${key} has been ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleManualPeriodTransition = async () => {
    if (!systemStatus.currentPeriod) {
      toast({
        title: "Error",
        description: "No current period found.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await PeriodAutomationService.manualPeriodTransition(systemStatus.currentPeriod.id);
      toast({
        title: "Period Transition Complete",
        description: "Salaries have been calculated and payment statuses updated.",
      });
      
      // Refresh status
      const status = PeriodAutomationService.getStatus();
      setSystemStatus(prev => ({
        ...prev,
        automationRunning: status.isRunning,
        lastCalculation: new Date().toLocaleString()
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete period transition.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = () => {
    if (systemStatus.automationRunning) {
      PeriodAutomationService.stopPeriodCheck();
      setSystemStatus(prev => ({ ...prev, automationRunning: false }));
      toast({
        title: "Automation Stopped",
        description: "Period automation has been disabled.",
      });
    } else {
      PeriodAutomationService.startPeriodCheck();
      setSystemStatus(prev => ({ ...prev, automationRunning: true }));
      toast({
        title: "Automation Started",
        description: "Period automation has been enabled.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Manage system automation and configuration</p>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Status</CardTitle>
            {systemStatus.automationRunning ? (
              <Play className="h-4 w-4 text-green-600" />
            ) : (
              <Pause className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus.automationRunning ? 'Running' : 'Stopped'}
            </div>
            <p className="text-xs text-muted-foreground">
              Period automation service
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Period</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus.currentPeriod?.name || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              Active salary period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Calculation</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus.lastCalculation}
            </div>
            <p className="text-xs text-muted-foreground">
              Salary calculation run
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Chatters awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Automation Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Automation Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Period Automation</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically handle period transitions
                </p>
              </div>
              <Button
                variant={systemStatus.automationRunning ? "destructive" : "default"}
                size="sm"
                onClick={toggleAutomation}
              >
                {systemStatus.automationRunning ? "Stop" : "Start"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-calculate Salaries</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically calculate salaries when periods end
                  </p>
                </div>
                <Switch
                  checked={automationConfig.autoCalculateSalaries}
                  onCheckedChange={(checked) => handleConfigChange('autoCalculateSalaries', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-update Payment Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Reset payment status to "Not Paid" for new periods
                  </p>
                </div>
                <Switch
                  checked={automationConfig.autoUpdatePaymentStatus}
                  onCheckedChange={(checked) => handleConfigChange('autoUpdatePaymentStatus', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications for period transitions
                  </p>
                </div>
                <Switch
                  checked={automationConfig.notificationEnabled}
                  onCheckedChange={(checked) => handleConfigChange('notificationEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to admins
                  </p>
                </div>
                <Switch
                  checked={automationConfig.emailNotifications}
                  onCheckedChange={(checked) => handleConfigChange('emailNotifications', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Manual Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Current Period</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <div className="font-medium">{systemStatus.currentPeriod?.name || 'No period'}</div>
                  <div className="text-sm text-muted-foreground">
                    {systemStatus.currentPeriod 
                      ? `${systemStatus.currentPeriod.startDate.toLocaleDateString()} - ${systemStatus.currentPeriod.endDate.toLocaleDateString()}`
                      : 'No active period'
                    }
                  </div>
                </div>
              </div>

              <div>
                <Label>Next Period</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <div className="font-medium">{systemStatus.nextPeriod?.name || 'No next period'}</div>
                  <div className="text-sm text-muted-foreground">
                    {systemStatus.nextPeriod 
                      ? `${systemStatus.nextPeriod.startDate.toLocaleDateString()} - ${systemStatus.nextPeriod.endDate.toLocaleDateString()}`
                      : 'No next period scheduled'
                    }
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Button
                  onClick={handleManualPeriodTransition}
                  disabled={isLoading || !systemStatus.currentPeriod}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Trigger Period Transition
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground">
                  This will calculate all salaries and update payment statuses for the current period.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Chatters</Label>
              <div className="text-2xl font-bold">{systemStatus.totalChatters}</div>
              <p className="text-xs text-muted-foreground">Active chat agents</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Models</Label>
              <div className="text-2xl font-bold">{systemStatus.totalModels}</div>
              <p className="text-xs text-muted-foreground">Managed models</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">System Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Healthy
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Section */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-yellow-700">
            <p>• Period transitions are irreversible once completed</p>
            <p>• Manual period transitions should only be used for testing</p>
            <p>• Always verify salary calculations before processing payments</p>
            <p>• Backup data before making system configuration changes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

