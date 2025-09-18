
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { apiService } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const rateFormSchema = z.object({
  rate1Model: z.coerce.number().min(0, "Rate must be positive"),
  rate2Models: z.coerce.number().min(0, "Rate must be positive"),
  rate3Models: z.coerce.number().min(0, "Rate must be positive"),
  rate4Models: z.coerce.number().min(0, "Rate must be positive"),
  rate5Models: z.coerce.number().min(0, "Rate must be positive"),
});

type RateFormValues = z.infer<typeof rateFormSchema>;

interface ChatterRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RateFormValues) => void;
  chatterName: string;
  chatterId: string;
}

export function ChatterRateModal({
  open,
  onOpenChange,
  onSubmit,
  chatterName,
  chatterId,
}: ChatterRateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentRates, setCurrentRates] = useState<RateFormValues | null>(null);

  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: {
      rate1Model: 3.50,
      rate2Models: 4.00,
      rate3Models: 4.50,
      rate4Models: 5.00,
      rate5Models: 5.50,
    },
  });

  // Fetch rates when modal opens
  useEffect(() => {
    if (open && chatterId) {
      fetchRates();
    }
  }, [open, chatterId]);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getChatterRates(chatterId);
      
      if (response.status === 'Success' && response.data) {
        // Convert the rates array to the form format
        const ratesMap: { [key: number]: number } = {};
        response.data.forEach((rate: any) => {
          ratesMap[rate.models_count] = rate.hourly_rate;
        });

        const formRates = {
          rate1Model: ratesMap[1] || 3.50,
          rate2Models: ratesMap[2] || 4.00,
          rate3Models: ratesMap[3] || 4.50,
          rate4Models: ratesMap[4] || 5.00,
          rate5Models: ratesMap[5] || 5.50,
        };

        setCurrentRates(formRates);
        form.reset(formRates);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      // Keep default values if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (values: RateFormValues) => {
    console.log('Submitting rates:', values);
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Hourly Rates for {chatterName}</DialogTitle>
          <DialogDescription>
            Configure hourly rates based on the number of models worked simultaneously.
            {currentRates && (
              <span className="mt-2 text-sm block">
                Current base rate: ${currentRates.rate1Model}/hr for 1 model
              </span>
            )}
            {isLoading && (
              <span className="mt-2 text-sm block text-blue-600">
                <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                Loading current rates...
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="rate1Model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1 Model = $____ / hr</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <NumberInput step="0.01" min="0" {...field} />
                        <span className="text-muted-foreground">/hr</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate2Models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2 Models = $____ / hr</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <NumberInput step="0.01" min="0" {...field} />
                        <span className="text-muted-foreground">/hr</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate3Models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3 Models = $____ / hr</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <NumberInput step="0.01" min="0" {...field} />
                        <span className="text-muted-foreground">/hr</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate4Models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>4 Models = $____ / hr</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <NumberInput step="0.01" min="0" {...field} />
                        <span className="text-muted-foreground">/hr</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate5Models"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>5 Models = $____ / hr</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <NumberInput step="0.01" min="0" {...field} />
                        <span className="text-muted-foreground">/hr</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Save & Apply'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
