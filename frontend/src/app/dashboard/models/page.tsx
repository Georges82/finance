
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';
import { ModelFormSheet } from '@/components/dashboard/models/model-form-sheet';
import { DeleteModelDialog } from '@/components/dashboard/models/delete-model-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiService, type ModelRecord } from '@/lib/api';

export type Model = ModelRecord;

const formatCutLogic = (model: Model) => {
  if (model.earningsType === 'Type 1' && model.cutLogic) {
    const { percentage1, threshold, fixedAmount } = model.cutLogic;
    return `${percentage1}% if > $${threshold}/wk; else $${fixedAmount}`;
  }
  if (model.earningsType === 'Type 2' && model.cutLogic) {
    return `${model.cutLogic.percentage2}% of total earnings`;
  }
  return 'N/A';
};


export default function ModelsPage() {
  const [models, setModels] = React.useState<Model[]>([]);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<Model | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [clientFilter, setClientFilter] = React.useState('All');
  const [managerFilter, setManagerFilter] = React.useState('All');

  const loadModels = React.useCallback(async () => {
    try {
      const res = await apiService.getAllModels({});
      setModels(res.data || []);
    } catch (e) {
      console.error('Failed to load models', e);
    }
  }, []);

  React.useEffect(() => {
    loadModels();
  }, [loadModels]);


  const handleAddModel = () => {
    setSelectedModel(undefined);
    setIsSheetOpen(true);
  };

  const handleEditModel = (model: Model) => {
    setSelectedModel(model);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedModel(undefined);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedModel) {
        await apiService.updateModel(selectedModel.model_id, values);
      } else {
        await apiService.createModel(values);
      }
      await loadModels();
    } catch (e) {
      console.error('Failed to save model', e);
    } finally {
      handleSheetClose();
    }
  };
  
  const handleOpenDeleteDialog = (model: Model) => {
    setSelectedModel(model);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedModel) {
        await apiService.deleteModel(selectedModel.model_id);
        await loadModels();
      }
    } catch (e) {
      console.error('Failed to delete model', e);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedModel(undefined);
    }
  };
    
  const filteredModels = React.useMemo(() => {
    return models
      .filter(model => {
        const searchLower = searchTerm.toLowerCase();
        return (
          model.modelName.toLowerCase().includes(searchLower) ||
          model.clientAgencyName.toLowerCase().includes(searchLower) ||
          (model.managerName && model.managerName.toLowerCase().includes(searchLower)) ||
          (model.teamLeader && model.teamLeader.toLowerCase().includes(searchLower)) ||
          model.earningsType.toLowerCase().includes(searchLower) ||
          formatCutLogic(model).toLowerCase().includes(searchLower)
        );
      })
      .filter(model => {
        if (statusFilter === 'All') return true;
        return model.status === statusFilter;
      })
      .filter(model => {
        if (clientFilter === 'All') return true;
        return model.clientAgencyName === clientFilter;
      })
      .filter(model => {
        if (managerFilter === 'All') return true;
        return model.managerName === managerFilter;
      })
      .sort((a, b) => a.clientAgencyName.localeCompare(b.clientAgencyName));
  }, [models, searchTerm, statusFilter, clientFilter, managerFilter]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Models</h1>
            <p className="text-muted-foreground">
              Manage model profiles, commissions, and client links.
            </p>
          </div>
          <Button onClick={handleAddModel} className="mt-4 md:mt-0">Add New Model</Button>
        </header>

         <div className="flex items-center gap-4 flex-wrap">
          <Input
            placeholder="Filter by name, agency, manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Clients</SelectItem>
              {Array.from(new Set(models.map(m => m.clientAgencyName).filter(name => name && name.trim() !== ''))).map(client => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Managers</SelectItem>
              {Array.from(new Set(models.map(m => m.managerName).filter(name => name && name.trim() !== ''))).map(manager => (
                <SelectItem key={manager} value={manager}>{manager}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Client's Agency Name</TableHead>
                <TableHead>Manager Name</TableHead>
                <TableHead>Earnings Type</TableHead>
                <TableHead>Cut Logic</TableHead>
                <TableHead>TL</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : filteredModels.map((model) => (
                <TableRow key={model.model_id}>
                  <TableCell className="font-medium">{model.modelName}</TableCell>
                  <TableCell>{model.clientAgencyName}</TableCell>
                  <TableCell>{model.managerName}</TableCell>
                  <TableCell>
                     <Badge variant="outline">{model.earningsType}</Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatCutLogic(model)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{model.teamLeader}</TableCell>
                  <TableCell>
                    <Badge variant={ model.paymentStatus === 'Paid' ? 'default' : 'secondary' }>
                      {model.paymentStatus || 'Not Set'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        model.status === 'Active' ? 'default' : 'secondary'
                      }
                    >
                      {model.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditModel(model)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(model)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <ModelFormSheet
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        onSubmit={handleFormSubmit}
        model={selectedModel}
      />
      <DeleteModelDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        modelName={selectedModel?.modelName}
      />
    </>
  );
}
