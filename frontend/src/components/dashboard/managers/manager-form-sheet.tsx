'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Manager } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const managerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['Manager', 'Team Leader']),
  telegramUsername: z.string().min(1, 'Telegram username is required'),
  status: z.enum(['Active', 'Inactive']),
  // Salary Rules
  revenueThreshold: z.number().min(0, 'Revenue threshold must be positive'),
  commissionRate: z.number().min(0, 'Commission rate must be positive'),
  fixedSalary: z.number().min(0, 'Fixed salary must be positive'),
}).refine((data) => {
  return data.revenueThreshold > 0 && data.commissionRate > 0 && data.fixedSalary > 0;
}, {
  message: 'Please fill in all salary rule fields',
  path: ['revenueThreshold'],
});

type ManagerFormData = z.infer<typeof managerFormSchema>;

// Using Manager interface from api.ts instead of local interface

interface ManagerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager?: Manager | null;
  onSave: (data: ManagerFormData) => void;
  type?: 'manager' | 'team_leader'; // Add type prop to differentiate
}

export function ManagerFormSheet({
  open,
  onOpenChange,
  manager,
  onSave,
  type = 'manager', // Default to manager
}: ManagerFormSheetProps) {
  const form = useForm<ManagerFormData>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      name: '',
      role: type === 'team_leader' ? 'Team Leader' : 'Manager',
      telegramUsername: '',
      status: 'Active',
      revenueThreshold: 5000,
      commissionRate: 8,
      fixedSalary: 2000,
    },
  });

  // Reset form when manager changes or form opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: manager?.name || '',
        role: manager?.role || (type === 'team_leader' ? 'Team Leader' : 'Manager'),
        telegramUsername: manager?.telegram_username || '',
        status: manager?.status || 'Active',
        revenueThreshold: manager?.revenue_threshold || 5000,
        commissionRate: manager?.commission_rate || 8,
        fixedSalary: manager?.fixed_salary || 2000,
      });
    }
  }, [open, manager, form, type]);

  const role = form.watch('role');

  const onSubmit = (data: ManagerFormData) => {
    onSave(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset({
        name: '',
        role: type === 'team_leader' ? 'Team Leader' : 'Manager',
        telegramUsername: '',
        status: 'Active',
        revenueThreshold: 5000,
        commissionRate: 8,
        fixedSalary: 2000,
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>
            {manager 
              ? `Edit ${type === 'team_leader' ? 'Team Leader' : 'Manager'}`
              : `Add ${type === 'team_leader' ? 'Team Leader' : 'Manager'}`
            }
          </SheetTitle>
          <SheetDescription>
            {manager 
              ? `Update ${type === 'team_leader' ? 'team leader' : 'manager'} information and salary rules.`
              : `Add a new ${type === 'team_leader' ? 'team leader' : 'manager'} with salary configuration.`
            }
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                                 <FormField
                   control={form.control}
                   name="role"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Role</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select role" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {type === 'team_leader' ? (
                             <SelectItem value="Team Leader">Team Leader</SelectItem>
                           ) : (
                             <SelectItem value="Manager">Manager</SelectItem>
                           )}
                         </SelectContent>
                       </Select>
                       <FormDescription>
                         {type === 'team_leader'
                           ? 'Team leaders manage specific models and chatters'
                           : 'Managers are auto-linked to all models'
                         }
                       </FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="telegramUsername"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Telegram Username</FormLabel>
                       <FormControl>
                         <Input placeholder="@username" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

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

              <Separator />

                             {/* Salary Rules */}
               <div className="space-y-4">
                 <h3 className="text-lg font-medium">Salary Rules</h3>
                 <div className="p-4 bg-muted/50 rounded-lg border">
                   <div className="flex items-center gap-2 mb-3">
                     <div className="w-3 h-3 bg-primary rounded-full"></div>
                     <span className="font-medium">Team Leader / Manager (per model)</span>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="space-y-3">
                       <h4 className="font-medium text-sm">Rule 1: If net revenue ≥ $____ → %____</h4>
                       <div className="grid grid-cols-2 gap-3">
                         <FormField
                           control={form.control}
                           name="revenueThreshold"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-sm">Revenue Threshold ($)</FormLabel>
                               <FormControl>
                                 <Input 
                                   type="number" 
                                   placeholder="5000"
                                   {...field}
                                   onChange={(e) => field.onChange(Number(e.target.value))}
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                         
                         <FormField
                           control={form.control}
                           name="commissionRate"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-sm">Commission Rate (%)</FormLabel>
                               <FormControl>
                                 <Input 
                                   type="number" 
                                   placeholder="8"
                                   {...field}
                                   onChange={(e) => field.onChange(Number(e.target.value))}
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                       </div>
                     </div>
                     
                     <div className="space-y-3">
                       <h4 className="font-medium text-sm">Rule 2: Else → $____ fixed</h4>
                       <FormField
                         control={form.control}
                         name="fixedSalary"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel className="text-sm">Fixed Salary ($)</FormLabel>
                             <FormControl>
                               <Input 
                                 type="number" 
                                 placeholder="2000"
                                 {...field}
                                 onChange={(e) => field.onChange(Number(e.target.value))}
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                     
                     
                   </div>
                 </div>
               </div>
             </form>
           </Form>
         </div>
         
         {/* Fixed Footer with Buttons */}
         <div className="flex-shrink-0 border-t pt-4 mt-6">
           <div className="flex justify-end space-x-2">
             <Button
               type="button"
               variant="outline"
               onClick={() => handleOpenChange(false)}
             >
               Cancel
             </Button>
                                                       <Button 
                 type="button"
                 onClick={form.handleSubmit(onSubmit)}
               >
                 {manager ? 'Update Manager/Team Leader' : 'Add Manager/Team Leader'}
               </Button>
           </div>
         </div>
       </SheetContent>
     </Sheet>
   );
}
