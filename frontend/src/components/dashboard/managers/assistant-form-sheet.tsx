"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Assistant } from "@/lib/api"

// Using Assistant interface from api.ts instead of local interface

// Form schema for assistant
const assistantFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  role: z.literal('Assistant'),
  telegramUsername: z.string().min(1, "Telegram username is required"),
  status: z.enum(['Active', 'Inactive']),
  salaryType: z.literal('Fixed'),
  fixedSalary: z.number().min(0, "Fixed salary must be positive"),
  salaryPeriod: z.enum(['Weekly', 'Bi-weekly', 'Monthly']),
})

type AssistantFormValues = z.infer<typeof assistantFormSchema>

interface AssistantFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistant?: Assistant | null
  onSubmit: (data: AssistantFormValues) => void
}

export function AssistantFormSheet({
  open,
  onOpenChange,
  assistant,
  onSubmit,
}: AssistantFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AssistantFormValues>({
    resolver: zodResolver(assistantFormSchema),
    defaultValues: {
      fullName: "",
      role: 'Assistant',
      telegramUsername: "",
      status: 'Active',
      salaryType: 'Fixed',
      fixedSalary: 0,
      salaryPeriod: 'Weekly',
    },
  })

  // Reset form when assistant changes
  useEffect(() => {
    if (assistant) {
      form.reset({
        fullName: assistant.name,
        role: assistant.role,
        telegramUsername: assistant.telegram_username,
        status: assistant.status,
        salaryType: assistant.salary_type,
        fixedSalary: assistant.fixed_salary,
        salaryPeriod: assistant.salary_period,
      })
    } else {
      form.reset({
        fullName: "",
        role: 'Assistant',
        telegramUsername: "",
        status: 'Active',
        salaryType: 'Fixed',
        fixedSalary: 0,
        salaryPeriod: 'Weekly',
      })
    }
  }, [assistant, form])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (data: AssistantFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleOpenChange(false)
    } catch (error) {
      console.error("Error submitting assistant form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>
            {assistant ? 'Edit Assistant' : 'Add Assistant'}
          </SheetTitle>
          <SheetDescription>
            {assistant 
              ? 'Update assistant information and salary configuration.'
              : 'Add a new assistant with fixed salary configuration.'
            }
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="fullName"
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
                          <SelectItem value="Assistant">Assistant</SelectItem>
                        </SelectContent>
                      </Select>
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
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <h3 className="text-lg font-medium">Salary Rules</h3>
                </div>
                
                <div className="bg-muted/50 border rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="font-medium">Assistant</span>
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fixedSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fixed Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salaryPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Period</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Weekly">per week</SelectItem>
                              <SelectItem value="Bi-weekly">per bi-weekly</SelectItem>
                              <SelectItem value="Monthly">per monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className="flex-shrink-0 flex justify-end space-x-2 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
          >
            {assistant ? 'Update Assistant' : 'Add Assistant'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
