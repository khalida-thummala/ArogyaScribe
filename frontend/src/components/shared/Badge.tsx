import { cn } from '@/utils'

type Variant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'teal' | 'gray'

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClass: Record<Variant, string> = {
  green: 'badge-green',
  red: 'badge-red',
  amber: 'badge-amber',
  blue: 'badge-blue',
  purple: 'badge-purple',
  teal: 'badge-teal',
  gray: 'badge-gray',
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', variantClass[variant], className)}>
      {children}
    </span>
  )
}
