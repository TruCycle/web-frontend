import type { ComponentProps } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'

type NewItemButtonProps = Omit<ComponentProps<typeof Button>, 'children'>

export function NewItemButton({ className, ...restProps }: NewItemButtonProps) {
  return (
    <Button className={className} {...restProps}>
      <Plus size={18} />
      List New Item
    </Button>
  )
}
