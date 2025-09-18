
'use client';

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Chatter } from "@/app/dashboard/chatters/page";

const chatters: Chatter[] = [
  {
    id: '1',
    name: 'John Doe',
    telegram: '@johnD',
    country: 'USA',
    shift: 'A',
    status: 'Active',
    lastSalaryPeriod: 'July 2',
    amount: '$2,450.00',
    paymentStatus: 'Paid',
    notes: 'Top performer.',
    rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }
  },
  {
    id: '2',
    name: 'Jane Smith',
    telegram: '@janeS',
    country: 'Canada',
    shift: 'B',
    status: 'Active',
    lastSalaryPeriod: 'July 2',
    amount: '$2,600.00',
    paymentStatus: 'Not Paid',
    notes: '',
    rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }
  },
  {
    id: '3',
    name: 'Peter Jones',
    telegram: '@peterJ',
    country: 'UK',
    shift: 'C',
    status: 'Inactive',
    lastSalaryPeriod: 'July 1',
    amount: '$1,980.00',
    paymentStatus: 'Paid',
    notes: 'On leave.',
    rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }
  },
    {
    id: '4',
    name: 'Maria Garcia',
    telegram: '@mariaG',
    country: 'Spain',
    shift: 'A',
    status: 'Active',
    lastSalaryPeriod: 'July 2',
    amount: '$2,750.00',
    paymentStatus: 'Not Paid',
    notes: '',
    rates: { model1: 3, model2: 4, model3: 5, model4: 5.5, model5: 6 }
  },
];


interface ChatterSelectorProps {
    onChatterSelect: (chatter: Chatter | null) => void;
}

export function ChatterSelector({ onChatterSelect }: ChatterSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? chatters.find((chatter) => chatter.name.toLowerCase() === value)?.name
            : "Select a chatter..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search chatter..." />
          <CommandEmpty>No chatter found.</CommandEmpty>
          <CommandGroup>
            {chatters.map((chatter) => (
              <CommandItem
                key={chatter.id}
                value={chatter.name.toLowerCase()}
                onSelect={(currentValue) => {
                  const selected = chatters.find(c => c.name.toLowerCase() === currentValue);
                  setValue(currentValue === value ? "" : currentValue)
                  onChatterSelect(currentValue === value ? null : selected || null);
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === chatter.name.toLowerCase() ? "opacity-100" : "opacity-0"
                  )}
                />
                {chatter.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
