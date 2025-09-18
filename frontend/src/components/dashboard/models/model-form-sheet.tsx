
'use client';
import React from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
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
import type { Model } from '@/app/dashboard/models/page';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { apiService, Manager, TeamLeader } from '@/lib/api';


const optionalCoercedNumber = z.preprocess(
  (val) => {
    if (val === '' || val === null || typeof val === 'undefined') return undefined;
    const num = Number(val);
    return isNaN(num) ? val : num;
  },
  z.number().min(0).optional()
);
const optionalBooleanFalse = z.preprocess((val) => (val === '' || val === null || val === undefined ? false : val), z.boolean()).optional();

const formSchema = z.object({
    modelName: z.string().min(2, "Model name is required."),
    clientAgencyName: z.string().min(2, "Client agency name is required."),
    managerName: z.string().optional(),
    teamLeader: z.string().optional(),
    teamLeaderId: z.string().optional(),
    isReferenceModel: z.boolean().optional(),
    referencedModels: z.array(z.string()).optional(),
    status: z.enum(['Active', 'Inactive']),
    paymentStatus: z.enum(['Paid', 'Not Paid']).optional(),
    notes: z.string().optional(),
    earningsType: z.enum(['Type 1', 'Type 2']),
    cutLogic: z.object({
        percentage1: z.coerce.number().optional(),
        threshold: z.coerce.number().optional(),
        fixedAmount: z.coerce.number().optional(),
        percentage2: z.coerce.number().optional(),
    }),
    commissionRules: z.object({
        baseCommission: z.coerce.number().min(0),
        bonusEnabled: optionalBooleanFalse,
        bonusThreshold: optionalCoercedNumber,
        bonusCommission: optionalCoercedNumber,
    }),
}).refine((data) => {
    // For non-reference models, manager and team leader are required
    const isReferenceModel = data.isReferenceModel || (data.referencedModels && data.referencedModels.length > 0);
    if (!isReferenceModel) {
        return data.managerName && data.teamLeader;
    }
    return true;
}, {
    message: "Manager and Team Leader are required for non-reference models",
    path: ["managerName", "teamLeader"]
});

type ModelFormValues = z.infer<typeof formSchema>;

interface ModelFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ModelFormValues) => void;
  model?: Model;
}

