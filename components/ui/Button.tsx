import { cn } from '@/lib/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20': variant === 'primary',
            'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600': variant === 'secondary',
            'hover:bg-slate-800 text-slate-300 hover:text-white': variant === 'ghost',
            'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
export { Button }
