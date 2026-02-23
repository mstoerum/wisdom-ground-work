import * as React from "react"
import { cn } from "@/lib/utils"

interface CircleData {
  id: number
  x: number
  y: number
  color: string
  fadeState: "in" | "out" | null
}

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className, children, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [circles, setCircles] = React.useState<CircleData[]>([])
    const lastAddedRef = React.useRef(0)
    const isListeningRef = React.useRef(false)

    const combinedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
      },
      [ref]
    )

    const createCircle = React.useCallback((x: number, y: number) => {
      const buttonWidth = buttonRef.current?.offsetWidth || 1
      const xPos = x / buttonWidth
      const color = `linear-gradient(to right, hsl(var(--terracotta-primary)) ${xPos * 100}%, hsl(var(--coral-accent)) ${xPos * 100}%)`

      const id = Date.now() + Math.random()
      setCircles((prev) => [...prev, { id, x, y, color, fadeState: null }])
    }, [])

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isListeningRef.current) return
        const currentTime = Date.now()
        if (currentTime - lastAddedRef.current > 100) {
          lastAddedRef.current = currentTime
          const rect = event.currentTarget.getBoundingClientRect()
          createCircle(event.clientX - rect.left, event.clientY - rect.top)
        }
      },
      [createCircle]
    )

    const handlePointerEnter = React.useCallback(() => {
      isListeningRef.current = true
    }, [])

    const handlePointerLeave = React.useCallback(() => {
      isListeningRef.current = false
    }, [])

    React.useEffect(() => {
      circles.forEach((circle) => {
        if (!circle.fadeState) {
          setTimeout(() => {
            setCircles((prev) =>
              prev.map((c) => (c.id === circle.id ? { ...c, fadeState: "in" } : c))
            )
          }, 0)

          setTimeout(() => {
            setCircles((prev) =>
              prev.map((c) => (c.id === circle.id ? { ...c, fadeState: "out" } : c))
            )
          }, 1000)

          setTimeout(() => {
            setCircles((prev) => prev.filter((c) => c.id !== circle.id))
          }, 2200)
        }
      })
    }, [circles])

    return (
      <button
        ref={combinedRef}
        className={cn(
          "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          className
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        {circles.map(({ id, x, y, color, fadeState }) => (
          <div
            key={id}
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 200,
              height: 200,
              left: x - 100,
              top: y - 100,
              background: color,
              opacity: fadeState === "in" ? 0.3 : fadeState === "out" ? 0 : 0,
              transition: fadeState === "out" ? "opacity 1.2s ease-out" : "opacity 0.2s ease-in",
            }}
          />
        ))}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    )
  }
)

HoverButton.displayName = "HoverButton"

export { HoverButton }
