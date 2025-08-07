// Testing utilities for cross-browser and cross-device compatibility
export interface DeviceInfo {
  type: "mobile" | "tablet" | "desktop"
  os: string
  browser: string
  version: string
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  touchSupport: boolean
  orientation: "portrait" | "landscape"
}

export interface PerformanceMetrics {
  loadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
}

export interface TestResult {
  id: string
  timestamp: string
  device: DeviceInfo
  performance: PerformanceMetrics
  issues: TestIssue[]
  screenshots?: string[]
  status: "pass" | "fail" | "warning"
}

export interface TestIssue {
  severity: "critical" | "major" | "minor"
  category: "layout" | "performance" | "functionality" | "accessibility" | "compatibility"
  description: string
  element?: string
  expectedBehavior: string
  actualBehavior: string
  reproductionSteps: string[]
  browserSpecific?: boolean
}

class TestingUtils {
  private static instance: TestingUtils
  private testResults: TestResult[] = []

  static getInstance(): TestingUtils {
    if (!TestingUtils.instance) {
      TestingUtils.instance = new TestingUtils()
    }
    return TestingUtils.instance
  }

  // Device Detection
  detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const screen = window.screen

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent) || (screen.width >= 768 && screen.width <= 1024)

    let deviceType: "mobile" | "tablet" | "desktop" = "desktop"
    if (isMobile && !isTablet) deviceType = "mobile"
    else if (isTablet) deviceType = "tablet"

    // Detect OS
    let os = "Unknown"
    if (/Windows/i.test(userAgent)) os = "Windows"
    else if (/Mac/i.test(userAgent)) os = "macOS"
    else if (/Linux/i.test(userAgent)) os = "Linux"
    else if (/Android/i.test(userAgent)) os = "Android"
    else if (/iPhone|iPad/i.test(userAgent)) os = "iOS"

    // Detect browser
    let browser = "Unknown"
    let version = "Unknown"

    if (/Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent)) {
      browser = "Chrome"
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || "Unknown"
    } else if (/Firefox/i.test(userAgent)) {
      browser = "Firefox"
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || "Unknown"
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      browser = "Safari"
      version = userAgent.match(/Version\/(\d+)/)?.[1] || "Unknown"
    } else if (/Edge|Edg/i.test(userAgent)) {
      browser = "Edge"
      version = userAgent.match(/Edg?\/(\d+)/)?.[1] || "Unknown"
    }

    return {
      type: deviceType,
      os,
      browser,
      version,
      screenWidth: screen.width,
      screenHeight: screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: "ontouchstart" in window,
      orientation: screen.width > screen.height ? "landscape" : "portrait",
    }
  }

  // Performance Monitoring
  async measurePerformance(): Promise<PerformanceMetrics> {
    return new Promise((resolve) => {
      // Wait for page to fully load
      if (document.readyState === "complete") {
        this.collectMetrics(resolve)
      } else {
        window.addEventListener("load", () => {
          setTimeout(() => this.collectMetrics(resolve), 1000)
        })
      }
    })
  }

  private collectMetrics(resolve: (metrics: PerformanceMetrics) => void) {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType("paint")

    let firstContentfulPaint = 0
    let largestContentfulPaint = 0

    paint.forEach((entry) => {
      if (entry.name === "first-contentful-paint") {
        firstContentfulPaint = entry.startTime
      }
    })

    // Get LCP if available
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          largestContentfulPaint = lastEntry.startTime
        })
        observer.observe({ entryTypes: ["largest-contentful-paint"] })
      } catch (e) {
        console.warn("LCP measurement not supported")
      }
    }

    const metrics: PerformanceMetrics = {
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      firstContentfulPaint,
      largestContentfulPaint,
      cumulativeLayoutShift: 0, // Would need CLS observer
      firstInputDelay: 0, // Would need FID observer
      timeToInteractive: navigation.domInteractive - navigation.navigationStart,
    }

    resolve(metrics)
  }

  // Layout Testing
  testResponsiveLayout(): TestIssue[] {
    const issues: TestIssue[] = []
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Test critical elements
    const criticalElements = [
      { selector: ".navbar-container", name: "Navigation Bar" },
      { selector: ".hero-section", name: "Hero Section" },
      { selector: ".footer", name: "Footer" },
      { selector: ".menu-item", name: "Menu Items" },
      { selector: ".mobile-menu-overlay", name: "Mobile Menu" },
    ]

    criticalElements.forEach(({ selector, name }) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect()

        // Check if element is visible
        if (rect.width === 0 || rect.height === 0) {
          issues.push({
            severity: "major",
            category: "layout",
            description: `${name} is not visible`,
            element: `${selector}[${index}]`,
            expectedBehavior: "Element should be visible and have dimensions",
            actualBehavior: `Element has width: ${rect.width}, height: ${rect.height}`,
            reproductionSteps: [
              `Navigate to page`,
              `Resize viewport to ${viewportWidth}x${viewportHeight}`,
              `Check element visibility`,
            ],
          })
        }

        // Check for horizontal overflow
        if (rect.right > viewportWidth) {
          issues.push({
            severity: "major",
            category: "layout",
            description: `${name} causes horizontal overflow`,
            element: `${selector}[${index}]`,
            expectedBehavior: "Element should fit within viewport width",
            actualBehavior: `Element extends ${rect.right - viewportWidth}px beyond viewport`,
            reproductionSteps: [
              `Navigate to page`,
              `Resize viewport to ${viewportWidth}x${viewportHeight}`,
              `Check for horizontal scrollbar`,
            ],
          })
        }

        // Check minimum touch target size for mobile
        if (viewportWidth <= 768) {
          const interactiveElements = element.querySelectorAll("button, a, input, select, textarea")
          interactiveElements.forEach((interactive, interactiveIndex) => {
            const interactiveRect = interactive.getBoundingClientRect()
            if (interactiveRect.width < 44 || interactiveRect.height < 44) {
              issues.push({
                severity: "minor",
                category: "accessibility",
                description: `Interactive element too small for touch`,
                element: `${selector}[${index}] ${interactive.tagName.toLowerCase()}[${interactiveIndex}]`,
                expectedBehavior: "Touch targets should be at least 44x44px",
                actualBehavior: `Element is ${interactiveRect.width}x${interactiveRect.height}px`,
                reproductionSteps: [
                  `Navigate to page on mobile device`,
                  `Try to tap the element`,
                  `Note difficulty in precise tapping`,
                ],
              })
            }
          })
        }
      })
    })

    return issues
  }

  // Functionality Testing
  testInteractiveElements(): TestIssue[] {
    const issues: TestIssue[] = []

    // Test navigation links
    const navLinks = document.querySelectorAll("nav a, .nav-link")
    navLinks.forEach((link, index) => {
      const href = link.getAttribute("href")
      if (!href || href === "#") {
        issues.push({
          severity: "minor",
          category: "functionality",
          description: "Navigation link missing or invalid href",
          element: `nav a[${index}]`,
          expectedBehavior: "Link should have valid href attribute",
          actualBehavior: `href="${href}"`,
          reproductionSteps: ["Navigate to page", "Inspect navigation links", "Check href attributes"],
        })
      }
    })

    // Test form elements
    const forms = document.querySelectorAll("form")
    forms.forEach((form, index) => {
      const inputs = form.querySelectorAll("input[required], select[required], textarea[required]")
      inputs.forEach((input, inputIndex) => {
        if (!input.getAttribute("aria-label") && !input.getAttribute("aria-labelledby")) {
          const label = form.querySelector(`label[for="${input.id}"]`)
          if (!label) {
            issues.push({
              severity: "major",
              category: "accessibility",
              description: "Required form input missing accessible label",
              element: `form[${index}] input[${inputIndex}]`,
              expectedBehavior: "Input should have associated label or aria-label",
              actualBehavior: "No accessible label found",
              reproductionSteps: ["Navigate to form", "Use screen reader", "Try to identify input purpose"],
            })
          }
        }
      })
    })

    // Test buttons
    const buttons = document.querySelectorAll("button")
    buttons.forEach((button, index) => {
      if (!button.textContent?.trim() && !button.getAttribute("aria-label")) {
        issues.push({
          severity: "major",
          category: "accessibility",
          description: "Button missing accessible text",
          element: `button[${index}]`,
          expectedBehavior: "Button should have visible text or aria-label",
          actualBehavior: "Button has no accessible text",
          reproductionSteps: ["Navigate to page", "Use screen reader", "Try to identify button purpose"],
        })
      }
    })

    return issues
  }

  // Image Testing
  testImages(): TestIssue[] {
    const issues: TestIssue[] = []
    const images = document.querySelectorAll("img")

    images.forEach((img, index) => {
      // Check for alt text
      if (!img.getAttribute("alt")) {
        issues.push({
          severity: "major",
          category: "accessibility",
          description: "Image missing alt text",
          element: `img[${index}]`,
          expectedBehavior: "All images should have descriptive alt text",
          actualBehavior: "Alt attribute is missing",
          reproductionSteps: ["Navigate to page", "Use screen reader", "Navigate to image"],
        })
      }

      // Check if image loaded successfully
      if (!img.complete || img.naturalHeight === 0) {
        issues.push({
          severity: "major",
          category: "functionality",
          description: "Image failed to load",
          element: `img[${index}]`,
          expectedBehavior: "Image should load successfully",
          actualBehavior: "Image failed to load or has zero dimensions",
          reproductionSteps: [
            "Navigate to page",
            "Check if image displays correctly",
            "Check browser console for errors",
          ],
        })
      }
    })

    return issues
  }

  // Run comprehensive test suite
  async runTestSuite(): Promise<TestResult> {
    const device = this.detectDevice()
    const performance = await this.measurePerformance()

    const issues: TestIssue[] = [
      ...this.testResponsiveLayout(),
      ...this.testInteractiveElements(),
      ...this.testImages(),
    ]

    // Determine overall status
    const criticalIssues = issues.filter((issue) => issue.severity === "critical")
    const majorIssues = issues.filter((issue) => issue.severity === "major")

    let status: "pass" | "fail" | "warning" = "pass"
    if (criticalIssues.length > 0) status = "fail"
    else if (majorIssues.length > 0) status = "warning"

    const result: TestResult = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      device,
      performance,
      issues,
      status,
    }

    this.testResults.push(result)
    return result
  }

  // Get test results
  getTestResults(): TestResult[] {
    return this.testResults
  }

  // Export results
  exportResults(): string {
    return JSON.stringify(this.testResults, null, 2)
  }

  // Clear results
  clearResults(): void {
    this.testResults = []
  }
}

export const testingUtils = TestingUtils.getInstance()
