
'use client';
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';

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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiService, ChatterCreatePayload } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  telegram_username: z.string().startsWith('@', {
    message: 'Telegram username must start with @.',
  }).optional(),
  country: z.string().min(2, {
    message: 'Country is required.',
  }),
  shift: z.enum(['A', 'B', 'C']),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  payment_status: z.enum(['Paid', 'Not Paid']).default('Not Paid'),
});

type ChatterFormValues = z.infer<typeof formSchema>;

interface ChatterFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ChatterFormValues) => void;
  chatter?: any; // Using any for now since we're transitioning from mock data
  onChatterCreated?: (chatter: any) => void; // Callback for when chatter is created
}

export function ChatterFormSheet({
  open,
  onOpenChange,
  onSubmit,
  chatter,
  onChatterCreated,
}: ChatterFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChatterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      telegram_username: '@',
      country: '',
      shift: 'A',
      notes: '',
      status: 'active',
      payment_status: 'Not Paid',
    },
  });

  React.useEffect(() => {
    if (chatter) {
      form.reset({
        name: chatter.name,
        telegram_username: chatter.telegram_username || chatter.telegram,
        country: chatter.country,
        shift: chatter.shift as 'A' | 'B' | 'C',
        notes: chatter.notes,
        status: chatter.status || 'active',
        payment_status: chatter.payment_status || 'Not Paid',
      });
    } else {
      form.reset({
        name: '',
        telegram_username: '@',
        country: '',
        shift: 'A',
        notes: '',
        status: 'active',
        payment_status: 'Not Paid',
      });
    }
  }, [chatter, form, open]);

  const handleFormSubmit = async (values: ChatterFormValues) => {
    setIsSubmitting(true);
    try {
      if (chatter) {
        // Update existing chatter
        await onSubmit(values);
      } else {
        // Create new chatter
        const payload: ChatterCreatePayload = {
          name: values.name,
          telegram_username: values.telegram_username,
          country: values.country,
          shift: values.shift,
          notes: values.notes,
          status: values.status,
          payment_status: values.payment_status,
        };

        const response = await apiService.createChatter(payload);
        
        if (response.status === 'Success' && response.data) {
          toast({
            title: "Success",
            description: "Chatter created successfully!",
          });
          
          // Call the callback if provided
          if (onChatterCreated) {
            onChatterCreated(response.data);
          }
          
          // Close the form
          onOpenChange(false);
        } else {
          throw new Error(response.message || 'Failed to create chatter');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create chatter',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = chatter ? 'Edit Chatter' : 'Add New Chatter';
  const description = chatter
    ? 'Update the details for this chatter.'
    : 'Fill in the form to add a new chatter to the system.';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[525px] flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telegram_username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="@username" 
                        {...field} 
                        disabled={!!chatter}
                        className={chatter ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""}
                      />
                    </FormControl>
                    {chatter && (
                      <p className="text-xs text-muted-foreground">
                        Telegram username cannot be changed once set
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A">Shift A</SelectItem>
                        <SelectItem value="B">Shift B</SelectItem>
                        <SelectItem value="C">Shift C</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Not Paid">Not Paid</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional notes about the chatter."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator className="my-6" />
               <div>
                <h3 className="text-lg font-medium">Hourly Rates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To set hourly rate click on the settings button in the action column.
                </p>
              </div>
            </div>

            <SheetFooter className="flex-shrink-0 pt-6">
                <SheetClose asChild>
                    <Button type="button" variant="outline">
                        Cancel
                    </Button>
                </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {chatter ? 'Update' : 'Create'} Chatter
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
