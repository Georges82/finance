'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Assistant } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface AssistantWithSalaries extends Assistant {
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

interface AssistantPeriodTableProps {
  assistants: AssistantWithSalaries[];
  selectedPeriods: Period[];
  loading: boolean;
  getStatusColor: (status: string) => string;
  onUpdatePaymentStatus: (assistantId: string, periodId: string, status: 'Paid' | 'Not Paid') => void;
  onEditAssistant: (assistant: Assistant) => void;
  onDeleteAssistant: (assistant: Assistant) => void;
}

export function AssistantPeriodTable({
  assistants,
  selectedPeriods,
  loading,
  getStatusColor,
  onUpdatePaymentStatus,
  onEditAssistant,
  onDeleteAssistant
}: AssistantPeriodTableProps) {
  const getPeriodData = (assistant: AssistantWithSalaries, periodId: string) => {
    return assistant.period_salaries?.[periodId] || {
      week1_salary: 0,
      week2_salary: 0,
      total_salary: 0,
      payment_status: 'Not Paid' as const
    };
  };

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
            <TableRow key="loading-assistants">
              <TableCell colSpan={5 + selectedPeriods.length * 4} className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Loading assistants...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : assistants.length === 0 ? (
            <TableRow key="no-assistants">
              <TableCell colSpan={5 + selectedPeriods.length * 4} className="text-center py-8">
                <div className="text-muted-foreground">
                  No assistants found
                </div>
              </TableCell>
            </TableRow>
          ) : (
            assistants.map((assistant) => (
              <TableRow key={`assistant-${assistant.assistant_id}`} className="hover:bg-muted/50">
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  {assistant.name}
                </TableCell>
                <TableCell>{assistant.telegram_username}</TableCell>
                <TableCell>
                  <Badge variant="outline">{assistant.salary_type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">Fixed Salary</div>
                    <div className="text-xs text-muted-foreground">
                      ${assistant.fixed_salary?.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {assistant.salary_period} payment
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(assistant.status)}>
                    {assistant.status}
                  </Badge>
                </TableCell>
                {selectedPeriods.map((period) => {
                  const periodData = getPeriodData(assistant, period.id);
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
                            onUpdatePaymentStatus(assistant.assistant_id, period.id, val as 'Paid' | 'Not Paid');
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
                      onClick={() => onEditAssistant(assistant)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteAssistant(assistant)}
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