export function ModelFormSheet({
  isOpen,
  onClose,
  onSubmit,
  model,
}: ModelFormSheetProps) {
    const defaultValues: ModelFormValues = {
        modelName: '',
        clientAgencyName: '',
        managerName: '',
        teamLeader: '',
        teamLeaderId: undefined,
        isReferenceModel: false,
        referencedModels: [],
        status: 'Active',
        paymentStatus: undefined,
        notes: '',
        earningsType: 'Type 1',
        cutLogic: {
            percentage1: 0,
            threshold: 0,
            fixedAmount: 0,
            percentage2: 0,
        },
        commissionRules: {
            baseCommission: 0,
            bonusEnabled: false,
            bonusThreshold: undefined,
            bonusCommission: undefined,
        },
    };

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: model ? undefined : defaultValues,
  });

  const earningsType = useWatch({
    control: form.control,
    name: "earningsType",
  });

  const bonusEnabledWatch = useWatch({
      control: form.control,
      name: 'commissionRules.bonusEnabled',
  })
  const bonusEnabled = Boolean(bonusEnabledWatch);

  const isReferenceModelCheckbox = useWatch({
    control: form.control,
    name: "isReferenceModel",
  });

  const referencedModels = useWatch({
    control: form.control,
    name: "referencedModels",
  });

  // Check if this is a reference model
  const isReferenceModel = isReferenceModelCheckbox || (referencedModels && referencedModels.length > 0);

  // Clear manager and team leader when reference model checkbox is checked
  React.useEffect(() => {
    if (isReferenceModelCheckbox) {
      form.setValue('managerName', '');
      form.setValue('teamLeader', '');
      form.setValue('teamLeaderId', '');
      form.setValue('referencedModels', []);
    }
  }, [isReferenceModelCheckbox, form]);

  // Clear manager and team leader when reference models are selected
  React.useEffect(() => {
    if (referencedModels && referencedModels.length > 0 && !isReferenceModelCheckbox) {
      form.setValue('managerName', '');
      form.setValue('teamLeader', '');
      form.setValue('teamLeaderId', '');
    }
  }, [referencedModels, isReferenceModelCheckbox, form]);

  React.useEffect(() => {
    if (isOpen) {
        if (model) {
            form.reset({
                ...model,
                isReferenceModel: Boolean(model.referencedModels && model.referencedModels.length > 0),
                earningsType: model.earningsType as 'Type 1' | 'Type 2',
                status: model.status as 'Active' | 'Inactive',
                paymentStatus: (model as any).paymentStatus as 'Paid' | 'Not Paid' | undefined,
                commissionRules: {
                    baseCommission: (model as any).commissionRules?.baseCommission ?? 0,
                    bonusEnabled: Boolean((model as any).commissionRules?.bonusEnabled),
                    bonusThreshold: (model as any).commissionRules?.bonusThreshold ?? undefined,
                    bonusCommission: (model as any).commissionRules?.bonusCommission ?? undefined,
                }
            });
        } else {
            form.reset(defaultValues);
        }
    }
  }, [model, form, isOpen]);

  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [teamLeaders, setTeamLeaders] = React.useState<TeamLeader[]>([]);
  const [selectedTLId, setSelectedTLId] = React.useState<string | undefined>(undefined);
  const [allModelNames, setAllModelNames] = React.useState<string[]>([]);

  // Set teamLeaderId when model is loaded and teamLeader is available
  React.useEffect(() => {
    if (model && model.teamLeader && teamLeaders.length > 0) {
      const matchingTL = teamLeaders.find(tl => tl.name === model.teamLeader);
      if (matchingTL) {
        setSelectedTLId(matchingTL.manager_id);
        form.setValue('teamLeaderId', matchingTL.manager_id, { shouldDirty: false, shouldTouch: false });
      }
    }
  }, [model, teamLeaders, form]);

  // Re-set form values when managers and team leaders data is loaded (for edit mode)
  React.useEffect(() => {
    if (model && isOpen && managers.length > 0 && teamLeaders.length > 0) {
      // Re-set the form values to ensure Select components can find the matching options
      form.setValue('managerName', model.managerName || '', { shouldDirty: false, shouldTouch: false });
      form.setValue('teamLeader', model.teamLeader || '', { shouldDirty: false, shouldTouch: false });
      
      // Also set teamLeaderId if we have the team leader data
      if (model.teamLeader) {
        const matchingTL = teamLeaders.find(tl => tl.name === model.teamLeader);
        if (matchingTL) {
          setSelectedTLId(matchingTL.manager_id);
          form.setValue('teamLeaderId', matchingTL.manager_id, { shouldDirty: false, shouldTouch: false });
        }
      }
    }
  }, [model, isOpen, managers, teamLeaders, form]);

  // Deduplicate by name to avoid duplicate label keys within Select
  const uniqueManagersByName = React.useMemo(() => {
    const seen = new Set<string>();
    return (managers || []).filter((m) => {
      if (seen.has(m.name)) return false;
      seen.add(m.name);
      return true;
    });
  }, [managers]);

  const uniqueTeamLeadersByName = React.useMemo(() => {
    const seen = new Set<string>();
    return (teamLeaders || []).filter((tl: any) => {
      const name = tl.name;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [teamLeaders]);

  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [mgrRes, tlRes, mdlRes] = await Promise.all([
          apiService.getAllManagers({ query: '', sort: 'desc', sort_by: 'created_at' }),
          apiService.getAllTeamLeaders({ query: '', sort: 'desc', sort_by: 'created_at' }),
          apiService.getAllModels({ limit: 1000 })
        ]);
        const allManagers = (mgrRes.data || []).filter(m => m.status === 'Active' && m.role === 'Manager');
        const allTLs = (tlRes.data || []).filter(tl => tl.status === 'Active');
        setManagers(allManagers);
        setTeamLeaders(allTLs);
        // Filter out reference models to prevent double referencing
        const regularModels = (mdlRes.data || []).filter((m) => 
          !m.referencedModels || m.referencedModels.length === 0
        );
        const names = regularModels.map((m) => m.modelName).filter(Boolean);
        const uniqueNames = Array.from(new Set(names));
        setAllModelNames(uniqueNames);
      } catch (e) {
        console.error('Failed fetching managers/team leaders', e);
      }
    })();
  }, [isOpen]);
  

  const title = model ? 'Edit Model' : 'Add New Model';
  const description = model
    ? 'Update the details for this model.'
    : 'Fill in the form to add a new model to the system.';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              const cleaned = {
                ...values,
                teamLeaderId:
                  values.teamLeaderId && values.teamLeaderId !== 'undefined'
                    ? values.teamLeaderId
                    : undefined,
                referencedModels: Array.from(new Set(values.referencedModels || [])),
              };
              onSubmit(cleaned);
            })}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div className='space-y-4 p-1'>
                    <h3 className="text-lg font-medium">Model Details</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField 
                            control={form.control} 
                            name="modelName" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Model Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField 
                            control={form.control} 
                            name="clientAgencyName" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client's Agency Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField 
                            control={form.control} 
                            name="managerName" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Manager Name</FormLabel>
                                    {isReferenceModel && (
                                        <FormDescription className="text-sm text-muted-foreground">
                                            Reference models inherit manager assignments from their child models
                                        </FormDescription>
                                    )}
                                    <Select 
                                        disabled={isReferenceModel}
                                        value={field.value && field.value !== '' ? (() => { 
                                            const m = uniqueManagersByName.find(mm => mm.name === field.value); 
                                            return m ? `${m.manager_id}::${m.name}` : undefined; 
                                        })() : ''}
                                        onValueChange={(val) => {
                                            if (!val || val === '') {
                                                field.onChange('');
                                                return;
                                            }
                                            const parts = val.split('::');
                                            let managerNameFromValue = parts.length > 1 ? parts[1] : val;
                                            // Fallback resolution by name if value lacks id prefix
                                            if (parts.length === 1) {
                                                const m = uniqueManagersByName.find(mm => mm.name === managerNameFromValue);
                                                managerNameFromValue = m?.name || managerNameFromValue;
                                            }
                                            field.onChange(managerNameFromValue);
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isReferenceModel ? "Not applicable for reference models" : "Select a manager"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {uniqueManagersByName.map((m) => (
                                                <SelectItem key={m.manager_id} value={`${m.manager_id}::${m.name}`}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField 
                            control={form.control} 
                            name="teamLeader" 
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Team Leader</FormLabel>
                                    {isReferenceModel && (
                                        <FormDescription className="text-sm text-muted-foreground">
                                            Reference models inherit team leader assignments from their child models
                                        </FormDescription>
                                    )}
                                    <Select 
                                        disabled={isReferenceModel}
                                        value={field.value && field.value !== '' ? (() => { 
                                            const tl: any = uniqueTeamLeadersByName.find(t => t.name === field.value); 
                                            return tl ? `${tl.manager_id}::${tl.name}` : undefined; 
                                        })() : ''}
                                        onValueChange={(val) => {
                                            if (!val || val === '') {
                                                field.onChange('');
                                                setSelectedTLId('');
                                                form.setValue('teamLeaderId', '', { shouldDirty: true, shouldTouch: true });
                                                return;
                                            }
                                            const parts = val.split('::');
                                            let selectedTlId = parts.length > 1 ? parts[0] : undefined;
                                            let selectedName = parts.length > 1 ? parts[1] : val;
                                            if (!selectedTlId) {
                                                const tl = uniqueTeamLeadersByName.find(t => (t as any).name === selectedName);
                                                selectedTlId = (tl as any)?.manager_id;
                                            }
                                            field.onChange(selectedName);
                                            setSelectedTLId(selectedTlId);
                                            form.setValue('teamLeaderId', selectedTlId ?? undefined, { shouldDirty: true, shouldTouch: true });
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={isReferenceModel ? "Not applicable for reference models" : "Select a team leader"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {uniqueTeamLeadersByName.map((tl: any) => (
                                                <SelectItem key={tl.manager_id} value={`${tl.manager_id}::${tl.name}`}>
                                                    {tl.name}
                                                </SelectItem>
                                            ))}
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
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
                    <FormField 
                        control={form.control} 
                        name="isReferenceModel" 
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Is this a reference model?
                                    </FormLabel>
                                    <FormDescription>
                                        Reference models inherit manager and team leader assignments from their child models
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField 
                        control={form.control} 
                        name="referencedModels" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Which model do you want to refer?</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!isReferenceModelCheckbox}
                                                className={cn(
                                                    "w-full justify-between",
                                                    !field.value?.length && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value?.length ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {field.value.slice(0, 2).map((model) => (
                                                            <Badge
                                                                key={model}
                                                                variant="secondary"
                                                                className="mr-1"
                                                            >
                                                                {model}
                                                            </Badge>
                                                        ))}
                                                        {field.value.length > 2 && (
                                                            <Badge variant="secondary">
                                                                +{field.value.length - 2} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    "Select models to reference..."
                                                )}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search models..." />
                                            <CommandEmpty>No model found.</CommandEmpty>
                                            <CommandGroup>
                                                {allModelNames.map((modelName) => (
                                                    <CommandItem
                                                        key={modelName}
                                                        onSelect={() => {
                                                            const currentValues = field.value || [];
                                                            const isSelected = currentValues.includes(modelName);
                                                            
                                                            if (isSelected) {
                                                                field.onChange(currentValues.filter(value => value !== modelName));
                                                            } else {
                                                                field.onChange([...currentValues, modelName]);
                                                            }
                                                        }}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                field.value?.includes(modelName)
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "opacity-50 [&_svg]:invisible"
                                                            )}
                                                        >
                                                            {field.value?.includes(modelName) && (
                                                                <svg
                                                                    className="h-3 w-3"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        {modelName}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {field.value?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {field.value.map((model) => (
                                            <Badge
                                                key={model}
                                                variant="secondary"
                                                className="flex items-center gap-1"
                                            >
                                                {model}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                                    onClick={() => {
                                                        field.onChange(field.value?.filter(value => value !== model));
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField 
                    control={form.control} 
                    name="notes" 
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator />

                <div className='space-y-4 p-1'>
                    <h3 className="text-lg font-medium">Payment</h3>
                    <FormField 
                        control={form.control} 
                        name="paymentStatus" 
                        render={({ field }) => (
                            <FormItem className='max-w-xs'>
                                <FormLabel>Payment Status (optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Not set" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Not Paid">Not Paid</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className='space-y-4 p-1'>
                    <h3 className="text-lg font-medium">Agency Earnings Cut</h3>
                    {isReferenceModel && (
                        <div className="p-3 bg-muted/50 border rounded-md">
                            <p className="text-sm text-muted-foreground">
                                Agency cut and commission rules are disabled for reference models. 
                                These will be calculated using the individual referenced model's rules.
                            </p>
                        </div>
                    )}
                    <FormField
                        control={form.control}
                        name="earningsType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Earnings Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-1"
                                        disabled={isReferenceModel}
                                    >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="Type 1" disabled={isReferenceModel} />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Type 1: Percentage above threshold, fixed amount below
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="Type 2" disabled={isReferenceModel} />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Type 2: Flat percentage of total earnings
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {earningsType === 'Type 1' && !isReferenceModel && (
                        <div className='p-4 border rounded-md bg-muted/50 space-y-4'>
                            <p className='text-sm text-muted-foreground'>Agency takes a percentage if weekly earnings are above a threshold, otherwise a fixed amount.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <FormField 
                                    control={form.control} 
                                    name="cutLogic.percentage1" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Percentage</FormLabel>
                                            <FormControl>
                                                <div className='flex items-center gap-2'>
                                                    <NumberInput {...field} disabled={isReferenceModel} />
                                                    <span className='text-muted-foreground'>%</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField 
                                    control={form.control} 
                                    name="cutLogic.threshold" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IF earnings ≥</FormLabel>
                                            <FormControl>
                                                <div className='flex items-center gap-2'>
                                                    <span className='text-muted-foreground'>$</span>
                                                    <NumberInput {...field} disabled={isReferenceModel} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField 
                                    control={form.control} 
                                    name="cutLogic.fixedAmount" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ELSE fixed amount</FormLabel>
                                            <FormControl>
                                                <div className='flex items-center gap-2'>
                                                    <span className='text-muted-foreground'>$</span>
                                                    <NumberInput {...field} disabled={isReferenceModel} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    )}
                    {earningsType === 'Type 2' && !isReferenceModel && (
                        <div className='p-4 border rounded-md bg-muted/50 space-y-4'>
                            <p className='text-sm text-muted-foreground'>Agency takes a flat percentage of total weekly earnings.</p>
                            <FormField 
                                control={form.control} 
                                name="cutLogic.percentage2" 
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Percentage</FormLabel>
                                        <FormControl>
                                            <div className='flex items-center gap-2 w-1/2'>
                                                <NumberInput {...field} disabled={isReferenceModel} />
                                                <span className='text-muted-foreground'>%</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                </div>

                <Separator />

                <div className='space-y-4 p-1'>
                    <h3 className="text-lg font-medium">Chatter Commission Rules</h3>
                    {!isReferenceModel ? (
                        <div className='p-4 border rounded-md bg-muted/50 space-y-4'>
                            <FormField 
                                control={form.control} 
                                name="commissionRules.baseCommission" 
                                render={({ field }) => (
                                    <FormItem className='max-w-xs'>
                                        <FormLabel>Base Commission</FormLabel>
                                        <FormControl>
                                            <div className='flex items-center gap-2'>
                                                <NumberInput {...field} disabled={isReferenceModel} />
                                                <span className='text-muted-foreground'>%</span>
                                            </div>
                                        </FormControl>
                                        <FormDescription>Default commission chatter receives for this model.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="commissionRules.bonusEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Enable Bonus Commission
                                            </FormLabel>
                                            <FormDescription>
                                                Apply a bonus commission rate if a chatter's shift earnings exceed a certain amount.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={!!field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isReferenceModel}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 items-end transition-opacity", bonusEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none')}>
                                <FormField 
                                    control={form.control} 
                                    name="commissionRules.bonusThreshold" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>If shift earns {'>'}</FormLabel>
                                            <FormControl>
                                                <div className='flex items-center gap-2'>
                                                    <span className='text-muted-foreground'>$</span>
                                                    <NumberInput
                                                        value={field.value ?? ''}
                                                        onChange={field.onChange}
                                                        disabled={!bonusEnabled || isReferenceModel}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField 
                                    control={form.control} 
                                    name="commissionRules.bonusCommission" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bonus Commission</FormLabel>
                                            <FormControl>
                                                <div className='flex items-center gap-2'>
                                                    <NumberInput
                                                        value={field.value ?? ''}
                                                        onChange={field.onChange}
                                                        disabled={!bonusEnabled || isReferenceModel}
                                                    />
                                                    <span className='text-muted-foreground'>%</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-muted/50 border rounded-md">
                            <p className="text-sm text-muted-foreground">
                                Commission rules are disabled for reference models. 
                                Commission will be calculated using each referenced model's individual rules.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <SheetFooter className="flex-shrink-0 pt-6">
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
