'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Users, Star, Edit, Trash2 } from 'lucide-react';
import { AssignmentFormSheet } from '@/components/dashboard/chatter-assignments/assignment-form-sheet';
import { DeleteAssignmentDialog } from '@/components/dashboard/chatter-assignments/delete-assignment-dialog';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Chatter {
  id: string;
  name: string;
  telegram: string;
  country: string;
  shift: 'A' | 'B' | 'C';
  status: 'Active' | 'Inactive';
}

interface Model {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

interface Assignment {
  id: string;
  chatterId: string;
  chatterName: string;
  modelId: string;
  modelName: string;
  date: string;
  hours: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export default function ChatterAssignmentsPage() {
  const { toast } = useToast();
  const [chatters, setChatters] = useState<Chatter[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Load data from API
  useEffect(() => {
    loadChatters();
    loadModels();
    loadAssignments();
  }, []);

  const loadChatters = async () => {
    try {
      const response = await apiService.getAllChatters({});
      if (response.status === 'Success' && response.data) {
        const formattedChatters = response.data.map(chatter => ({
          id: chatter.chatter_id,
          name: chatter.name,
          telegram: chatter.telegram_username,
          country: chatter.country,
          shift: chatter.shift,
          status: chatter.status === 'active' ? 'Active' : 'Inactive'
        }));
        setChatters(formattedChatters);
      }
    } catch (error) {
      console.error('Error loading chatters:', error);
      toast({
        title: "Error",
        description: "Failed to load chatters. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadModels = async () => {
    try {
      const response = await apiService.getAllModels({});
      if (response.status === 'Success' && response.data) {
        const activeModels = response.data
          .filter(model => model.status === 'active')
          .map(model => ({
            id: model.model_id,
            name: model.model_name,
            status: 'Active'
          }));
        setModels(activeModels);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      toast({
        title: "Error",
        description: "Failed to load models. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadAssignments = async () => {
    // For now, we'll use mock assignments since there might not be an API for assignments yet
    // In a real implementation, this would call an API like:
    // const response = await apiService.getAllAssignments({});
    // setAssignments(response.data || []);
    
    // Mock assignments data for demonstration
    const mockAssignments: Assignment[] = [
      {
        id: '1',
        chatterId: '1',
        chatterName: 'John Doe',
        modelId: '1',
        modelName: 'Anastasia',
        date: '2024-01-15',
        hours: 8,
        status: 'Scheduled',
      },
      {
        id: '2',
        chatterId: '2',
        chatterName: 'Jane Smith',
        modelId: '2',
        modelName: 'Isabella',
        date: '2024-01-15',
        hours: 6,
        status: 'Completed',
      },
    ];
    setAssignments(mockAssignments);
  };

  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    setIsFormOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsFormOpen(true);
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      // In a real implementation, this would call an API like:
      // if (selectedAssignment) {
      //   await apiService.updateAssignment(selectedAssignment.id, data);
      // } else {
      //   await apiService.createAssignment(data);
      // }
      // await loadAssignments();
      
      toast({
        title: "Success",
        description: selectedAssignment ? "Assignment updated successfully" : "Assignment created successfully",
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: "Error",
        description: "Failed to save assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedAssignment) {
        // In a real implementation, this would call an API like:
        // await apiService.deleteAssignment(selectedAssignment.id);
        // await loadAssignments();
        
        toast({
          title: "Success",
          description: "Assignment deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedAssignment(null);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.chatterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.modelName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const assignmentData = selectedAssignment || {
    id: '',
    chatterId: '',
    chatterName: '',
    modelId: '',
    modelName: '',
    date: '',
    hours: 0,
    status: 'Scheduled' as const,
  };

  const chatter = chatters.find(c => c.id === assignmentData.chatterId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chatter Assignments</h1>
          <p className="text-muted-foreground">Manage daily chatter assignments to models</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter(a => a.status === 'Scheduled').length} scheduled today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chatters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatters.filter(c => c.status === 'Active').length}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.filter(m => m.status === 'Active').length}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignment
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <CardTitle>Assignments for {new Date().toLocaleDateString()}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select onValueChange={(value) => setStatusFilter(value)} value={statusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chatter</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.chatterName}</TableCell>
                  <TableCell>{assignment.modelName}</TableCell>
                  <TableCell>{new Date(assignment.date).toLocaleDateString()}</TableCell>
                  <TableCell>{assignment.hours}h</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                                     <TableCell>
                     <div className="flex items-center space-x-2">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleEditAssignment(assignment)}
                         title="Edit Assignment"
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDeleteAssignment(assignment)}
                         title="Delete Assignment"
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

             <AssignmentFormSheet
         open={isFormOpen || !!selectedAssignment}
         onOpenChange={(open) => {
           if (!open) {
             setIsFormOpen(false);
             setSelectedAssignment(null);
           }
         }}
         onSubmit={handleFormSubmit}
         assignment={assignmentData}
         chatters={chatters}
         models={models}
       />

       {selectedAssignment && (
         <DeleteAssignmentDialog
           open={isDeleteDialogOpen}
           onOpenChange={setIsDeleteDialogOpen}
           onConfirm={handleDeleteConfirm}
           onCancel={() => setIsDeleteDialogOpen(false)}
           assignment={selectedAssignment}
         />
       )}
    </div>
  );
}
