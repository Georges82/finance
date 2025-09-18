'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Manager } from '@/lib/api';

// Using Manager interface from api.ts instead of local interface

interface DeleteManagerDialogProps {
  manager: Manager | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteManagerDialog({
  manager,
  onOpenChange,
  onConfirm,
}: DeleteManagerDialogProps) {
  const isOpen = manager !== null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Manager</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{manager?.name}</strong> ({manager?.role})?
            <br />
            <br />
            This action cannot be undone. All salary data and period information will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
