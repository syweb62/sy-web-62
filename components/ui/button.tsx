import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none relative touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-gold text-black hover:bg-gold/90 shadow-md hover:shadow-lg active:shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg active:shadow-sm",
        outline:
          "border-2 border-gold text-gold bg-transparent hover:bg-gold hover:text-black shadow-sm hover:shadow-md",
        secondary: "bg-gray-700 text-white hover:bg-gray-600 shadow-md hover:shadow-lg active:shadow-sm",
        ghost: "text-white hover:bg-gold/10 hover:text-gold",
        link: "text-gold underline-offset-4 hover:underline hover:text-gold/80",
        primary: "bg-gold text-black hover:bg-gold/80 shadow-md hover:shadow-lg active:shadow-sm",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg active:shadow-sm",
        warning: "bg-yellow-600 text-black hover:bg-yellow-700 shadow-md hover:shadow-lg active:shadow-sm",
        info: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:shadow-sm",
        overlay:
          "bg-black/80 backdrop-blur-sm text-white border border-white/20 hover:bg-black/90 hover:border-gold shadow-xl",
        "overlay-primary": "bg-gold/90 backdrop-blur-sm text-black border border-gold hover:bg-gold shadow-xl",
      },
      size: {
        default: "h-10 px-4 py-2 sm:h-10 sm:px-4 sm:py-2",
        sm: "h-8 rounded-md px-3 text-xs sm:h-8 sm:px-3 sm:text-xs",
        lg: "h-14 rounded-md px-8 text-base sm:h-12 sm:px-6 sm:text-sm",
        xl: "h-16 rounded-lg px-10 text-lg sm:h-14 sm:px-8 sm:text-base",
        icon: "h-12 w-12 sm:h-10 sm:w-10",
        "icon-sm": "h-10 w-10 sm:h-8 sm:w-8",
        "icon-lg": "h-14 w-14 sm:h-12 sm:w-12",
      },
      position: {
        static: "",
        absolute: "absolute",
        fixed: "fixed",
        sticky: "sticky",
      },
      zIndex: {
        auto: "",
        10: "z-10",
        20: "z-20",
        30: "z-30",
        40: "z-40",
        50: "z-50",
      },
      loading: {
        true: "cursor-wait",
        false: "",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "static",
      zIndex: "auto",
      loading: false,
      fullWidth: false,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  position?: "static" | "absolute" | "fixed" | "sticky"
  zIndex?: "auto" | "10" | "20" | "30" | "40" | "50"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      position,
      zIndex,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button"

    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, position, zIndex, loading, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {loading ? loadingText || "Loading..." : children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
