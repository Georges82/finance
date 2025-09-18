'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Manager } from '@/lib/api';

interface ManagerWithSalaries extends Manager {
  period_salaries: {
    [periodId: string]: {
      week1_salary: number;
      week2_salary: number;
      total_salary: number;
      payment_status: 'Paid' | 'Not Paid';
    };
  };
}

interface Period {
  id: string;
  name: string;
}

interface ManagerPeriodTableProps {
  managers: ManagerWithSalaries[];
  selectedPeriods: Period[];
  loading: boolean;
  onEditManager: (manager: Manager) => void;
  onDeleteManager: (manager: Manager) => void;
  getStatusColor: (status: string) => string;
  onUpdatePaymentStatus: (managerId: string, periodId: string, status: 'Paid' | 'Not Paid') => void;
  roleFilter?: 'Manager' | 'Team Leader';
}

export function ManagerPeriodTable({
  managers,
  selectedPeriods,
  loading,
  onEditManager,
  onDeleteManager,
  getStatusColor,
  onUpdatePaymentStatus,
  roleFilter = 'Manager'
}: ManagerPeriodTableProps) {
  const getPeriodData = (manager: ManagerWithSalaries, periodId: string) => {
    return manager.period_salaries?.[periodId] || {
      week1_salary: 0,
      week2_salary: 0,
      total_salary: 0,
      payment_status: 'Not Paid' as const
    };
  };

  const filteredManagers = managers.filter(m => m.role === roleFilter);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10">Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Salary Type</TableHead>
            <TableHead>Salary Details</TableHead>
            <TableHead>Status</TableHead>
            {selectedPeriods.map((period) => (
              <TableHead key={period.id} colSpan={4} className="text-center border-l">
                {period.name}
                <div className="text-xs text-muted-foreground mt-1">
                  Week 1 | Week 2 | Total | Paid
                </div>
              </TableHead>
            ))}
            <TableHead className="sticky right-0 bg-background z-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow key="loading-managers">
              <TableCell colSpan={6 + selectedPeriods.length * 4} className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Loading managers...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredManagers.length === 0 ? (
            <TableRow key="no-managers">
              <TableCell colSpan={6 + selectedPeriods.length * 4} className="text-center py-8">
                <div className="text-muted-foreground">
                  No managers found
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredManagers.map((manager) => (
              <TableRow key={`manager-${manager.manager_id}`} className="hover:bg-muted/50">
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  {manager.name}
                </TableCell>
                <TableCell>{manager.telegram_username}</TableCell>
                <TableCell>
                  <Badge variant="outline">{manager.salary_type}</Badge>
                </TableCell>
                <TableCell>
                  {manager.salary_type === 'Commission-based' ? (
                    <div className="text-sm">
                      <div className="font-medium">Commission-based</div>
                      <div className="text-xs text-muted-foreground">
                        ≥${manager.revenue_threshold?.toLocaleString()} → {manager.commission_rate}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Else → ${manager.fixed_salary?.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <div className="font-medium">Fixed Salary</div>
                      <div className="text-xs text-muted-foreground">
                        ${manager.fixed_salary?.toLocaleString()}
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(manager.status)}>
                    {manager.status}
                  </Badge>
                </TableCell>
                {selectedPeriods.map((period) => {
                  const periodData = getPeriodData(manager, period.id);
                  return (
                    <React.Fragment key={period.id}>
                      <TableCell className="text-center text-sm border-l">
                        <div className="font-mono">
                          ${periodData.week1_salary.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="font-mono">
                          ${periodData.week2_salary.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <div className="font-mono text-primary">
                          ${periodData.total_salary.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={periodData.payment_status}
                          onValueChange={(val) => {
                            onUpdatePaymentStatus(manager.manager_id, period.id, val as 'Paid' | 'Not Paid');
                          }}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Paid">Not Paid</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </React.Fragment>
                  );
                })}
                <TableCell className="sticky right-0 bg-background z-10">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditManager(manager)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteManager(manager)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}





