"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Assistant } from "@/lib/api"

// Using Assistant interface from api.ts instead of local interface

interface DeleteAssistantDialogProps {
  assistant: Assistant | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteAssistantDialog({
  assistant,
  onOpenChange,
  onConfirm,
}: DeleteAssistantDialogProps) {
  return (
    <AlertDialog open={!!assistant} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Assistant</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {assistant?.name}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
