import * as React from "react"
import { cn } from "@/lib/utils"
import { Building2 } from "lucide-react"

interface LogoAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12", 
  lg: "h-14 w-14",
  xl: "h-16 w-16"
}

const LogoAvatar = React.forwardRef<HTMLDivElement, LogoAvatarProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/80 border border-border/50",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
)
LogoAvatar.displayName = "LogoAvatar"

const LogoAvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt, ...props }, ref) => (
  <img
    ref={ref}
    alt={alt}
    className={cn(
      "h-full w-full object-contain p-2",
      className
    )}
    {...props}
  />
))
LogoAvatarImage.displayName = "LogoAvatarImage"

interface LogoAvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  iconSize?: "sm" | "md" | "lg"
}

const iconSizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8"
}

const LogoAvatarFallback = React.forwardRef<HTMLDivElement, LogoAvatarFallbackProps>(
  ({ className, iconSize = "md", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center",
        className
      )}
      {...props}
    >
      {children || <Building2 className={cn("text-muted-foreground", iconSizeClasses[iconSize])} />}
    </div>
  )
)
LogoAvatarFallback.displayName = "LogoAvatarFallback"

export { LogoAvatar, LogoAvatarImage, LogoAvatarFallback }
