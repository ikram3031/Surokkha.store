import { isValidElement } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import styles from "@/styles/styles.json"

// Button styling lives in styles/styles.json so every <Button> shares one definition
const buttonVariants = cva(styles.button.base, {
  variants: {
    variant: styles.button.variants,
    size: styles.button.sizes,
  },
  defaultVariants: styles.button.defaults,
})

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  render,
  children,
  ...props
}) {
  const finalRender = render || (asChild && isValidElement(children) ? children : undefined);
  const finalChildren = asChild && isValidElement(children) ? undefined : children;

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={finalRender}
      {...props}
    >
      {finalChildren}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
