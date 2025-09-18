
'use client';

import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TeamLeader } from '../page';
import type { Chatter } from '../../chatters/page';
import { Separator } from '@/components/ui/separator';

const initialTeamLeaders: TeamLeader[] = [
  { id: '1', name: 'Alex Johnson', status: 'Active', salaryType: 'Fixed', salaryValue: 3000, commissionPercentage: 0 },
  { id: '2', name: 'Samantha Ray', status: 'Active', salaryType: 'Commission', salaryValue: 0, commissionPercentage: 5 },
];

const initialChatters: (Chatter & { teamLeaderId?: string })[] = [
  { id: '1', name: 'John Doe', telegram: '@johnD', country: 'USA', shift: 'A', status: 'Active', lastSalaryPeriod: 'July 2', amount: '$2,450.00', paymentStatus: 'Paid', notes: 'Top performer.', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }, teamLeaderId: '1' },
  { id: '2', name: 'Jane Smith', telegram: '@janeS', country: 'Canada', shift: 'B', status: 'Active', lastSalaryPeriod: 'July 2', amount: '$2,600.00', paymentStatus: 'Not Paid', notes: '', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }, teamLeaderId: '1' },
  { id: '3', name: 'Peter Jones', telegram: '@peterJ', country: 'UK', shift: 'C', status: 'Inactive', lastSalaryPeriod: 'July 1', amount: '$1,980.00', paymentStatus: 'Paid', notes: 'On leave.', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }, teamLeaderId: '2' },
  { id: '4', name: 'Maria Garcia', telegram: '@mariaG', country: 'Spain', shift: 'A', status: 'Active', lastSalaryPeriod: 'July 2', amount: '$2,750.00', paymentStatus: 'Not Paid', notes: '', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 } },
];

const getMockTeamData = (teamLeaderId?: string) => {
    if (!teamLeaderId) return {
        totalNetSales: 0,
        totalChatterPayout: 0,
        totalModelProfit: 0,
    };
    if (teamLeaderId === '1') {
        return {
            totalNetSales: 15000,
            totalChatterPayout: 5050,
            totalModelProfit: 9950,
        }
    }
    if (teamLeaderId === '2') {
        return {
            totalNetSales: 8000,
            totalChatterPayout: 1980,
            totalModelProfit: 6020,
        }
    }
    return {
        totalNetSales: 0,
        totalChatterPayout: 0,
        totalModelProfit: 0,
    };
}


export default function TeamLeaderOverviewPage() {
  const [teamLeaders] = useState<TeamLeader[]>(initialTeamLeaders);
  const [chatters] = useState<(Chatter & { teamLeaderId?: string })[]>(initialChatters);
  const [selectedLeader, setSelectedLeader] = useState<TeamLeader | undefined>(teamLeaders[0]);

  const assignedChatters = useMemo(() => {
    return selectedLeader
      ? chatters.filter(c => c.teamLeaderId === selectedLeader.id)
      : [];
  }, [chatters, selectedLeader]);
  
  const teamData = useMemo(() => {
    return getMockTeamData(selectedLeader?.id);
  }, [selectedLeader]);

  const leaderSalary = useMemo(() => {
    if (!selectedLeader) return { amount: 0, type: 'N/A' };
    if (selectedLeader.salaryType === 'Fixed') {
        return { amount: selectedLeader.salaryValue, type: 'Fixed Salary' };
    }
    if (selectedLeader.salaryType === 'Commission') {
        const commission = teamData.totalModelProfit * (selectedLeader.commissionPercentage / 100);
        return { amount: commission, type: `${selectedLeader.commissionPercentage}% Commission` };
    }
    return { amount: 0, type: 'N/A' };
  }, [selectedLeader, teamData]);


  const handleLeaderChange = (leaderId: string) => {
    const leader = teamLeaders.find(l => l.id === leaderId);
    setSelectedLeader(leader);
  };
  

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Team Overview</h1>
          <p className="text-muted-foreground">
            View team composition, performance, and leader salaries.
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Select
            onValueChange={handleLeaderChange}
            defaultValue={selectedLeader?.id}
          >
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Select a Team Leader" />
            </SelectTrigger>
            <SelectContent>
              {teamLeaders.map((leader) => (
                <SelectItem key={leader.id} value={leader.id}>
                  {leader.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {selectedLeader ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Roster</CardTitle>
                        <CardDescription>Chatters assigned to {selectedLeader.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Shift</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedChatters.map(chatter => (
                                    <TableRow key={chatter.id}>
                                        <TableCell className='font-medium'>{chatter.name}</TableCell>
                                        <TableCell>{chatter.country}</TableCell>
                                        <TableCell>{chatter.shift}</TableCell>
                                        <TableCell>{chatter.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Team Performance</CardTitle>
                        <CardDescription>Aggregated data for this period.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className='text-muted-foreground'>Total Net Sales</span>
                            <span className='font-medium'>${teamData.totalNetSales.toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className='text-muted-foreground'>Total Chatter Payout</span>
                            <span className='font-medium'>${teamData.totalChatterPayout.toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className='text-muted-foreground'>Total Model Profit</span>
                            <span className='font-medium text-green-600'>${teamData.totalModelProfit.toLocaleString('en-US')}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <h4 className='font-medium'>Leader Salary Calculation</h4>
                             <div className="flex justify-between text-sm">
                                <span className='text-muted-foreground'>Type</span>
                                <span className='font-medium'>{leaderSalary.type}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                <span>Total Payout</span>
                                <span className='text-primary'>
                                    ${leaderSalary.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      ) : (
        <Card className='flex items-center justify-center h-64'>
            <p className='text-muted-foreground'>Please select a team leader to see their overview.</p>
        </Card>
      )}
    </div>
  );
}
