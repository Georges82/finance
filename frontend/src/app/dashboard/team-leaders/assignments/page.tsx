
'use client';

import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TeamLeader } from '../page';
import type { Chatter } from '../../chatters/page';

const initialTeamLeaders: TeamLeader[] = [
  { id: '1', name: 'Alex Johnson', status: 'Active', salaryType: 'Fixed', salaryValue: 3000, commissionPercentage: 0 },
  { id: '2', name: 'Samantha Ray', status: 'Active', salaryType: 'Commission', salaryValue: 0, commissionPercentage: 5 },
];

const initialChatters: (Chatter & { teamLeaderId?: string })[] = [
  { id: '1', name: 'John Doe', telegram: '@johnD', country: 'USA', shift: 'A', status: 'Active', lastSalaryPeriod: 'July 2', amount: '$2,450.00', paymentStatus: 'Paid', notes: 'Top performer.', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }, teamLeaderId: '1' },
  { id: '2', name: 'Jane Smith', telegram: '@janeS', country: 'Canada', shift: 'B', status: 'Active', lastSalaryPeriod: 'July 2', amount: '$2,600.00', paymentStatus: 'Not Paid', notes: '', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }, teamLeaderId: '1' },
  { id: '3', name: 'Peter Jones', telegram: '@peterJ', country: 'UK', shift: 'C', status: 'Inactive', lastSalaryPeriod: 'July 1', amount: '$1,980.00', paymentStatus: 'Paid', notes: 'On leave.', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 } },
  { id: '4', name: 'Maria Garcia', telegram: '@mariaG', country: 'Spain', shift: 'A', status: 'Active', lastSalaryPeriod: 'July 2', amount: '$2,750.00', paymentStatus: 'Not Paid', notes: '', rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 } },
];

interface ChatterListProps {
  title: string;
  chatters: Chatter[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, chatterId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

const ChatterList: React.FC<ChatterListProps> = ({ title, chatters, onDragStart, onDrop, onDragOver }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent 
      onDrop={onDrop} 
      onDragOver={onDragOver}
      className="space-y-2 h-96 overflow-y-auto p-4"
    >
      {chatters.length > 0 ? (
        chatters.map((chatter) => (
          <div
            key={chatter.id}
            draggable
            onDragStart={(e) => onDragStart(e, chatter.id)}
            className="flex items-center p-3 border rounded-lg cursor-grab active:cursor-grabbing bg-background"
          >
            <GripVertical className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="font-medium">{chatter.name}</span>
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground rounded-lg border-dashed border-2">
          Drop chatters here
        </div>
      )}
    </CardContent>
  </Card>
);

export default function TeamLeaderAssignmentsPage() {
  const { toast } = useToast();
  const [teamLeaders] = useState<TeamLeader[]>(initialTeamLeaders);
  const [chatters, setChatters] = useState<(Chatter & { teamLeaderId?: string })[]>(initialChatters);
  const [selectedLeader, setSelectedLeader] = useState<TeamLeader | undefined>(teamLeaders[0]);

  const { unassignedChatters, assignedChatters } = useMemo(() => {
    const unassigned = chatters.filter(c => !c.teamLeaderId);
    const assigned = selectedLeader
      ? chatters.filter(c => c.teamLeaderId === selectedLeader.id)
      : [];
    return { unassignedChatters: unassigned, assignedChatters: assigned };
  }, [chatters, selectedLeader]);

  const handleLeaderChange = (leaderId: string) => {
    const leader = teamLeaders.find(l => l.id === leaderId);
    setSelectedLeader(leader);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, chatterId: string) => {
    e.dataTransfer.setData('chatterId', chatterId);
  };

  const handleDropOnAssigned = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!selectedLeader) return;
    const chatterId = e.dataTransfer.getData('chatterId');
    setChatters(prevChatters =>
      prevChatters.map(c =>
        c.id === chatterId ? { ...c, teamLeaderId: selectedLeader.id } : c
      )
    );
  };

  const handleDropOnUnassigned = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const chatterId = e.dataTransfer.getData('chatterId');
    setChatters(prevChatters =>
      prevChatters.map(c =>
        c.id === chatterId ? { ...c, teamLeaderId: undefined } : c
      )
    );
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleSaveChanges = () => {
    console.log("Saving assignments:", chatters);
    toast({
        title: "Assignments Saved",
        description: `Chatter assignments for ${selectedLeader?.name} have been updated.`
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Team Leader Assignments</h1>
          <p className="text-muted-foreground">
            Assign chatters to team leaders via drag and drop.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChatterList
          title="Unassigned Chatters"
          chatters={unassignedChatters}
          onDragStart={handleDragStart}
          onDrop={handleDropOnUnassigned}
          onDragOver={handleDragOver}
        />
        <ChatterList
          title={selectedLeader ? `Assigned to ${selectedLeader.name}` : "Assigned Chatters"}
          chatters={assignedChatters}
          onDragStart={handleDragStart}
          onDrop={handleDropOnAssigned}
          onDragOver={handleDragOver}
        />
      </div>

       <div className="flex justify-end mt-4">
            <Button onClick={handleSaveChanges} disabled={!selectedLeader}>
                Save Assignments
            </Button>
       </div>
    </div>
  );
}

