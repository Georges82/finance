'use client';
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import type { TeamLeader } from '@/app/dashboard/team-leaders/page';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Valid email is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  salaryType: z.enum(['Commission-based', 'Fixed']),
  commissionRate: z.number().optional(),
  fixedSalary: z.number().optional(),
  assignedModels: z.array(z.string()).default([]),
  status: z.enum(['Active', 'Inactive']),
});

type LeaderFormValues = z.infer<typeof formSchema>;

interface LeaderFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: LeaderFormValues) => void;
  leader?: TeamLeader;
}

export function LeaderFormSheet({
  isOpen,
  onClose,
  onSubmit,
  leader,
}: LeaderFormSheetProps) {
  const form = useForm<LeaderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: leader?.name || '',
      email: leader?.email || '',
      phone: leader?.phone || '',
      salaryType: leader?.salaryType || 'Fixed',
      commissionRate: leader?.commissionRate || undefined,
      fixedSalary: leader?.fixedSalary || undefined,
      assignedModels: leader?.assignedModels || [],
      status: leader?.status || 'Active',
    },
  });

  const salaryType = form.watch('salaryType');

  const title = leader ? 'Edit Team Leader' : 'Add New Team Leader';
  const description = leader
    ? 'Update the details for this team leader.'
    : 'Fill in the form to add a new team leader.';

  const handleSubmit = (values: LeaderFormValues) => {
    onSubmit(values);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-6 space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Alex Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="alex.johnson@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select salary type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fixed">Fixed Salary</SelectItem>
                        <SelectItem value="Commission-based">Commission-based</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {salaryType === 'Commission-based' && (
                <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {salaryType === 'Fixed' && (
                <FormField
                  control={form.control}
                  name="fixedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fixed Salary ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="3000" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="mt-auto pt-6 pr-6">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit">Save Changes</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
