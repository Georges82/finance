
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { LeaderFormSheet } from '@/components/dashboard/team-leaders/leader-form-sheet';
import { DeleteLeaderDialog } from '@/components/dashboard/team-leaders/delete-leader-dialog';
import { teamLeaders } from '@/lib/shared-data';

interface TeamLeader {
  id: string;
  name: string;
  email: string;
  phone: string;
  salaryType: 'Commission-based' | 'Fixed';
  commissionRate?: number;
  fixedSalary?: number;
  week1Salary: number;
  week2Salary: number;
  totalSalary: number;
  paymentStatus: 'Paid' | 'Not Paid';
  assignedModels: string[];
  status: 'Active' | 'Inactive';
}

const mockTeamLeaders: TeamLeader[] = teamLeaders;

export default function TeamLeadersPage() {
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>(mockTeamLeaders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salaryTypeFilter, setSalaryTypeFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<TeamLeader | null>(null);
  const [deletingLeader, setDeletingLeader] = useState<TeamLeader | null>(null);

  const filteredLeaders = teamLeaders.filter(leader => {
    const matchesSearch = leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leader.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || leader.status === statusFilter;
    const matchesSalaryType = salaryTypeFilter === 'all' || leader.salaryType === salaryTypeFilter;
    return matchesSearch && matchesStatus && matchesSalaryType;
  });

  const handleAddLeader = (leaderData: Omit<TeamLeader, 'id' | 'week1Salary' | 'week2Salary' | 'totalSalary' | 'paymentStatus'>) => {
    const newLeader: TeamLeader = {
      ...leaderData,
      id: Date.now().toString(),
      week1Salary: 0,
      week2Salary: 0,
      totalSalary: 0,
      paymentStatus: 'Not Paid',
    };
    setTeamLeaders([...teamLeaders, newLeader]);
    setIsFormOpen(false);
  };

  const handleEditLeader = (leaderData: TeamLeader) => {
    setTeamLeaders(teamLeaders.map(l => l.id === leaderData.id ? leaderData : l));
    setEditingLeader(null);
  };

  const handleDeleteLeader = (leader: TeamLeader) => {
    setDeletingLeader(leader);
  };

  const confirmDeleteLeader = () => {
    if (deletingLeader) {
      setTeamLeaders(teamLeaders.filter(l => l.id !== deletingLeader.id));
      setDeletingLeader(null);
    }
  };

  const cancelDeleteLeader = () => {
    setDeletingLeader(null);
  };

  const handlePaymentStatusChange = (leaderId: string, newStatus: 'Paid' | 'Not Paid') => {
    setTeamLeaders(prev => prev.map(leader => 
      leader.id === leaderId ? { ...leader, paymentStatus: newStatus } : leader
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSalary = filteredLeaders.reduce((sum, leader) => sum + leader.totalSalary, 0);
  const pendingPayments = filteredLeaders.filter(leader => leader.paymentStatus === 'Not Paid').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Leaders</h1>
          <p className="text-muted-foreground">Manage team leaders and their salary structures</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Team Leader
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leaders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamLeaders.length}</div>
            <p className="text-xs text-muted-foreground">
              {teamLeaders.filter(l => l.status === 'Active').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Leaders to pay
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle>Team Leaders List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leaders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={salaryTypeFilter} onValueChange={setSalaryTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Salary Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Commission-based">Commission</SelectItem>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Salary Type</TableHead>
                <TableHead>Week 1</TableHead>
                <TableHead>Week 2</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Assigned Models</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaders.map((leader) => (
                <TableRow key={leader.id}>
                  <TableCell className="font-medium">{leader.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{leader.email}</div>
                      <div className="text-muted-foreground">{leader.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{leader.salaryType}</div>
                      {leader.salaryType === 'Commission-based' && (
                        <div className="text-muted-foreground">{leader.commissionRate}%</div>
                      )}
                      {leader.salaryType === 'Fixed' && (
                        <div className="text-muted-foreground">${leader.fixedSalary?.toLocaleString()}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${leader.week1Salary.toLocaleString()}</TableCell>
                  <TableCell>${leader.week2Salary.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">${leader.totalSalary.toLocaleString()}</TableCell>
                  <TableCell>
                    <Select
                      value={leader.paymentStatus}
                      onValueChange={(value: 'Paid' | 'Not Paid') => 
                        handlePaymentStatusChange(leader.id, value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Not Paid">Not Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {leader.assignedModels.join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(leader.status)}>
                      {leader.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLeader(leader)}
                        title="Edit Leader"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLeader(leader)}
                        title="Delete Leader"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeaderFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddLeader}
      />

      {editingLeader && (
        <LeaderFormSheet
          open={!!editingLeader}
          onOpenChange={() => setEditingLeader(null)}
          leader={editingLeader}
          onSubmit={handleEditLeader}
        />
      )}

      {deletingLeader && (
        <DeleteLeaderDialog
          leader={deletingLeader}
          onConfirm={confirmDeleteLeader}
          onCancel={cancelDeleteLeader}
        />
      )}
    </div>
  );
}
