"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  baseSize: number
  speedX: number
  speedY: number
  life: number
  maxLife: number
  opacity: number
  turbulence: number
  angle: number
  angleSpeed: number
  colorOffset: number
  hue: number
}

export default function SmokeCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const prevMousePositionRef = useRef({ x: 0, y: 0 })
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)
  const isInitializedRef = useRef(false)
  const lastEmitTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isInitializedRef.current) return

    isInitializedRef.current = true

    // Set canvas to full window size
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      prevMousePositionRef.current = { ...mousePositionRef.current }
      mousePositionRef.current = { x: e.clientX, y: e.clientY }

      // Limit particle creation rate for performance but make it faster
      const now = Date.now()
      if (now - lastEmitTimeRef.current > 5) {
        // Fast emission rate (5ms)
        // Calculate mouse speed for dynamic particle count
        const dx = mousePositionRef.current.x - prevMousePositionRef.current.x
        const dy = mousePositionRef.current.y - prevMousePositionRef.current.y
        const speed = Math.sqrt(dx * dx + dy * dy)

        // Good particle count for density
        const particleCount = Math.min(Math.max(Math.floor(speed / 3), 4), 12)
        createParticles(particleCount)

        lastEmitTimeRef.current = now
      }
    }

    // Create particles with more variation for hyper-realism
    const createParticles = (count: number) => {
      for (let i = 0; i < count; i++) {
        const baseSize = Math.random() * 40 + 20 // Larger size for visibility
        const life = Math.random() * 80 + 80 // Longer life for more persistent smoke

        // Calculate position with slight offset for more natural appearance
        const offsetX = (Math.random() - 0.5) * 15
        const offsetY = (Math.random() - 0.5) * 15

        // Subtle gold tint for some particles
        const hue = Math.random() > 0.7 ? 45 + Math.random() * 10 : 0 // Gold hue for 30% of particles

        particlesRef.current.push({
          x: mousePositionRef.current.x + offsetX,
          y: mousePositionRef.current.y + offsetY,
          baseSize,
          size: baseSize,
          speedX: (Math.random() - 0.5) * 3, // Good horizontal speed
          speedY: Math.random() * -4 - 1, // Good upward movement
          life,
          maxLife: life,
          opacity: Math.random() * 0.15 + 0.05, // REDUCED base opacity for lower visibility
          turbulence: Math.random() * 0.8, // Good turbulence for dynamic movement
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.05, // Good angle speed
          colorOffset: Math.floor(Math.random() * 20), // Good color variation
          hue, // Store the hue value
        })
      }
    }

    // Animation loop with enhanced hyper-realism
    const animate = () => {
      // Use clearRect with slight opacity to create trailing effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)" // REDUCED trail opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i]

        // Apply turbulence for more realistic movement
        p.angle += p.angleSpeed
        const turbulenceX = Math.sin(p.angle) * p.turbulence * (1 + Math.sin(p.life / 10) * 0.5)
        const turbulenceY = Math.cos(p.angle) * p.turbulence * (1 + Math.cos(p.life / 10) * 0.5)

        // Update position with turbulence - Good movement
        p.x += p.speedX + turbulenceX
        p.y += p.speedY + turbulenceY

        // Gradually slow down but not too much
        p.speedX *= 0.98
        p.speedY *= 0.98

        // Expand size as smoke rises for more dramatic effect
        const expansionRate = 1.005 // Good expansion
        p.size = p.baseSize * expansionRate * (0.6 + 0.4 * (1 - p.life / p.maxLife))

        // Decrease life
        p.life--

        // Ensure we have valid values to prevent NaN
        if (p.maxLife <= 0) p.maxLife = 1
        if (p.life < 0) p.life = 0

        // Calculate opacity based on life with non-linear falloff
        const lifeProgress = p.life / p.maxLife
        const fadeStart = 0.7

        // Fixed opacity calculation to prevent NaN
        let currentOpacity = 0
        if (lifeProgress > fadeStart) {
          currentOpacity = p.opacity
        } else if (fadeStart > 0) {
          const ratio = lifeProgress / fadeStart
          // More dramatic fade curve for visual interest
          currentOpacity = p.opacity * Math.max(0, Math.min(1, ratio * ratio))
        }

        // Final safety check for opacity
        if (isNaN(currentOpacity) || currentOpacity < 0) {
          currentOpacity = 0
        } else if (currentOpacity > 1) {
          currentOpacity = 1
        }

        // REDUCED opacity values for gradient stops
        const opacityInner = Math.min(1, currentOpacity * 0.9) // REDUCED center brightness
        const opacityMiddle = Math.max(0, Math.min(1, currentOpacity * 0.6)) // REDUCED middle opacity
        const opacityOuter = Math.max(0, Math.min(1, currentOpacity * 0.3)) // REDUCED outer opacity

        try {
          // Draw particle with complex gradient for realistic smoke
          ctx.beginPath()

          // Create a more complex gradient for realistic smoke
          const gradient = ctx.createRadialGradient(p.x, p.y, 0.01, p.x, p.y, p.size)

          // Ensure color values are integers
          const colorBase = Math.floor(240 - p.colorOffset)

          // Apply gold tint if this particle has a hue
          let colorInner, colorMiddle, colorOuter, colorEdge

          if (p.hue > 0) {
            // Gold-tinted particle (convert from HSL to approximate RGB)
            const saturation = 30 + 20 * (1 - lifeProgress) // Saturation fades as particle ages
            colorInner = `hsl(${p.hue}, ${saturation}%, 90%)`
            colorMiddle = `hsl(${p.hue}, ${saturation}%, 80%)`
            colorOuter = `hsl(${p.hue}, ${saturation * 0.8}%, 70%)`
            colorEdge = `hsl(${p.hue}, ${saturation * 0.6}%, 60%)`
          } else {
            // Regular white/gray smoke
            colorInner = `rgb(${Math.min(255, colorBase + 15)}, ${Math.min(255, colorBase + 15)}, ${Math.min(
              255,
              colorBase + 15,
            )})`
            colorMiddle = `rgb(${colorBase}, ${colorBase}, ${colorBase})`
            colorOuter = `rgb(${Math.max(0, colorBase - 15)}, ${Math.max(0, colorBase - 15)}, ${Math.max(
              0,
              colorBase - 15,
            )})`
            colorEdge = `rgb(${Math.max(0, colorBase - 30)}, ${Math.max(0, colorBase - 30)}, ${Math.max(
              0,
              colorBase - 30,
            )})`
          }

          // Inner color (whiter or gold-tinted)
          gradient.addColorStop(
            0,
            colorInner.replace(")", `, ${opacityInner})`).replace("rgb", "rgba").replace("hsl", "hsla"),
          )

          // Middle color
          gradient.addColorStop(
            0.4,
            colorMiddle.replace(")", `, ${opacityMiddle})`).replace("rgb", "rgba").replace("hsl", "hsla"),
          )

          // Outer color (more transparent)
          gradient.addColorStop(
            0.7,
            colorOuter.replace(")", `, ${opacityOuter})`).replace("rgb", "rgba").replace("hsl", "hsla"),
          )

          // Edge (fully transparent)
          gradient.addColorStop(1, colorEdge.replace(")", `, 0)`).replace("rgb", "rgba").replace("hsl", "hsla"))

          ctx.fillStyle = gradient

          // Draw a more dynamically squashed circle for natural smoke shape
          const squashFactor = 0.8 + 0.3 * (1 - lifeProgress) // Good squashing for dramatic effect
          ctx.ellipse(
            p.x,
            p.y,
            p.size,
            p.size * squashFactor,
            p.angle / 3, // Good rotation
            0,
            Math.PI * 2,
          )
          ctx.fill()

          // Add a subtle glow effect for some particles to enhance realism
          // REDUCED glow opacity
          if (lifeProgress > 0.7 && p.opacity > 0.1) {
            ctx.beginPath()
            const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.5)
            glowGradient.addColorStop(0, `rgba(255, 255, 255, ${opacityInner * 0.05})`) // REDUCED glow opacity
            glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
            ctx.fillStyle = glowGradient
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2)
            ctx.fill()
          }
        } catch (error) {
          // If there's an error with the gradient, remove this particle
          particlesRef.current.splice(i, 1)
          i--
          continue
        }

        // Remove dead particles
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1)
          i--
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation and event listeners
    window.addEventListener("mousemove", handleMouseMove)
    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameRef.current)
      isInitializedRef.current = false
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ opacity: 0.35 }} // REDUCED overall canvas opacity
    />
  )
}
