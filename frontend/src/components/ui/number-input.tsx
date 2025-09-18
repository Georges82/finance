import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number | string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  allowEmpty?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, allowEmpty = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (value === undefined || value === null) return ''
      return String(value)
    })

    // Update display value when prop value changes
    React.useEffect(() => {
      if (value === undefined || value === null) {
        setDisplayValue('')
      } else {
        setDisplayValue(String(value))
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)

      // Always call the original onChange with the event
      // This maintains compatibility with both React Hook Form and regular onChange handlers
      onChange?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace to clear the field completely
      if (e.key === 'Backspace' && displayValue === '0') {
        e.preventDefault()
        setDisplayValue('')
        // Create a synthetic event for the onChange handler
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: ''
          }
        } as React.ChangeEvent<HTMLInputElement>
        onChange?.(syntheticEvent)
      }
    }

    return (
      <Input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        className={cn(className)}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
