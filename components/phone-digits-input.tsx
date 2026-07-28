"use client"

import { forwardRef, useCallback, useRef } from "react"

import { formatNationalDisplay, parsePhoneDigits } from "@/lib/phone-420"
import { cn } from "@/lib/utils"

export type PhoneDigitsInputProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "value" | "onChange" | "type" | "inputMode"
> & {
  value: string
  onChange: (digits: string) => void
  /** Applied to the outer flex row (border, radius, focus ring, etc.). */
  className?: string
  /** Applied to the inner text field only. */
  inputClassName?: string
  prefixClassName?: string
}

export const PhoneDigitsInput = forwardRef<HTMLInputElement, PhoneDigitsInputProps>(
  function PhoneDigitsInput(
    {
      value,
      onChange,
      className,
      inputClassName,
      prefixClassName,
      onFocus,
      placeholder = "",
      ...rest
    },
    ref,
  ) {
    const display = formatNationalDisplay(value)
    const innerRef = useRef<HTMLInputElement>(null)

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e)
        requestAnimationFrame(() => {
          const el = e.target
          if (display === "" && document.activeElement === el) {
            el.setSelectionRange(0, 0)
          }
        })
      },
      [display, onFocus],
    )

    const handleWrapperPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      const input = innerRef.current
      if (!input) return
      if (e.target === input || input.contains(e.target as Node)) return
      e.preventDefault()
      input.focus()
    }, [])

    return (
      <div className={cn("flex min-w-0 items-center gap-2", className)} onPointerDown={handleWrapperPointerDown}>
        <span
          className={cn("shrink-0 select-none font-medium tabular-nums text-muted-foreground", prefixClassName)}
          aria-hidden
        >
          +420
        </span>
        <input
          ref={setRefs}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          {...rest}
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus:ring-0",
            inputClassName,
          )}
          value={display}
          onChange={(e) => onChange(parsePhoneDigits(e.target.value))}
          onFocus={handleFocus}
        />
      </div>
    )
  },
)
