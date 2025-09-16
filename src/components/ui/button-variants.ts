import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] transform-gpu border-0 hover:brightness-105",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-lg hover:scale-[1.02] hover:brightness-110 transition-all duration-300 ease-in-out",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 shadow-sm hover:shadow-md",
        secondary:
          "bg-gray-200 text-gray-900 shadow-sm hover:bg-gray-300 hover:shadow-md",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        link: "text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm: "h-8 rounded-lg px-4 py-1.5 text-xs",
        lg: "h-12 rounded-lg px-8 py-3 text-base",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
