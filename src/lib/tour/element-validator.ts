/**
 * Element validation utilities for tour system
 * Provides robust element detection and fallback strategies
 */

/**
 * Environment detection utilities
 */
class EnvironmentDetector {
    /**
     * Check if we're running in a browser environment
     */
    static isBrowser(): boolean {
        return typeof window !== 'undefined' && typeof document !== 'undefined'
    }

    /**
     * Check if we're running in Node.js environment
     */
    static isNode(): boolean {
        return typeof process !== 'undefined' && process.versions?.node !== undefined
    }

    /**
     * Get the appropriate timeout type for the current environment
     */
    static getTimeoutType(): 'browser' | 'node' {
        return this.isBrowser() ? 'browser' : 'node'
    }
}

/**
 * Type-safe timeout utilities
 */
type TimeoutId = ReturnType<typeof setTimeout>

/**
 * Type guards for DOM operations
 */
class DOMTypeGuards {
    /**
     * Check if element is a valid HTMLElement
     */
    static isHTMLElement(element: unknown): element is HTMLElement {
        // In test environments, HTMLElement might not be available
        if (typeof HTMLElement !== 'undefined') {
            return element instanceof HTMLElement
        }

        // Fallback for test environments - check for element-like properties
        return element !== null &&
            element !== undefined &&
            typeof element === 'object' &&
            'tagName' in element &&
            'getAttribute' in element &&
            'getBoundingClientRect' in element
    }

    /**
     * Check if element exists and is not null/undefined
     */
    static isValidElement(element: Element | null | undefined): element is HTMLElement {
        return element !== null && element !== undefined && this.isHTMLElement(element)
    }

    /**
     * Safely get element property with null check
     */
    static safeGetProperty<T>(
        element: HTMLElement | null | undefined,
        property: keyof HTMLElement
    ): T | null {
        if (!this.isValidElement(element)) {
            return null
        }
        try {
            return element[property] as T
        } catch {
            return null
        }
    }

    /**
     * Safely call element method with null check
     */
    static safeCallMethod<T>(
        element: HTMLElement | null | undefined,
        method: keyof HTMLElement,
        ...args: unknown[]
    ): T | null {
        if (!this.isValidElement(element)) {
            return null
        }
        try {
            const methodFn = element[method]
            if (typeof methodFn === 'function') {
                return (methodFn as Function).apply(element, args) as T
            }
            return null
        } catch {
            return null
        }
    }
}

export interface ElementValidationResult {
    element: HTMLElement | null
    selector: string
    found: boolean
    fallbackUsed?: boolean
    error?: string
    validationMethod?: 'css' | 'javascript' | 'hybrid'
    performance?: {
        searchTime: number
        fallbacksAttempted: number
    }
    fallbackStrategies?: {
        attempted: string[]
        successful?: string
        failed: string[]
        recommendations: string[]
    }
    errorDetails?: {
        code: string
        category: 'selector' | 'dom' | 'visibility' | 'timeout' | 'environment'
        severity: 'low' | 'medium' | 'high' | 'critical'
        context: Record<string, any>
        suggestions: string[]
    }
}

/**
 * Comprehensive error reporting and validation utilities
 */
class ValidationErrorReporter {
    public static readonly ERROR_CODES = {
        SELECTOR_INVALID: 'SELECTOR_INVALID',
        SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
        ELEMENT_NOT_VISIBLE: 'ELEMENT_NOT_VISIBLE',
        ELEMENT_NOT_ACCESSIBLE: 'ELEMENT_NOT_ACCESSIBLE',
        DOM_NOT_READY: 'DOM_NOT_READY',
        TIMEOUT_EXCEEDED: 'TIMEOUT_EXCEEDED',
        ENVIRONMENT_UNSUPPORTED: 'ENVIRONMENT_UNSUPPORTED',
        SHADOW_DOM_ACCESS: 'SHADOW_DOM_ACCESS',
        IFRAME_ACCESS: 'IFRAME_ACCESS',
        PERFORMANCE_DEGRADED: 'PERFORMANCE_DEGRADED'
    } as const

    /**
     * Create detailed error information for validation failures
     */
    static createErrorDetails(
        code: keyof typeof ValidationErrorReporter.ERROR_CODES,
        message: string,
        context: Record<string, any> = {}
    ): ElementValidationResult['errorDetails'] {
        const errorInfo = this.getErrorInfo(code)

        return {
            code: this.ERROR_CODES[code],
            category: errorInfo.category,
            severity: errorInfo.severity,
            context: {
                timestamp: new Date().toISOString(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                ...context
            },
            suggestions: this.generateSuggestions(code, context)
        }
    }

    /**
     * Get error category and severity information
     */
    private static getErrorInfo(code: keyof typeof ValidationErrorReporter.ERROR_CODES): {
        category: 'selector' | 'dom' | 'visibility' | 'timeout' | 'environment'
        severity: 'low' | 'medium' | 'high' | 'critical'
    } {
        switch (code) {
            case 'SELECTOR_INVALID':
                return { category: 'selector', severity: 'high' }
            case 'SELECTOR_NOT_FOUND':
                return { category: 'selector', severity: 'medium' }
            case 'ELEMENT_NOT_VISIBLE':
                return { category: 'visibility', severity: 'medium' }
            case 'ELEMENT_NOT_ACCESSIBLE':
                return { category: 'visibility', severity: 'low' }
            case 'DOM_NOT_READY':
                return { category: 'dom', severity: 'high' }
            case 'TIMEOUT_EXCEEDED':
                return { category: 'timeout', severity: 'medium' }
            case 'ENVIRONMENT_UNSUPPORTED':
                return { category: 'environment', severity: 'critical' }
            case 'SHADOW_DOM_ACCESS':
                return { category: 'dom', severity: 'medium' }
            case 'IFRAME_ACCESS':
                return { category: 'dom', severity: 'medium' }
            case 'PERFORMANCE_DEGRADED':
                return { category: 'dom', severity: 'low' }
            default:
                return { category: 'dom', severity: 'medium' }
        }
    }

    /**
     * Generate actionable suggestions based on error type
     */
    private static generateSuggestions(
        code: keyof typeof ValidationErrorReporter.ERROR_CODES,
        context: Record<string, any>
    ): string[] {
        const suggestions: string[] = []

        switch (code) {
            case 'SELECTOR_INVALID':
                suggestions.push('Use valid CSS selector syntax')
                suggestions.push('Consider using data-testid attributes for more reliable selection')
                if (context.selector?.includes(':contains')) {
                    suggestions.push('Replace :contains() with JavaScript text matching')
                }
                if (context.selector?.includes(':has')) {
                    suggestions.push('Use feature detection for :has() or provide JavaScript fallback')
                }
                break

            case 'SELECTOR_NOT_FOUND':
                suggestions.push('Verify the element exists in the DOM')
                suggestions.push('Check if the element is dynamically loaded')
                suggestions.push('Consider using a more specific selector')
                suggestions.push('Add data-testid attribute to the target element')
                break

            case 'ELEMENT_NOT_VISIBLE':
                suggestions.push('Check if element has display: none or visibility: hidden')
                suggestions.push('Verify element is not hidden by parent containers')
                suggestions.push('Ensure element is within viewport bounds')
                suggestions.push('Check for CSS transforms that might hide the element')
                break

            case 'ELEMENT_NOT_ACCESSIBLE':
                suggestions.push('Check if element is covered by other elements')
                suggestions.push('Verify element has sufficient z-index')
                suggestions.push('Ensure element is not disabled or readonly')
                break

            case 'DOM_NOT_READY':
                suggestions.push('Wait for DOM content to load before element validation')
                suggestions.push('Use mutation observers for dynamic content')
                suggestions.push('Consider increasing timeout for slow-loading content')
                break

            case 'TIMEOUT_EXCEEDED':
                suggestions.push('Increase timeout value for slow-loading elements')
                suggestions.push('Check network conditions and page load performance')
                suggestions.push('Verify element is not conditionally rendered')
                break

            case 'ENVIRONMENT_UNSUPPORTED':
                suggestions.push('Ensure code runs in a browser environment')
                suggestions.push('Add environment detection before DOM operations')
                suggestions.push('Provide server-side rendering fallbacks')
                break

            case 'SHADOW_DOM_ACCESS':
                suggestions.push('Use shadow DOM compatible selectors')
                suggestions.push('Access elements through shadow root references')
                suggestions.push('Consider using ::part() selectors for styled components')
                break

            case 'IFRAME_ACCESS':
                suggestions.push('Ensure iframe content is from same origin')
                suggestions.push('Use postMessage for cross-origin iframe communication')
                suggestions.push('Wait for iframe content to load completely')
                break

            case 'PERFORMANCE_DEGRADED':
                suggestions.push('Optimize selector specificity')
                suggestions.push('Reduce DOM query frequency')
                suggestions.push('Use more efficient element finding strategies')
                break
        }

        return suggestions
    }

    /**
     * Create meaningful error messages for all failure scenarios
     */
    static createMeaningfulErrorMessage(
        code: keyof typeof ValidationErrorReporter.ERROR_CODES,
        selector: string,
        context: Record<string, any> = {}
    ): string {
        const baseMessages = {
            SELECTOR_INVALID: `Invalid CSS selector syntax: "${selector}"`,
            SELECTOR_NOT_FOUND: `Element not found for selector: "${selector}"`,
            ELEMENT_NOT_VISIBLE: `Element found but not visible: "${selector}"`,
            ELEMENT_NOT_ACCESSIBLE: `Element found but not accessible: "${selector}"`,
            DOM_NOT_READY: `DOM not ready for element selection: "${selector}"`,
            TIMEOUT_EXCEEDED: `Timeout exceeded waiting for element: "${selector}"`,
            ENVIRONMENT_UNSUPPORTED: `Unsupported environment for element validation: "${selector}"`,
            SHADOW_DOM_ACCESS: `Cannot access element in shadow DOM: "${selector}"`,
            IFRAME_ACCESS: `Cannot access element in iframe: "${selector}"`,
            PERFORMANCE_DEGRADED: `Performance degraded during element search: "${selector}"`
        }

        let message = baseMessages[code] || `Unknown error for selector: "${selector}"`

        // Add context-specific details
        if (context.timeout) {
            message += ` (timeout: ${context.timeout}ms)`
        }
        if (context.attempts) {
            message += ` (attempts: ${context.attempts})`
        }
        if (context.searchTime) {
            message += ` (search time: ${Math.round(context.searchTime)}ms)`
        }

        return message
    }
}

/**
 * Performance monitoring and metrics collection utilities
 */
class PerformanceMonitor {
    private static metrics = new Map<string, {
        totalSearches: number
        totalTime: number
        averageTime: number
        slowSearches: number
        failedSearches: number
        successfulSearches: number
        fallbackUsage: number
        lastUpdated: number
    }>()

    private static readonly SLOW_SEARCH_THRESHOLD = 1000 // 1 second
    private static readonly METRICS_RETENTION_TIME = 300000 // 5 minutes

    /**
     * Record performance metrics for element search
     */
    static recordSearch(
        selector: string,
        searchTime: number,
        success: boolean,
        fallbackUsed: boolean = false
    ): void {
        try {
            const now = Date.now()
            const existing = this.metrics.get(selector) || {
                totalSearches: 0,
                totalTime: 0,
                averageTime: 0,
                slowSearches: 0,
                failedSearches: 0,
                successfulSearches: 0,
                fallbackUsage: 0,
                lastUpdated: now
            }

            existing.totalSearches++
            existing.totalTime += searchTime
            existing.averageTime = existing.totalTime / existing.totalSearches
            existing.lastUpdated = now

            if (searchTime > this.SLOW_SEARCH_THRESHOLD) {
                existing.slowSearches++
            }

            if (success) {
                existing.successfulSearches++
            } else {
                existing.failedSearches++
            }

            if (fallbackUsed) {
                existing.fallbackUsage++
            }

            this.metrics.set(selector, existing)

            // Clean up old metrics periodically
            this.cleanupOldMetrics(now)
        } catch (error) {
            console.warn('Error recording performance metrics:', error)
        }
    }

    /**
     * Get performance metrics for a selector
     */
    static getMetrics(selector: string): {
        totalSearches: number
        totalTime: number
        averageTime: number
        slowSearches: number
        failedSearches: number
        successfulSearches: number
        fallbackUsage: number
        lastUpdated: number
    } | null {
        return this.metrics.get(selector) || null
    }

    /**
     * Get overall performance statistics
     */
    static getOverallStats(): {
        totalSelectors: number
        averageSearchTime: number
        slowSearchPercentage: number
        successRate: number
        fallbackUsageRate: number
        performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
    } {
        try {
            const allMetrics = Array.from(this.metrics.values())

            if (allMetrics.length === 0) {
                return {
                    totalSelectors: 0,
                    averageSearchTime: 0,
                    slowSearchPercentage: 0,
                    successRate: 0,
                    fallbackUsageRate: 0,
                    performanceGrade: 'A'
                }
            }

            const totalSearches = allMetrics.reduce((sum, m) => sum + m.totalSearches, 0)
            const totalTime = allMetrics.reduce((sum, m) => sum + m.totalTime, 0)
            const totalSlowSearches = allMetrics.reduce((sum, m) => sum + m.slowSearches, 0)
            const totalSuccessful = allMetrics.reduce((sum, m) => sum + m.successfulSearches, 0)
            const totalFallbacks = allMetrics.reduce((sum, m) => sum + m.fallbackUsage, 0)

            const averageSearchTime = totalSearches > 0 ? totalTime / totalSearches : 0
            const slowSearchPercentage = totalSearches > 0 ? (totalSlowSearches / totalSearches) * 100 : 0
            const successRate = totalSearches > 0 ? (totalSuccessful / totalSearches) * 100 : 0
            const fallbackUsageRate = totalSearches > 0 ? (totalFallbacks / totalSearches) * 100 : 0

            // Calculate performance grade
            let performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A'
            if (averageSearchTime > 2000 || successRate < 50) {
                performanceGrade = 'F'
            } else if (averageSearchTime > 1000 || successRate < 70) {
                performanceGrade = 'D'
            } else if (averageSearchTime > 500 || successRate < 85) {
                performanceGrade = 'C'
            } else if (averageSearchTime > 200 || successRate < 95) {
                performanceGrade = 'B'
            }

            return {
                totalSelectors: allMetrics.length,
                averageSearchTime,
                slowSearchPercentage,
                successRate,
                fallbackUsageRate,
                performanceGrade
            }
        } catch (error) {
            console.warn('Error calculating performance stats:', error)
            return {
                totalSelectors: 0,
                averageSearchTime: 0,
                slowSearchPercentage: 0,
                successRate: 0,
                fallbackUsageRate: 0,
                performanceGrade: 'F'
            }
        }
    }

    /**
     * Clean up old metrics to prevent memory leaks
     */
    private static cleanupOldMetrics(currentTime: number): void {
        try {
            const cutoffTime = currentTime - this.METRICS_RETENTION_TIME

            for (const [selector, metrics] of this.metrics.entries()) {
                if (metrics.lastUpdated < cutoffTime) {
                    this.metrics.delete(selector)
                }
            }
        } catch (error) {
            console.warn('Error cleaning up old metrics:', error)
        }
    }

    /**
     * Reset all metrics (useful for testing)
     */
    static resetMetrics(): void {
        this.metrics.clear()
    }
}

/**
 * Fallback strategy management for when elements cannot be found
 */
class FallbackStrategyManager {
    /**
     * Generate comprehensive fallback strategies for element finding
     */
    static generateFallbackStrategies(originalSelector: string): {
        attempted: string[]
        failed: string[]
        recommendations: string[]
    } {
        const strategies: string[] = []
        const recommendations: string[] = []

        try {
            // Strategy 1: Add data-testid recommendation
            if (!originalSelector.includes('data-testid')) {
                recommendations.push('Add data-testid attribute to target element for more reliable selection')
                strategies.push(`[data-testid="${this.generateTestIdFromSelector(originalSelector)}"]`)
            }

            // Strategy 2: Try more specific selectors
            if (!originalSelector.includes('>') && !originalSelector.includes(' ')) {
                recommendations.push('Use more specific parent-child selectors')
                strategies.push(`body ${originalSelector}`)
                strategies.push(`main ${originalSelector}`)
                strategies.push(`#app ${originalSelector}`)
            }

            // Strategy 3: Try attribute-based alternatives
            if (originalSelector.startsWith('.')) {
                const className = originalSelector.substring(1)
                strategies.push(`[class*="${className}"]`)
                strategies.push(`[class^="${className}"]`)
                strategies.push(`[class$="${className}"]`)
                recommendations.push('Consider using attribute selectors for more flexible class matching')
            }

            // Strategy 4: Try role-based alternatives
            if (!originalSelector.includes('role=')) {
                const elementType = this.inferElementTypeFromSelector(originalSelector)
                if (elementType) {
                    strategies.push(`[role="${elementType}"]`)
                    recommendations.push(`Add role="${elementType}" attribute for better accessibility`)
                }
            }

            // Strategy 5: Try ARIA label alternatives
            if (!originalSelector.includes('aria-label')) {
                recommendations.push('Add aria-label attribute for better accessibility and selection')
                const inferredLabel = this.inferLabelFromSelector(originalSelector)
                if (inferredLabel) {
                    strategies.push(`[aria-label*="${inferredLabel}"]`)
                }
            }

            // Strategy 6: Try text-based alternatives
            const textContent = this.extractTextFromSelector(originalSelector)
            if (textContent) {
                strategies.push(`*:contains("${textContent}")`)
                recommendations.push('Use text-based selection as fallback')
            }

            // Strategy 7: Try structural alternatives
            if (!originalSelector.includes(':nth-child')) {
                recommendations.push('Consider using structural pseudo-selectors like :nth-child()')
                strategies.push(`${originalSelector}:first-child`)
                strategies.push(`${originalSelector}:last-child`)
            }

            return {
                attempted: strategies,
                failed: [], // Will be populated during actual attempts
                recommendations
            }
        } catch (error) {
            console.warn('Error generating fallback strategies:', error)
            return {
                attempted: [],
                failed: [],
                recommendations: ['Unable to generate fallback strategies due to error']
            }
        }
    }

    /**
     * Generate test ID from selector
     */
    private static generateTestIdFromSelector(selector: string): string {
        try {
            // Extract meaningful parts from selector
            let testId = selector
                .replace(/[#.]/g, '-')
                .replace(/[\[\]"'=]/g, '')
                .replace(/[^a-zA-Z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase()

            return testId || 'element'
        } catch (error) {
            return 'element'
        }
    }

    /**
     * Infer element type from selector for role attribute
     */
    private static inferElementTypeFromSelector(selector: string): string | null {
        try {
            if (selector.includes('button') || selector.includes('btn')) return 'button'
            if (selector.includes('link') || selector.includes('href')) return 'link'
            if (selector.includes('input')) return 'textbox'
            if (selector.includes('select')) return 'combobox'
            if (selector.includes('nav')) return 'navigation'
            if (selector.includes('menu')) return 'menu'
            if (selector.includes('dialog') || selector.includes('modal')) return 'dialog'
            if (selector.includes('tab')) return 'tab'
            if (selector.includes('panel')) return 'tabpanel'
            return null
        } catch (error) {
            return null
        }
    }

    /**
     * Infer label from selector
     */
    private static inferLabelFromSelector(selector: string): string | null {
        try {
            // Extract text from :contains() patterns
            const containsMatch = selector.match(/:contains\(['"]([^'"]+)['"]\)/)
            if (containsMatch) return containsMatch[1]

            // Extract from class names
            const classMatch = selector.match(/\.([a-zA-Z][a-zA-Z0-9-]*)/g)
            if (classMatch) {
                return classMatch[0].substring(1).replace(/-/g, ' ')
            }

            // Extract from IDs
            const idMatch = selector.match(/#([a-zA-Z][a-zA-Z0-9-]*)/g)
            if (idMatch) {
                return idMatch[0].substring(1).replace(/-/g, ' ')
            }

            return null
        } catch (error) {
            return null
        }
    }

    /**
     * Extract text content from selector
     */
    private static extractTextFromSelector(selector: string): string | null {
        try {
            const containsMatch = selector.match(/:contains\(['"]([^'"]+)['"]\)/)
            return containsMatch ? containsMatch[1] : null
        } catch (error) {
            return null
        }
    }
}

/**
 * CSS selector support detection utilities
 */
class SelectorSupport {
    private static supportCache = new Map<string, boolean>()

    /**
     * Check if :has() pseudo-selector is supported
     */
    static hasHasSupport(): boolean {
        if (!EnvironmentDetector.isBrowser()) {
            return false
        }

        if (this.supportCache.has(':has')) {
            return this.supportCache.get(':has')!
        }

        try {
            // Test if :has() is supported by trying to use it
            if (document?.querySelector) {
                document.querySelector(':has(*)')
                this.supportCache.set(':has', true)
                return true
            }
            this.supportCache.set(':has', false)
            return false
        } catch {
            this.supportCache.set(':has', false)
            return false
        }
    }

    /**
     * Check if a CSS selector is valid
     */
    static isValidSelector(selector: string): boolean {
        if (!EnvironmentDetector.isBrowser() || !document?.querySelector) {
            return false
        }

        if (!selector || typeof selector !== 'string') {
            return false
        }

        try {
            document.querySelector(selector)
            return true
        } catch {
            return false
        }
    }
}

/**
 * JavaScript-based element finding utilities for unsupported CSS selectors
 */
class JavaScriptElementFinder {
    /**
     * Find elements by text content (replaces :contains())
     */
    static findByTextContent(
        tagName: string,
        textContent: string,
        exact: boolean = false
    ): HTMLElement[] {
        if (!EnvironmentDetector.isBrowser() || !document?.querySelectorAll) {
            return []
        }

        if (!tagName || !textContent || typeof tagName !== 'string' || typeof textContent !== 'string') {
            return []
        }

        try {
            const elements = Array.from(document.querySelectorAll(tagName))

            return elements.filter((element): element is HTMLElement => {
                if (!DOMTypeGuards.isValidElement(element)) {
                    return false
                }
                const text = DOMTypeGuards.safeGetProperty<string>(element, 'textContent')?.trim() || ''
                return exact ? text === textContent : text.includes(textContent)
            })
        } catch {
            return []
        }
    }

    /**
     * Find elements using :has() functionality with JavaScript fallback
     */
    static findWithHasSelector(
        parentSelector: string,
        childSelector: string
    ): HTMLElement[] {
        if (!EnvironmentDetector.isBrowser() || !document?.querySelectorAll) {
            return []
        }

        if (!parentSelector || !childSelector ||
            typeof parentSelector !== 'string' || typeof childSelector !== 'string') {
            return []
        }

        try {
            const parents = Array.from(document.querySelectorAll(parentSelector))

            return parents.filter((parent): parent is HTMLElement => {
                if (!DOMTypeGuards.isValidElement(parent)) {
                    return false
                }
                const childElement = DOMTypeGuards.safeCallMethod<Element>(parent, 'querySelector', childSelector)
                return childElement !== null
            })
        } catch {
            return []
        }
    }

    /**
     * Find button elements by text content
     */
    static findButtonByText(text: string): HTMLElement[] {
        if (!EnvironmentDetector.isBrowser() || !text || typeof text !== 'string') {
            return []
        }

        try {
            // Check buttons with direct text content
            const buttons = this.findByTextContent('button', text)

            // Check buttons with text in child elements
            const allButtons = Array.from(document.querySelectorAll('button') || [])
            const buttonsWithChildText: HTMLElement[] = []

            allButtons.forEach(button => {
                if (!DOMTypeGuards.isValidElement(button)) {
                    return
                }
                const spans = DOMTypeGuards.safeCallMethod<NodeListOf<Element> <span>>(button, 'querySelectorAll', 'span')
                if (!spans) return

                const hasMatchingText = Array.from(spans).some(span => {
                    const spanText = DOMTypeGuards.safeGetProperty</span><string>(span as HTMLElement, 'textContent')?.trim()
                    return spanText?.includes(text) || false
                })

                if (hasMatchingText) {
                    buttonsWithChildText.push(button)
                }
            })

            // Check elements with role="button"
            const roleButtons = this.findByTextContent('[role="button"]', text)

            // Combine and deduplicate
            const allFound = [...buttons, ...buttonsWithChildText, ...roleButtons]
            const uniqueButtons: HTMLElement[] = []
            allFound.forEach(button => {
                if (DOMTypeGuards.isValidElement(button) && !uniqueButtons.includes(button)) {
                    uniqueButtons.push(button)
                }
            })
            return uniqueButtons
        } catch {
            return []
        }
    }

    /**
     * Find anchor elements by text content
     */
    static findLinkByText(text: string): HTMLElement[] {
        return this.findByTextContent('a', text)
    }

    /**
     * Find form labels and associated inputs
     */
    static findInputByLabelText(labelText: string): HTMLElement[] {
        if (!EnvironmentDetector.isBrowser() || !labelText || typeof labelText !== 'string') {
            return []
        }

        try {
            const labels = this.findByTextContent('label', labelText)
            const inputs: HTMLElement[] = []

            labels.forEach(label => {
                if (!DOMTypeGuards.isValidElement(label)) return

                // Check for associated input via 'for' attribute
                const forAttr = DOMTypeGuards.safeCallMethod<string>(label, 'getAttribute', 'for')
                if (forAttr && document?.getElementById) {
                    const input = document.getElementById(forAttr)
                    if (DOMTypeGuards.isValidElement(input)) {
                        inputs.push(input)
                    }
                }

                // Check for input as next sibling
                const nextSibling = DOMTypeGuards.safeGetProperty<Element>(label, 'nextElementSibling')
                if (DOMTypeGuards.isValidElement(nextSibling) &&
                    DOMTypeGuards.safeGetProperty<string>(nextSibling, 'tagName') === 'INPUT') {
                    inputs.push(nextSibling)
                }

                // Check for input as child
                const childInput = DOMTypeGuards.safeCallMethod<Element>(label, 'querySelector', 'input')
                if (DOMTypeGuards.isValidElement(childInput)) {
                    inputs.push(childInput)
                }
            })

            // Remove duplicates
            const uniqueInputs: HTMLElement[] = []
            inputs.forEach(input => {
                if (DOMTypeGuards.isValidElement(input) && !uniqueInputs.includes(input)) {
                    uniqueInputs.push(input)
                }
            })
            return uniqueInputs
        } catch {
            return []
        }
    }
}

/**
 * Observer state management for proper cleanup
 */
interface ObserverState {
    observer: MutationObserver | null
    timeout: TimeoutId | null
    isActive: boolean
    cleanup: () => void
    selector: string
    createdAt: number
}

/**
 * Observer management with memory leak prevention
 */
class ObserverManager {
    private static activeObservers = new Map<string, ObserverState>()
    private static observerCounter = 0
    private static cleanupInterval: TimeoutId | null = null
    private static readonly CLEANUP_INTERVAL = 30000 // 30 seconds
    private static readonly MAX_OBSERVER_AGE = 300000 // 5 minutes

    /**
     * Initialize cleanup monitoring
     */
    static initialize(): void {
        if (this.cleanupInterval) return

        try {
            this.cleanupInterval = setInterval(() => {
                this.performEmergencyCleanup()
            }, this.CLEANUP_INTERVAL)
        } catch (error) {
            console.warn('Failed to initialize observer cleanup monitoring:', error)
        }
    }

    /**
     * Register a new observer with state tracking
     */
    static registerObserver(
        selector: string,
        observer: MutationObserver | null,
        timeout: TimeoutId | null,
        cleanup: () => void
    ): string {
        const observerId = `observer-${++this.observerCounter}-${Date.now()}`

        const state: ObserverState = {
            observer,
            timeout,
            isActive: true,
            cleanup,
            selector,
            createdAt: Date.now()
        }

        this.activeObservers.set(observerId, state)

        // Initialize cleanup monitoring if not already done
        this.initialize()

        return observerId
    }

    /**
     * Unregister and cleanup an observer
     */
    static unregisterObserver(observerId: string): void {
        const state = this.activeObservers.get(observerId)
        if (!state) return

        try {
            // Mark as inactive first to prevent race conditions
            state.isActive = false

            // Clear timeout
            if (state.timeout) {
                try {
                    clearTimeout(state.timeout)
                } catch (error) {
                    console.warn(`Error clearing timeout for observer ${observerId}:`, error)
                }
                state.timeout = null
            }

            // Disconnect observer
            if (state.observer) {
                try {
                    state.observer.disconnect()
                } catch (error) {
                    console.warn(`Error disconnecting observer ${observerId}:`, error)
                }
                state.observer = null
            }

            // Remove from active observers
            this.activeObservers.delete(observerId)
        } catch (error) {
            console.warn(`Error during observer cleanup for ${observerId}:`, error)
        }
    }

    /**
     * Get cleanup function for an observer
     */
    static getCleanupFunction(observerId: string): (() => void) {
        return () => this.unregisterObserver(observerId)
    }

    /**
     * Perform emergency cleanup of stale observers
     */
    static performEmergencyCleanup(): void {
        const now = Date.now()
        const staleObservers: string[] = []

        // Find stale observers
        this.activeObservers.forEach((state, observerId) => {
            const age = now - state.createdAt
            if (age > this.MAX_OBSERVER_AGE || !state.isActive) {
                staleObservers.push(observerId)
            }
        })

        // Clean up stale observers
        staleObservers.forEach(observerId => {
            console.warn(`Emergency cleanup of stale observer: ${observerId}`)
            this.unregisterObserver(observerId)
        })

        // Log statistics
        if (this.activeObservers.size > 10) {
            console.warn(`High number of active observers: ${this.activeObservers.size}`)
        }
    }

    /**
     * Get observer statistics for monitoring
     */
    static getStatistics(): {
        activeCount: number
        oldestAge: number
        averageAge: number
    } {
        const now = Date.now()
        const ages: number[] = []

        this.activeObservers.forEach(state => {
            ages.push(now - state.createdAt)
        })

        return {
            activeCount: this.activeObservers.size,
            oldestAge: ages.length > 0 ? Math.max(...ages) : 0,
            averageAge: ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0
        }
    }

    /**
     * Cleanup all observers (for testing or shutdown)
     */
    static cleanupAll(): void {
        const observerIds = Array.from(this.activeObservers.keys())
        observerIds.forEach(id => this.unregisterObserver(id))

        if (this.cleanupInterval) {
            try {
                clearInterval(this.cleanupInterval)
            } catch (error) {
                console.warn('Error clearing cleanup interval:', error)
            }
            this.cleanupInterval = null
        }
    }
}

/**
 * Internal smart selector builder with valid CSS syntax and browser compatibility
 * Replaces jQuery-style selectors with standard CSS or JavaScript alternatives
 */
class InternalSmartSelectorBuilder {
    private static readonly COMMON_ATTRIBUTES = [
        'data-testid', 'id', 'class', 'name', 'role', 'aria-label', 'title', 'type', 'href'
    ]

    /**
     * Build smart selectors with browser compatibility checks
     */
    static buildSmartSelectors(element: HTMLElement): string[] {
        if (!EnvironmentDetector.isBrowser() || !DOMTypeGuards.isValidElement(element)) {
            return []
        }

        const selectors: string[] = []

        try {
            // 1. Data-testid selector (highest priority)
            const testId = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'data-testid')
            if (testId && testId.trim()) {
                const escapedTestId = this.escapeAttributeValue(testId.trim())
                selectors.push(`[data-testid="${escapedTestId}"]`)
            }

            // 2. ID selector with validation
            const id = DOMTypeGuards.safeGetProperty<string>(element, 'id')
            if (id && id.trim() && this.isValidCSSIdentifier(id.trim())) {
                const escapedId = this.escapeCSSIdentifier(id.trim())
                selectors.push(`#${escapedId}`)
            }

            // 3. Class-based selectors with validation
            const className = DOMTypeGuards.safeGetProperty<string>(element, 'className')
            if (className && className.trim()) {
                const classes = className.trim().split(/\s+/).filter(cls =>
                    cls && this.isValidCSSIdentifier(cls)
                )

                if (classes.length > 0) {
                    // Single class selector
                    const firstClass = this.escapeCSSIdentifier(classes[0])
                    selectors.push(`.${firstClass}`)

                    // Multiple class selector (if more than one class)
                    if (classes.length > 1) {
                        const escapedClasses = classes.map(cls => this.escapeCSSIdentifier(cls))
                        selectors.push(`.${escapedClasses.join('.')}`)
                    }
                }
            }

            // 4. Name attribute for form elements
            const name = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'name')
            if (name && name.trim() && this.isValidCSSIdentifier(name.trim())) {
                const escapedName = this.escapeAttributeValue(name.trim())
                selectors.push(`[name="${escapedName}"]`)
            }

            // 5. Role-based selectors
            const role = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'role')
            if (role && role.trim()) {
                const escapedRole = this.escapeAttributeValue(role.trim())
                selectors.push(`[role="${escapedRole}"]`)
            }

            // 6. ARIA label selectors
            const ariaLabel = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'aria-label')
            if (ariaLabel && ariaLabel.trim()) {
                const escapedLabel = this.escapeAttributeValue(ariaLabel.trim())
                selectors.push(`[aria-label="${escapedLabel}"]`)

                // Add partial match if supported
                if (this.supportsBrowserFeature('attribute-partial-match')) {
                    selectors.push(`[aria-label*="${escapedLabel}"]`)
                }
            }

            // 7. Tag-based selectors with context
            const tagName = DOMTypeGuards.safeGetProperty<string>(element, 'tagName')?.toLowerCase()
            if (tagName && tagName !== 'div' && tagName !== 'span') {
                selectors.push(tagName)

                // Add tag with role combination
                if (role && role.trim()) {
                    const escapedRole = this.escapeAttributeValue(role.trim())
                    selectors.push(`${tagName}[role="${escapedRole}"]`)
                }
            }

            // 8. Text-based selectors (using JavaScript fallback)
            const textContent = DOMTypeGuards.safeGetProperty<string>(element, 'textContent')?.trim()
            if (textContent && textContent.length > 0 && textContent.length < 50) {
                // Create a pseudo-selector that will be handled by JavaScript fallback
                selectors.push(`${tagName || '*'}:contains("${textContent}")`)
            }

            // 9. Href-based selectors for links
            if (tagName === 'a') {
                const href = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'href')
                if (href && href.trim()) {
                    const escapedHref = this.escapeAttributeValue(href.trim())
                    selectors.push(`a[href="${escapedHref}"]`)
                }
            }

            // 10. Type-based selectors for inputs
            if (tagName === 'input') {
                const type = DOMTypeGuards.safeCallMethod<string>(element, 'getAttribute', 'type')
                if (type && type.trim()) {
                    const escapedType = this.escapeAttributeValue(type.trim())
                    selectors.push(`input[type="${escapedType}"]`)
                }
            }

            // Filter and validate all selectors
            return this.validateAndFilterSelectors(selectors)

        } catch (error) {
            console.warn('Error building smart selectors:', error)
            return []
        }
    }

    /**
     * Build contextual selectors with parent-child relationships
     */
    static buildContextualSelectors(element: HTMLElement): string[] {
        if (!EnvironmentDetector.isBrowser() || !DOMTypeGuards.isValidElement(element)) {
            return []
        }

        const selectors: string[] = []

        try {
            const parent = DOMTypeGuards.safeGetProperty<HTMLElement>(element, 'parentElement')
            if (!DOMTypeGuards.isValidElement(parent)) {
                return []
            }

            // Get basic selectors for both element and parent
            const elementSelectors = this.buildSmartSelectors(element)
            const parentSelectors = this.buildSmartSelectors(parent)

            // Create contextual combinations
            parentSelectors.forEach(parentSelector => {
                elementSelectors.forEach(elementSelector => {
                    // Direct child relationship
                    const directChild = `${parentSelector} > ${elementSelector}`
                    if (this.isValidCSSSelector(directChild)) {
                        selectors.push(directChild)
                    }

                    // Descendant relationship
                    const descendant = `${parentSelector} ${elementSelector}`
                    if (this.isValidCSSSelector(descendant)) {
                        selectors.push(descendant)
                    }
                })
            })

            return this.validateAndFilterSelectors(selectors)

        } catch (error) {
            console.warn('Error building contextual selectors:', error)
            return []
        }
    }

    /**
     * Build selectors using advanced CSS features with fallbacks
     */
    static buildAdvancedSelectors(element: HTMLElement): string[] {
        if (!EnvironmentDetector.isBrowser() || !DOMTypeGuards.isValidElement(element)) {
            return []
        }

        const selectors: string[] = []

        try {
            // :has() selector with fallback
            if (this.supportsBrowserFeature('has-selector')) {
                const children = DOMTypeGuards.safeCallMethod<NodeListOf<Element>>(element, 'querySelectorAll', '*')
                if (children && children.length > 0) {
                    const firstChild = children[0]
                    if (DOMTypeGuards.isValidElement(firstChild as HTMLElement)) {
                        const childTagName = DOMTypeGuards.safeGetProperty<string>(firstChild as HTMLElement, 'tagName')?.toLowerCase()
                        if (childTagName) {
                            const tagName = DOMTypeGuards.safeGetProperty<string>(element, 'tagName')?.toLowerCase()
                            if (tagName) {
                                selectors.push(`${tagName}:has(${childTagName})`)
                            }
                        }
                    }
                }
            }

            // :nth-child() selectors
            if (this.supportsBrowserFeature('nth-child')) {
                const parent = DOMTypeGuards.safeGetProperty<HTMLElement>(element, 'parentElement')
                if (DOMTypeGuards.isValidElement(parent)) {
                    const siblings = Array.from(parent.children || [])
                    const index = siblings.indexOf(element)
                    if (index >= 0) {
                        const tagName = DOMTypeGuards.safeGetProperty<string>(element, 'tagName')?.toLowerCase()
                        if (tagName) {
                            selectors.push(`${tagName}:nth-child(${index + 1})`)
                        }
                    }
                }
            }

            return this.validateAndFilterSelectors(selectors)

        } catch (error) {
            console.warn('Error building advanced selectors:', error)
            return []
        }
    }

    /**
     * Validate and filter selectors to ensure they work across browsers
     */
    private static validateAndFilterSelectors(selectors: string[]): string[] {
        const validSelectors: string[] = []
        const seenSelectors = new Set<string>()

        selectors.forEach(selector => {
            if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
                return
            }

            const trimmedSelector = selector.trim()

            // Skip duplicates
            if (seenSelectors.has(trimmedSelector)) {
                return
            }

            // Validate selector
            if (this.isValidCSSSelector(trimmedSelector) || this.hasJavaScriptFallback(trimmedSelector)) {
                validSelectors.push(trimmedSelector)
                seenSelectors.add(trimmedSelector)
            } else {
                console.warn(`Skipping invalid selector: ${trimmedSelector}`)
            }
        })

        return validSelectors
    }

    /**
     * Check if selector has JavaScript fallback support
     */
    private static hasJavaScriptFallback(selector: string): boolean {
        if (!selector || typeof selector !== 'string') {
            return false
        }

        // Selectors that have JavaScript fallbacks
        return selector.includes(':contains(') ||
            selector.includes(':has(') ||
            /^\[[\w-]+(\s*[*^$|~]?\s*=\s*['"][^'"]*['"])?\]$/.test(selector)
    }

    /**
     * Check if selector is valid CSS
     */
    private static isValidCSSSelector(selector: string): boolean {
        return SelectorSupport.isValidSelector(selector)
    }



    /**
     * Check if browser supports a feature
     */
    private static supportsBrowserFeature(feature: string): boolean {
        // Use the method from TourElementValidator
        return TourElementValidator.supportsBrowserFeature(feature)
    }

    /**
     * Escape CSS identifier
     */
    private static escapeCSSIdentifier(identifier: string): string {
        if (!identifier || typeof identifier !== 'string') {
            return ''
        }

        try {
            if (EnvironmentDetector.isBrowser() && typeof CSS !== 'undefined' && CSS.escape) {
                return CSS.escape(identifier)
            }

            // Manual escaping fallback
            return identifier.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, (match) => {
                const hex = match.charCodeAt(0).toString(16).padStart(2, '0')
                return `\\${hex} `
            })
        } catch (error) {
            console.warn('Error escaping CSS identifier:', error)
            return identifier.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, '_')
        }
    }

    /**
     * Escape attribute value
     */
    private static escapeAttributeValue(value: string): string {
        if (!value || typeof value !== 'string') {
            return ''
        }

        try {
            // Escape quotes and backslashes in attribute values
            return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        } catch (error) {
            console.warn('Error escaping attribute value:', error)
            return value
        }
    }

    /**
     * Check if string is valid CSS identifier
     */
    private static isValidCSSIdentifier(identifier: string): boolean {
        if (!identifier || typeof identifier !== 'string') {
            return false
        }

        try {
            const cssIdentifierRegex = /^[a-zA-Z_\u00A0-\uFFFF][\w\-\u00A0-\uFFFF]*$/

            if (identifier.length === 0) return false
            if (/^-\d/.test(identifier)) return false
            if (/^\d/.test(identifier)) return false

            return cssIdentifierRegex.test(identifier)
        } catch (error) {
            console.warn('Error validating CSS identifier:', error)
            return false
        }
    }
}

/**
 * Validates and finds tour elements with fallback strategies
 */
export class TourElementValidator {
    private static readonly WAIT_TIMEOUT = 5000 // 5 seconds
    private static readonly POLL_INTERVAL = 100 // 100ms

    /**
     * Find element with multiple selector fallbacks and performance tracking
     * Enhanced with comprehensive error handling, validation, and fallback strategies
     */
    static async findElement(
        selectors: string | string[],
        timeout: number = this.WAIT_TIMEOUT
    ): Promise<ElementValidationResult> {
        const startTime = performance.now()

        // Input validation with detailed error reporting
        if (selectors === null || selectors === undefined) {
            const errorDetails = ValidationErrorReporter.createErrorDetails(
                'SELECTOR_INVALID',
                'No selectors provided',
                { input: selectors }
            )

            return {
                element: null,
                selector: '',
                found: false,
                error: ValidationErrorReporter.createMeaningfulErrorMessage('SELECTOR_INVALID', '', { input: selectors }),
                validationMethod: 'hybrid',
                performance: { searchTime: 0, fallbacksAttempted: 0 },
                errorDetails,
                fallbackStrategies: {
                    attempted: [],
                    failed: [],
                    recommendations: ['Provide valid CSS selector or selector array']
                }
            }
        }

        const selectorArray = Array.isArray(selectors) ? selectors : [selectors]

        // Validate selector array with detailed feedback
        const validSelectors = selectorArray.filter(selector =>
            selector && typeof selector === 'string' && selector.trim().length > 0
        )

        if (validSelectors.length === 0) {
            const errorDetails = ValidationErrorReporter.createErrorDetails(
                'SELECTOR_INVALID',
                'No valid selectors provided',
                { originalSelectors: selectorArray, validCount: 0 }
            )

            return {
                element: null,
                selector: selectorArray[0] || '',
                found: false,
                error: ValidationErrorReporter.createMeaningfulErrorMessage('SELECTOR_INVALID', selectorArray[0] || ''),
                validationMethod: 'hybrid',
                performance: { searchTime: 0, fallbacksAttempted: 0 },
                errorDetails,
                fallbackStrategies: {
                    attempted: [],
                    failed: selectorArray,
                    recommendations: ['Provide valid CSS selector strings', 'Ensure selectors are not empty or null']
                }
            }
        }

        // Environment validation
        if (!EnvironmentDetector.isBrowser()) {
            const errorDetails = ValidationErrorReporter.createErrorDetails(
                'ENVIRONMENT_UNSUPPORTED',
                'Element finding requires browser environment',
                { environment: 'non-browser', selectors: validSelectors }
            )

            return {
                element: null,
                selector: validSelectors[0],
                found: false,
                error: ValidationErrorReporter.createMeaningfulErrorMessage('ENVIRONMENT_UNSUPPORTED', validSelectors[0]),
                validationMethod: 'hybrid',
                performance: { searchTime: performance.now() - startTime, fallbacksAttempted: 0 },
                errorDetails,
                fallbackStrategies: {
                    attempted: [],
                    failed: validSelectors,
                    recommendations: ['Run in browser environment', 'Add environment detection']
                }
            }
        }

        // Validate timeout with automatic correction
        let validatedTimeout = timeout
        if (typeof timeout !== 'number' || timeout < 0 || !isFinite(timeout)) {
            console.warn('Invalid timeout provided to findElement, using default')
            validatedTimeout = 100 // Use short timeout for invalid inputs to prevent hanging
        }

        let fallbacksAttempted = 0
        const attemptedSelectors: string[] = []
        const failedSelectors: string[] = []
        const errors: string[] = []

        // Generate fallback strategies for the primary selector
        const fallbackStrategies = FallbackStrategyManager.generateFallbackStrategies(validSelectors[0])

        // Try each selector with comprehensive error handling and performance monitoring
        for (let i = 0; i < validSelectors.length; i++) {
            const selector = validSelectors[i]
            fallbacksAttempted++
            attemptedSelectors.push(selector)

            try {
                // Validate selector before attempting to use it
                if (!SelectorSupport.isValidSelector(selector) && !this.hasJavaScriptFallback(selector)) {
                    const error = `Invalid selector syntax: ${selector}`
                    errors.push(error)
                    failedSelectors.push(selector)
                    continue
                }

                // Add timeout per selector to prevent hanging
                const selectorTimeout = Math.min(validatedTimeout, this.WAIT_TIMEOUT)
                const selectorStartTime = performance.now()

                const element = await this.waitForElement(selector, selectorTimeout)
                const selectorSearchTime = performance.now() - selectorStartTime

                if (element && DOMTypeGuards.isValidElement(element)) {
                    const totalSearchTime = performance.now() - startTime
                    const validationMethod = SelectorSupport.isValidSelector(selector) ? 'css' : 'javascript'

                    // Record successful search metrics
                    PerformanceMonitor.recordSearch(selector, selectorSearchTime, true, i > 0)

                    // Check element visibility and accessibility
                    const visibilityIssues = this.checkElementAccessibility(element)

                    const result: ElementValidationResult = {
                        element,
                        selector,
                        found: true,
                        fallbackUsed: i > 0,
                        validationMethod,
                        performance: {
                            searchTime: totalSearchTime,
                            fallbacksAttempted
                        },
                        fallbackStrategies: {
                            attempted: attemptedSelectors,
                            successful: selector,
                            failed: failedSelectors,
                            recommendations: fallbackStrategies.recommendations
                        }
                    }

                    // Add warnings for accessibility issues
                    if (visibilityIssues.length > 0) {
                        const errorDetails = ValidationErrorReporter.createErrorDetails(
                            'ELEMENT_NOT_ACCESSIBLE',
                            `Element found but has accessibility issues: ${visibilityIssues.join(', ')}`,
                            {
                                selector,
                                issues: visibilityIssues,
                                searchTime: totalSearchTime
                            }
                        )
                        if (errorDetails) {
                            errorDetails.severity = 'low' // Found but with warnings
                            result.errorDetails = errorDetails
                        }
                    }

                    return result
                }

                // Element not found, record failure
                PerformanceMonitor.recordSearch(selector, selectorSearchTime, false, i > 0)
                failedSelectors.push(selector)

            } catch (error) {
                const selectorSearchTime = performance.now() - startTime
                PerformanceMonitor.recordSearch(selector, selectorSearchTime, false, i > 0)

                const errorMessage = error instanceof Error ? error.message : String(error)
                errors.push(`Selector "${selector}": ${errorMessage}`)
                failedSelectors.push(selector)
                console.warn(`Selector failed: ${selector}`, error)
                continue
            }
        }

        // All selectors failed - create comprehensive error report
        const totalSearchTime = performance.now() - startTime
        const primarySelector = validSelectors[0]

        // Determine the most appropriate error code
        let errorCode: keyof typeof ValidationErrorReporter.ERROR_CODES = 'SELECTOR_NOT_FOUND'
        if (totalSearchTime > validatedTimeout) {
            errorCode = 'TIMEOUT_EXCEEDED'
        } else if (!document || typeof document.querySelector !== 'function') {
            errorCode = 'DOM_NOT_READY'
        }

        const errorDetails = ValidationErrorReporter.createErrorDetails(
            errorCode,
            errors.length > 0 ? errors.join('; ') : 'No elements found',
            {
                selectors: validSelectors,
                timeout: validatedTimeout,
                searchTime: totalSearchTime,
                attempts: fallbacksAttempted,
                errors
            }
        )

        const meaningfulError = ValidationErrorReporter.createMeaningfulErrorMessage(
            errorCode,
            primarySelector,
            {
                timeout: validatedTimeout,
                attempts: fallbacksAttempted,
                searchTime: totalSearchTime
            }
        )

        return {
            element: null,
            selector: primarySelector,
            found: false,
            error: meaningfulError,
            validationMethod: 'hybrid',
            performance: {
                searchTime: totalSearchTime,
                fallbacksAttempted
            },
            errorDetails,
            fallbackStrategies: {
                attempted: attemptedSelectors,
                failed: failedSelectors,
                recommendations: fallbackStrategies.recommendations
            }
        }
    }

    /**
     * Check if selector has JavaScript fallback support
     */
    private static hasJavaScriptFallback(selector: string): boolean {
        if (!selector || typeof selector !== 'string') {
            return false
        }

        // Selectors that have JavaScript fallbacks
        return selector.includes(':contains(') ||
            selector.includes(':has(') ||
            /^\[[\w-]+(\s*[*^$|~]?\s*=\s*['"][^'"]*['"])?\]$/.test(selector)
    }

    /**
     * Check element accessibility and visibility issues
     */
    private static checkElementAccessibility(element: HTMLElement): string[] {
        const issues: string[] = []

        try {
            if (!DOMTypeGuards.isValidElement(element)) {
                issues.push('Invalid element')
                return issues
            }

            // Check basic visibility
            if (!this.isElementVisible(element)) {
                issues.push('Element not visible')
            }

            // Check if element is accessible (not covered)
            if (!this.isElementAccessible(element)) {
                issues.push('Element covered by other elements')
            }

            // Check for common accessibility issues
            const style = window.getComputedStyle(element)

            if (style.pointerEvents === 'none') {
                issues.push('Element has pointer-events: none')
            }

            if (element.hasAttribute('disabled')) {
                issues.push('Element is disabled')
            }

            if (element.hasAttribute('readonly')) {
                issues.push('Element is readonly')
            }

            const tabIndex = element.getAttribute('tabindex')
            if (tabIndex === '-1') {
                issues.push('Element not focusable (tabindex=-1)')
            }

        } catch (error) {
            issues.push('Error checking accessibility')
        }

        return issues
    }

    /**
     * Wait for element to appear in DOM with CSS and JavaScript fallbacks
     * Enhanced with comprehensive error handling and race condition prevention
     */
    static async waitForElement(
        selector: string,
        timeout: number = this.WAIT_TIMEOUT
    ): Promise<HTMLElement | null> {
        if (!EnvironmentDetector.isBrowser() || !selector || typeof selector !== 'string') {
            return null
        }

        // Validate timeout parameter - use shorter timeout for invalid values
        if (typeof timeout !== 'number' || timeout < 0 || !isFinite(timeout)) {
            console.warn('Invalid timeout provided to waitForElement, using default')
            timeout = 100 // Use short timeout for invalid inputs
        }

        return new Promise((resolve, reject) => {
            const startTime = Date.now()
            let timeoutId: TimeoutId | null = null
            let isResolved = false

            // Enhanced cleanup with race condition prevention
            let cleanup = () => {
                if (timeoutId) {
                    try {
                        clearTimeout(timeoutId)
                    } catch (error) {
                        console.warn('Error clearing timeout in waitForElement:', error)
                    }
                    timeoutId = null
                }
            }

            // Safe resolve that prevents multiple resolutions
            const safeResolve = (result: HTMLElement | null) => {
                if (isResolved) return
                isResolved = true
                cleanup()
                resolve(result)
            }

            // Safe reject that prevents multiple rejections
            const safeReject = (error: Error) => {
                if (isResolved) return
                isResolved = true
                cleanup()
                reject(error)
            }

            const checkElement = () => {
                // Check if already resolved to prevent race conditions
                if (isResolved) return

                try {
                    let element: HTMLElement | null = null

                    // Validate DOM availability before operations
                    if (!document || typeof document.querySelector !== 'function') {
                        safeResolve(null)
                        return
                    }

                    // Try CSS selector first if it's valid
                    if (SelectorSupport.isValidSelector(selector)) {
                        try {
                            const foundElement = document.querySelector(selector)
                            element = DOMTypeGuards.isValidElement(foundElement) ? foundElement : null
                        } catch (selectorError) {
                            console.warn(`CSS selector error for "${selector}":`, selectorError)
                            // Fall back to JavaScript implementation
                            element = this.findElementWithJavaScriptFallback(selector)
                        }
                    } else {
                        // Use JavaScript fallbacks for invalid selectors
                        try {
                            element = this.findElementWithJavaScriptFallback(selector)
                        } catch (fallbackError) {
                            console.warn(`JavaScript fallback error for "${selector}":`, fallbackError)
                            element = null
                        }
                    }

                    // Check if element is found and visible (with shadow DOM support)
                    if (element) {
                        try {
                            // Use enhanced visibility check that includes shadow DOM support
                            const isVisible = this.isElementVisibleInShadowDOM(element)
                            if (isVisible) {
                                safeResolve(element)
                                return
                            }
                        } catch (visibilityError) {
                            console.warn(`Enhanced visibility check error for element:`, visibilityError)
                            // Fallback to basic visibility check
                            try {
                                if (this.isElementVisible(element)) {
                                    safeResolve(element)
                                    return
                                }
                            } catch (fallbackError) {
                                console.warn(`Fallback visibility check also failed:`, fallbackError)
                                // Continue polling even if visibility check fails
                            }
                        }
                    }

                    // Check timeout
                    const elapsed = Date.now() - startTime
                    if (elapsed >= timeout) {
                        safeResolve(null)
                        return
                    }

                    // Schedule next check with error handling
                    try {
                        timeoutId = setTimeout(() => {
                            checkElement()
                        }, this.POLL_INTERVAL)
                    } catch (timeoutError) {
                        console.warn('Error scheduling next element check:', timeoutError)
                        const errorMessage = timeoutError instanceof Error ? timeoutError.message : String(timeoutError)
                        safeReject(new Error(`Failed to schedule element polling: ${errorMessage}`))
                    }

                } catch (error) {
                    console.warn('Unexpected error in waitForElement checkElement:', error)
                    safeReject(error instanceof Error ? error : new Error(`Unknown error: ${error}`))
                }
            }

            // Start the polling process with error handling
            try {
                checkElement()
            } catch (initialError) {
                console.warn('Error starting element polling:', initialError)
                safeReject(initialError instanceof Error ? initialError : new Error(`Initial polling error: ${initialError}`))
            }

            // Set up timeout safety net to prevent hanging promises
            const safetyTimeoutId = setTimeout(() => {
                if (!isResolved) {
                    console.warn(`Safety timeout triggered for selector: ${selector}`)
                    safeResolve(null)
                }
            }, timeout + 1000) // Add 1 second buffer

            // Clean up safety timeout when promise resolves
            const originalCleanup = cleanup
            cleanup = () => {
                originalCleanup()
                try {
                    clearTimeout(safetyTimeoutId)
                } catch (error) {
                    console.warn('Error clearing safety timeout:', error)
                }
            }
        })
    }

    /**
     * Find element using JavaScript fallbacks for unsupported CSS selectors
     * Enhanced with comprehensive error handling and input validation
     */
    private static findElementWithJavaScriptFallback(selector: string): HTMLElement | null {
        // Environment and input validation
        if (!EnvironmentDetector.isBrowser()) {
            return null
        }

        if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
            return null
        }

        // Validate DOM availability
        if (!document || typeof document.querySelector !== 'function') {
            console.warn('DOM not available for JavaScript fallback')
            return null
        }

        try {
            // Handle :contains() patterns with enhanced error handling
            const containsMatch = selector.match(/^([^:]+):contains\(['"]([^'"]+)['"]\)$/)
            if (containsMatch) {
                const [, tagSelector, text] = containsMatch
                if (tagSelector && text && tagSelector.trim() && text.trim()) {
                    try {
                        const elements = JavaScriptElementFinder.findByTextContent(tagSelector.trim(), text.trim())
                        return elements.length > 0 ? elements[0] : null
                    } catch (containsError) {
                        console.warn(`Error in :contains() fallback for "${selector}":`, containsError)
                        return null
                    }
                }
            }

            // Handle :has() patterns with enhanced error handling
            const hasMatch = selector.match(/^([^:]+):has\(([^)]+)\)$/)
            if (hasMatch) {
                const [, parentSelector, childSelector] = hasMatch
                if (parentSelector && childSelector && parentSelector.trim() && childSelector.trim()) {
                    const trimmedParent = parentSelector.trim()
                    const trimmedChild = childSelector.trim()

                    try {
                        if (SelectorSupport.hasHasSupport()) {
                            // Use native :has() if supported
                            try {
                                const element = document.querySelector(selector)
                                return DOMTypeGuards.isValidElement(element) ? element : null
                            } catch (nativeHasError) {
                                console.warn(`Native :has() failed for "${selector}":`, nativeHasError)
                                // Fall back to JavaScript implementation
                                try {
                                    const elements = JavaScriptElementFinder.findWithHasSelector(trimmedParent, trimmedChild)
                                    return elements.length > 0 ? elements[0] : null
                                } catch (fallbackHasError) {
                                    console.warn(`JavaScript :has() fallback failed for "${selector}":`, fallbackHasError)
                                    return null
                                }
                            }
                        } else {
                            // Use JavaScript fallback
                            try {
                                const elements = JavaScriptElementFinder.findWithHasSelector(trimmedParent, trimmedChild)
                                return elements.length > 0 ? elements[0] : null
                            } catch (jsHasError) {
                                console.warn(`JavaScript :has() fallback failed for "${selector}":`, jsHasError)
                                return null
                            }
                        }
                    } catch (hasError) {
                        console.warn(`Error in :has() fallback for "${selector}":`, hasError)
                        return null
                    }
                }
            }

            // Handle other potential pseudo-selector patterns
            // Check for other unsupported patterns and log warnings
            if (selector.includes(':') && !SelectorSupport.isValidSelector(selector)) {
                console.warn(`Unsupported pseudo-selector pattern: "${selector}"`)
            }

            // For other invalid selectors, return null
            return null
        } catch (error) {
            console.warn(`Unexpected error in findElementWithJavaScriptFallback for "${selector}":`, error)
            return null
        }
    }

    /**
     * Check if element is visible and interactable with enhanced validation
     */
    static isElementVisible(element: HTMLElement): boolean {
        if (!EnvironmentDetector.isBrowser() || !DOMTypeGuards.isValidElement(element)) {
            return false
        }

        try {
            const rect = DOMTypeGuards.safeCallMethod<DOMRect>(element, 'getBoundingClientRect')
            if (!rect) return false

            const style = window?.getComputedStyle?.(element)
            if (!style) return false

            // Basic visibility checks
            if (rect.width <= 0 || rect.height <= 0) return false
            if (style.display === 'none') return false
            if (style.visibility === 'hidden') return false

            // Enhanced opacity checks
            const opacity = parseFloat(style.opacity || '1')
            if (opacity <= 0) return false

            // Check for CSS transforms that might hide the element
            const transform = style.transform
            if (transform && transform !== 'none') {
                // Check for scale(0) or similar transforms that make element invisible
                const scaleMatch = transform.match(/scale\(([^)]+)\)/)
                if (scaleMatch) {
                    const scaleValue = parseFloat(scaleMatch[1])
                    if (scaleValue <= 0) return false
                }
            }

            // Check for clip-path that might hide the element
            const clipPath = style.clipPath
            if (clipPath && clipPath !== 'none' && clipPath.includes('inset(100%')) {
                return false
            }

            // Check for overflow hidden on parent that might clip the element
            // Skip viewport check in test environments where viewport dimensions might not be accurate
            if (typeof jest === 'undefined' && typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                if (!this.isElementInViewport(element, rect)) {
                    return false
                }
            }

            // Check if element is behind other elements (z-index considerations)
            if (!this.isElementAccessible(element, rect)) {
                return false
            }

            // Enhanced offset parent check with iframe support
            const offsetParent = DOMTypeGuards.safeGetProperty<Element>(element, 'offsetParent')
            if (offsetParent === null) {
                // Element might be in an iframe or have position: fixed
                const position = style.position
                if (position !== 'fixed' && !this.isInIframe(element)) {
                    return false
                }
            }

            return true
        } catch (error) {
            console.warn('Error checking element visibility:', error)
            return false
        }
    }

    /**
     * Check if element is within viewport bounds
     */
    private static isElementInViewport(element: HTMLElement, rect?: DOMRect): boolean {
        try {
            const elementRect = rect || DOMTypeGuards.safeCallMethod<DOMRect>(element, 'getBoundingClientRect')
            if (!elementRect) return false

            const viewport = {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight
            }

            // Check if element is completely outside viewport
            if (elementRect.right < 0 || elementRect.bottom < 0) return false
            if (elementRect.left > viewport.width || elementRect.top > viewport.height) return false

            // Element is at least partially in viewport
            return true
        } catch (error) {
            console.warn('Error checking viewport bounds:', error)
            return true // Default to visible if check fails
        }
    }

    /**
     * Check if element is accessible (not covered by other elements)
     */
    private static isElementAccessible(element: HTMLElement, rect?: DOMRect): boolean {
        try {
            const elementRect = rect || DOMTypeGuards.safeCallMethod<DOMRect>(element, 'getBoundingClientRect')
            if (!elementRect) return false

            // Skip accessibility check in test environments where elementFromPoint might not work properly
            if (typeof jest !== 'undefined' || typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
                return true
            }

            // Get center point of element
            const centerX = elementRect.left + elementRect.width / 2
            const centerY = elementRect.top + elementRect.height / 2

            // Check if element at center point is the target element or its descendant
            const elementAtPoint = document.elementFromPoint(centerX, centerY)
            if (!elementAtPoint) return true // If no element found, assume accessible

            // Check if the element at point is the target element or contains it
            return element === elementAtPoint || element.contains(elementAtPoint) || elementAtPoint.contains(element)
        } catch (error) {
            console.warn('Error checking element accessibility:', error)
            return true // Default to accessible if check fails
        }
    }

    /**
     * Check if element is inside an iframe
     */
    private static isInIframe(element: HTMLElement): boolean {
        try {
            return window.self !== window.top
        } catch (error) {
            // If we can't access window.top due to cross-origin restrictions,
            // we're likely in an iframe
            return true
        }
    }

    /**
     * Enhanced visibility check with shadow DOM support
     */
    static isElementVisibleInShadowDOM(element: HTMLElement): boolean {
        if (!EnvironmentDetector.isBrowser() || !DOMTypeGuards.isValidElement(element)) {
            return false
        }

        try {
            // First check regular visibility
            if (!this.isElementVisible(element)) {
                return false
            }

            // Check if element is in shadow DOM
            const shadowInfo = this.getShadowDOMInfo(element)
            if (!shadowInfo.isInShadowDOM) {
                return true // Regular DOM element, already checked
            }

            // For shadow DOM elements, check if shadow host is visible
            if (shadowInfo.shadowHost && !this.isElementVisible(shadowInfo.shadowHost)) {
                return false
            }

            // Check shadow DOM specific visibility rules
            return this.checkShadowDOMVisibility(element, shadowInfo)
        } catch (error) {
            console.warn('Error checking shadow DOM visibility:', error)
            return false
        }
    }

    /**
     * Get shadow DOM information for an element
     */
    private static getShadowDOMInfo(element: HTMLElement): {
        isInShadowDOM: boolean
        shadowHost: HTMLElement | null
        shadowRoot: ShadowRoot | null
        shadowDepth: number
    } {
        try {
            let currentElement: Node | null = element
            let shadowHost: HTMLElement | null = null
            let shadowRoot: ShadowRoot | null = null
            let shadowDepth = 0

            // Traverse up the DOM tree looking for shadow boundaries
            while (currentElement) {
                const parent: Node | null = currentElement.parentNode

                // Check if parent is a shadow root
                if (parent && (parent as any).host) {
                    shadowRoot = parent as ShadowRoot
                    shadowHost = (parent as ShadowRoot).host as HTMLElement
                    shadowDepth++
                    break
                }

                currentElement = parent
            }

            return {
                isInShadowDOM: shadowHost !== null,
                shadowHost,
                shadowRoot,
                shadowDepth
            }
        } catch (error) {
            console.warn('Error getting shadow DOM info:', error)
            return {
                isInShadowDOM: false,
                shadowHost: null,
                shadowRoot: null,
                shadowDepth: 0
            }
        }
    }

    /**
     * Check visibility rules specific to shadow DOM
     */
    private static checkShadowDOMVisibility(
        element: HTMLElement,
        shadowInfo: { shadowHost: HTMLElement | null; shadowRoot: ShadowRoot | null }
    ): boolean {
        try {
            if (!shadowInfo.shadowHost || !shadowInfo.shadowRoot) {
                return true
            }

            // Check if shadow root has specific styling that affects visibility
            const shadowHostStyle = window.getComputedStyle(shadowInfo.shadowHost)

            // Shadow host display/visibility affects shadow content
            if (shadowHostStyle.display === 'none' || shadowHostStyle.visibility === 'hidden') {
                return false
            }

            // Check for shadow-specific CSS that might hide content
            const elementStyle = window.getComputedStyle(element)

            // Some shadow DOM implementations use specific CSS properties
            if (elementStyle.display === 'none' || elementStyle.visibility === 'hidden') {
                return false
            }

            return true
        } catch (error) {
            console.warn('Error checking shadow DOM specific visibility:', error)
            return true // Default to visible if check fails
        }
    }

    /**
     * Enhanced position calculation with shadow DOM support
     */
    static getElementPositionInShadowDOM(element: HTMLElement): {
        top: number
        left: number
        width: number
        height: number
        center: { x: number; y: number }
        viewport: {
            top: number
            left: number
            right: number
            bottom: number
            isVisible: boolean
            visibleArea: number
        }
        scroll: { x: number; y: number }
        shadowDOM?: {
            isInShadowDOM: boolean
            shadowHost: HTMLElement | null
            hostOffset: { x: number; y: number }
        }
        iframe?: {
            offsetX: number
            offsetY: number
            isInIframe: boolean
        }
    } | null {
        if (!EnvironmentDetector.isBrowser() || !DOMTypeGuards.isValidElement(element)) {
            return null
        }

        try {
            // Get basic position information
            const basicPosition = this.getElementPosition(element)
            if (!basicPosition) return null

            // Get shadow DOM information
            const shadowInfo = this.getShadowDOMInfo(element)

            if (!shadowInfo.isInShadowDOM) {
                return basicPosition // No shadow DOM, return basic position
            }

            // Calculate shadow host offset
            let hostOffset = { x: 0, y: 0 }
            if (shadowInfo.shadowHost) {
                const hostRect = shadowInfo.shadowHost.getBoundingClientRect()
                const scroll = this.getScrollPosition()
                hostOffset = {
                    x: hostRect.left + scroll.x,
                    y: hostRect.top + scroll.y
                }
            }

            return {
                ...basicPosition,
                shadowDOM: {
                    isInShadowDOM: true,
                    shadowHost: shadowInfo.shadowHost,
                    hostOffset
                }
            }
        } catch (error) {
            console.warn('Error getting shadow DOM element position:', error)
            return null
        }
    }

    /**
     * Get element position for tour positioning with enhanced viewport and scrolling handling
     */
    static getElementPosition(element: HTMLElement): {
        top: number
        left: number
        width: number
        height: number
        center: { x: number; y: number }
        viewport: {
            top: number
            left: number
            right: number
            bottom: number
            isVisible: boolean
            visibleArea: number
        }
        scroll: {
            x: number
            y: number
        }
        iframe?: {
            offsetX: number
            offsetY: number
            isInIframe: boolean
        }
    } | null {
        if (!EnvironmentDetector.isBrowser() || !DOMTypeGuards.isValidElement(element)) {
            return null
        }

        try {
            const rect = DOMTypeGuards.safeCallMethod<DOMRect>(element, 'getBoundingClientRect')
            if (!rect) return null

            // Enhanced scroll position calculation
            const scroll = this.getScrollPosition()

            // Calculate absolute position
            const absoluteTop = rect.top + scroll.y
            const absoluteLeft = rect.left + scroll.x

            // Calculate viewport information
            const viewport = this.calculateViewportInfo(rect)

            // Handle iframe positioning
            const iframeInfo = this.getIframeOffset(element)

            // Calculate final positions accounting for iframe offset
            const finalTop = absoluteTop + (iframeInfo.isInIframe ? iframeInfo.offsetY : 0)
            const finalLeft = absoluteLeft + (iframeInfo.isInIframe ? iframeInfo.offsetX : 0)

            return {
                top: finalTop,
                left: finalLeft,
                width: rect.width,
                height: rect.height,
                center: {
                    x: finalLeft + rect.width / 2,
                    y: finalTop + rect.height / 2
                },
                viewport,
                scroll,
                ...(iframeInfo.isInIframe && { iframe: iframeInfo })
            }
        } catch (error) {
            console.warn('Error getting element position:', error)
            return null
        }
    }

    /**
     * Get accurate scroll position across different browsers and contexts
     */
    private static getScrollPosition(): { x: number; y: number } {
        try {
            // Modern browsers
            if (window.pageXOffset !== undefined && window.pageYOffset !== undefined) {
                return {
                    x: window.pageXOffset,
                    y: window.pageYOffset
                }
            }

            // IE and older browsers
            const docElement = document.documentElement
            const docBody = document.body

            const scrollLeft = (docElement && docElement.scrollLeft) ||
                (docBody && docBody.scrollLeft) || 0
            const scrollTop = (docElement && docElement.scrollTop) ||
                (docBody && docBody.scrollTop) || 0

            return {
                x: scrollLeft,
                y: scrollTop
            }
        } catch (error) {
            console.warn('Error getting scroll position:', error)
            return { x: 0, y: 0 }
        }
    }

    /**
     * Calculate viewport information for the element
     */
    private static calculateViewportInfo(rect: DOMRect): {
        top: number
        left: number
        right: number
        bottom: number
        isVisible: boolean
        visibleArea: number
    } {
        try {
            const viewport = {
                width: window.innerWidth || document.documentElement.clientWidth || 0,
                height: window.innerHeight || document.documentElement.clientHeight || 0
            }

            // Calculate visible boundaries
            const visibleTop = Math.max(0, rect.top)
            const visibleLeft = Math.max(0, rect.left)
            const visibleRight = Math.min(viewport.width, rect.right)
            const visibleBottom = Math.min(viewport.height, rect.bottom)

            // Calculate visible area
            const visibleWidth = Math.max(0, visibleRight - visibleLeft)
            const visibleHeight = Math.max(0, visibleBottom - visibleTop)
            const visibleArea = visibleWidth * visibleHeight
            const totalArea = rect.width * rect.height
            const visiblePercentage = totalArea > 0 ? (visibleArea / totalArea) : 0

            return {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom,
                isVisible: visiblePercentage > 0,
                visibleArea: visiblePercentage
            }
        } catch (error) {
            console.warn('Error calculating viewport info:', error)
            return {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom,
                isVisible: false,
                visibleArea: 0
            }
        }
    }

    /**
     * Get iframe offset information for elements inside iframes
     */
    private static getIframeOffset(element: HTMLElement): {
        offsetX: number
        offsetY: number
        isInIframe: boolean
    } {
        try {
            const isInIframe = this.isInIframe(element)

            if (!isInIframe) {
                return {
                    offsetX: 0,
                    offsetY: 0,
                    isInIframe: false
                }
            }

            // Try to get iframe element in parent window
            let offsetX = 0
            let offsetY = 0

            try {
                // This might fail due to cross-origin restrictions
                if (window.parent && window.parent !== window) {
                    const iframes = window.parent.document.querySelectorAll('iframe')
                    for (const iframe of iframes) {
                        try {
                            if (iframe.contentWindow === window) {
                                const iframeRect = iframe.getBoundingClientRect()
                                const parentScroll = {
                                    x: window.parent.pageXOffset || 0,
                                    y: window.parent.pageYOffset || 0
                                }
                                offsetX = iframeRect.left + parentScroll.x
                                offsetY = iframeRect.top + parentScroll.y
                                break
                            }
                        } catch (e) {
                            // Cross-origin iframe, can't access
                            continue
                        }
                    }
                }
            } catch (error) {
                // Cross-origin restrictions, use default values
                console.warn('Cannot access parent window for iframe offset calculation:', error)
            }

            return {
                offsetX,
                offsetY,
                isInIframe: true
            }
        } catch (error) {
            console.warn('Error getting iframe offset:', error)
            return {
                offsetX: 0,
                offsetY: 0,
                isInIframe: false
            }
        }
    }

    /**
     * Generate fallback selectors for common patterns
     * Enhanced with SmartSelectorBuilder for valid CSS syntax and browser compatibility
     */
    static generateFallbackSelectors(primarySelector: string): string[] {
        // Input validation
        if (!primarySelector || typeof primarySelector !== 'string' || primarySelector.trim().length === 0) {
            return []
        }

        const selectors = [primarySelector]

        try {
            // Try to find the element first to generate smart selectors
            if (EnvironmentDetector.isBrowser() && document?.querySelector) {
                try {
                    const element = document.querySelector(primarySelector)
                    if (DOMTypeGuards.isValidElement(element)) {
                        // Use InternalSmartSelectorBuilder to generate additional selectors
                        const smartSelectors = InternalSmartSelectorBuilder.buildSmartSelectors(element)
                        const contextualSelectors = InternalSmartSelectorBuilder.buildContextualSelectors(element)
                        const advancedSelectors = InternalSmartSelectorBuilder.buildAdvancedSelectors(element)

                        selectors.push(...smartSelectors, ...contextualSelectors, ...advancedSelectors)
                    }
                } catch (elementError) {
                    console.warn(`Could not find element for smart selector generation: ${primarySelector}`, elementError)
                }
            }

            // Fallback to pattern-based selector generation
            // Add data-testid fallbacks with proper escaping
            if (!primarySelector.includes('data-testid')) {
                const testId = this.extractTestId(primarySelector)
                if (testId) {
                    const escapedTestId = this.escapeCSSSelector(testId)
                    // Use exact match for data-testid to avoid partial matches
                    selectors.push(`[data-testid="${escapedTestId}"]`)
                    // Add partial match as fallback only if browser supports it
                    if (this.supportsBrowserFeature('attribute-partial-match')) {
                        selectors.push(`[data-testid*="${escapedTestId}"]`)
                    }
                }
            }

            // Add role-based fallbacks with proper validation
            if (primarySelector.includes('button')) {
                // Standard button element
                selectors.push('button')
                // Elements with button role
                selectors.push('[role="button"]')
                // Combination for better specificity
                selectors.push('button[role="button"]')
            }

            if (primarySelector.includes('nav')) {
                // Standard nav element
                selectors.push('nav')
                // Elements with navigation role
                selectors.push('[role="navigation"]')
                // Combination for better specificity
                selectors.push('nav[role="navigation"]')
            }

            // Add link-based fallbacks
            if (primarySelector.includes('link') || primarySelector.includes('a[')) {
                selectors.push('a')
                selectors.push('[role="link"]')
                selectors.push('a[role="link"]')
            }

            // Add input-based fallbacks
            if (primarySelector.includes('input')) {
                selectors.push('input')
                selectors.push('[role="textbox"]')
                selectors.push('[role="searchbox"]')
            }

            // Add class-based fallbacks with proper escaping
            const classMatch = primarySelector.match(/\[class[*^$|~]?=['"]([^'"]+)['"]\]/)
            if (classMatch && classMatch[1]) {
                const className = classMatch[1].trim()
                if (className && this.isValidCSSIdentifier(className)) {
                    const escapedClassName = this.escapeCSSSelector(className)
                    selectors.push(`.${escapedClassName}`)
                }
            }

            // Extract class from class attribute patterns
            const directClassMatch = primarySelector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/)
            if (directClassMatch && directClassMatch[1]) {
                const className = directClassMatch[1]
                if (this.isValidCSSIdentifier(className)) {
                    const escapedClassName = this.escapeCSSSelector(className)
                    selectors.push(`[class~="${escapedClassName}"]`)
                }
            }

            // Add ID-based fallbacks with proper escaping
            const idMatch = primarySelector.match(/#([a-zA-Z][a-zA-Z0-9_-]*)/)
            if (idMatch && idMatch[1]) {
                const idValue = idMatch[1]
                if (this.isValidCSSIdentifier(idValue)) {
                    const escapedId = this.escapeCSSSelector(idValue)
                    selectors.push(`[id="${escapedId}"]`)
                }
            }

            // Add attribute-based fallbacks for common patterns
            const ariaLabelMatch = primarySelector.match(/\[aria-label[*^$|~]?=['"]([^'"]+)['"]\]/)
            if (ariaLabelMatch && ariaLabelMatch[1]) {
                const labelText = ariaLabelMatch[1].trim()
                if (labelText) {
                    const escapedLabel = this.escapeCSSSelector(labelText)
                    // Exact match first
                    selectors.push(`[aria-label="${escapedLabel}"]`)
                    // Partial match if supported
                    if (this.supportsBrowserFeature('attribute-partial-match')) {
                        selectors.push(`[aria-label*="${escapedLabel}"]`)
                    }
                }
            }

            // Add title attribute fallbacks
            const titleMatch = primarySelector.match(/\[title[*^$|~]?=['"]([^'"]+)['"]\]/)
            if (titleMatch && titleMatch[1]) {
                const titleText = titleMatch[1].trim()
                if (titleText) {
                    const escapedTitle = this.escapeCSSSelector(titleText)
                    selectors.push(`[title="${escapedTitle}"]`)
                }
            }

            // Add name attribute fallbacks for form elements
            const nameMatch = primarySelector.match(/\[name[*^$|~]?=['"]([^'"]+)['"]\]/)
            if (nameMatch && nameMatch[1]) {
                const nameValue = nameMatch[1].trim()
                if (nameValue && this.isValidCSSIdentifier(nameValue)) {
                    const escapedName = this.escapeCSSSelector(nameValue)
                    selectors.push(`[name="${escapedName}"]`)
                }
            }

            // Filter out invalid selectors and remove duplicates
            const validSelectors: string[] = []
            const seenSelectors = new Set<string>()

            selectors.forEach(selector => {
                if (selector &&
                    typeof selector === 'string' &&
                    selector.trim().length > 0 &&
                    !seenSelectors.has(selector.trim())) {

                    const trimmedSelector = selector.trim()

                    // Only add if it's a valid CSS selector or a known pattern with JavaScript fallback
                    if (this.isValidCSSSelector(trimmedSelector) || this.isKnownPatternWithFallback(trimmedSelector)) {
                        validSelectors.push(trimmedSelector)
                        seenSelectors.add(trimmedSelector)
                    } else {
                        console.warn(`Skipping invalid selector: ${trimmedSelector}`)
                    }
                }
            })

            return validSelectors
        } catch (error) {
            console.warn('Error generating fallback selectors:', error)
            // Return at least the primary selector if fallback generation fails
            return [primarySelector]
        }
    }

    /**
     * Check if a selector is a valid CSS selector
     */
    private static isValidCSSSelector(selector: string): boolean {
        if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
            return false
        }
        return SelectorSupport.isValidSelector(selector)
    }

    /**
     * Escape special characters in CSS selectors
     * Enhanced with proper CSS escaping using modern browser APIs
     */
    private static escapeCSSSelector(input: string): string {
        if (!input || typeof input !== 'string') {
            return ''
        }

        try {
            // Use CSS.escape if available (modern browsers)
            if (EnvironmentDetector.isBrowser() && typeof CSS !== 'undefined' && CSS.escape) {
                return CSS.escape(input)
            }

            // Fallback manual escaping for older browsers or Node.js
            // Escape characters that have special meaning in CSS selectors
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, (match) => {
                // Convert character to hex code and escape it
                const hex = match.charCodeAt(0).toString(16).padStart(2, '0')
                return `\\${hex} `
            })
        } catch (error) {
            console.warn('Error escaping CSS selector:', error)
            // Return input with basic character replacement as fallback
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, '_')
        }
    }

    /**
     * Check if browser supports a specific feature
     * Enhanced browser compatibility detection for advanced selectors
     */
    static supportsBrowserFeature(feature: string): boolean {
        if (!EnvironmentDetector.isBrowser()) {
            return false
        }

        // Cache feature detection results to avoid repeated tests
        const cacheKey = `feature-${feature}`
        const cache = (SelectorSupport as any).supportCache
        if (cache && cache.has(cacheKey)) {
            return cache.get(cacheKey)!
        }

        let supported = false

        try {
            switch (feature) {
                case 'attribute-partial-match':
                    // Test if [attr*="value"] is supported
                    if (document?.querySelector) {
                        document.querySelector('[class*=""]') // Empty string test
                        supported = true
                    }
                    break

                case 'has-selector':
                    // Use existing :has() support detection
                    supported = SelectorSupport.hasHasSupport()
                    break

                case 'contains-selector':
                    // :contains() is not standard CSS, always return false
                    // We provide JavaScript fallbacks for this
                    supported = false
                    break

                case 'nth-child':
                    // Test if :nth-child() is supported
                    if (document?.querySelector) {
                        document.querySelector(':nth-child(1)')
                        supported = true
                    }
                    break

                case 'css-escape':
                    // Test if CSS.escape is available
                    supported = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
                    break

                case 'attribute-case-insensitive':
                    // Test if [attr="value" i] is supported
                    try {
                        if (document?.querySelector) {
                            document.querySelector('[class="test" i]')
                            supported = true
                        }
                    } catch {
                        supported = false
                    }
                    break

                default:
                    console.warn(`Unknown browser feature test: ${feature}`)
                    supported = false
            }
        } catch {
            supported = false
        }

        // Cache the result
        if (cache) {
            cache.set(cacheKey, supported)
        }

        return supported
    }

    /**
     * Check if a string is a valid CSS identifier
     * Enhanced validation for CSS selector components
     */
    private static isValidCSSIdentifier(identifier: string): boolean {
        if (!identifier || typeof identifier !== 'string') {
            return false
        }

        try {
            // CSS identifiers must start with a letter, underscore, or non-ASCII character
            // and can contain letters, digits, hyphens, underscores, or non-ASCII characters
            // Also cannot be empty and cannot start with a digit or hyphen followed by digit
            const cssIdentifierRegex = /^[a-zA-Z_\u00A0-\uFFFF][\w\-\u00A0-\uFFFF]*$/

            // Additional checks for edge cases
            if (identifier.length === 0) return false
            if (/^-\d/.test(identifier)) return false // Cannot start with hyphen followed by digit
            if (/^\d/.test(identifier)) return false // Cannot start with digit

            return cssIdentifierRegex.test(identifier)
        } catch (error) {
            console.warn('Error validating CSS identifier:', error)
            return false
        }
    }

    /**
     * Check if a selector matches known patterns that have JavaScript fallbacks
     * Enhanced pattern recognition for smart selector building
     */
    private static isKnownPatternWithFallback(selector: string): boolean {
        if (!selector || typeof selector !== 'string') {
            return false
        }

        try {
            const trimmedSelector = selector.trim()

            // Allow selectors that contain :contains() or :has() as they have JavaScript fallbacks
            if (trimmedSelector.includes(':contains(') || trimmedSelector.includes(':has(')) {
                return true
            }

            // Allow common attribute selectors with proper syntax validation
            if (/^\[[\w-]+(\s*[*^$|~]?\s*=\s*['"][^'"]*['"])?\]$/.test(trimmedSelector)) {
                return true
            }

            // Allow simple class and ID selectors with valid identifiers
            if (/^[.#][a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmedSelector)) {
                return true
            }

            // Allow simple tag selectors
            if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmedSelector)) {
                return true
            }

            // Allow role-based selectors
            if (/^\[role=['"][^'"]+['"]\]$/.test(trimmedSelector)) {
                return true
            }

            // Allow data attribute selectors
            if (/^\[data-[\w-]+(\s*[*^$|~]?\s*=\s*['"][^'"]*['"])?\]$/.test(trimmedSelector)) {
                return true
            }

            // Allow aria attribute selectors
            if (/^\[aria-[\w-]+(\s*[*^$|~]?\s*=\s*['"][^'"]*['"])?\]$/.test(trimmedSelector)) {
                return true
            }

            return false
        } catch (error) {
            console.warn('Error checking known pattern with fallback:', error)
            return false
        }
    }

    /**
     * Extract test ID from selector with robust edge case handling
     */
    static extractTestId(selector: string): string | null {
        // Input validation
        if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
            return null
        }

        try {
            const trimmedSelector = selector.trim()

            // Extract from existing data-testid attributes
            const testIdMatch = trimmedSelector.match(/\[data-testid\s*[*^$|~]?\s*=\s*['"]([^'"]+)['"]\]/)
            if (testIdMatch && testIdMatch[1]) {
                return this.sanitizeTestId(testIdMatch[1])
            }

            // Extract from href patterns with better validation
            const hrefMatch = trimmedSelector.match(/\[href\s*[*^$|~]?\s*=\s*['"]([^'"]+)['"]\]/)
            if (hrefMatch && hrefMatch[1]) {
                const href = hrefMatch[1]
                // Extract meaningful part from URL paths
                const pathParts = href.split('/').filter(part => part && part.length > 0)
                if (pathParts.length > 0) {
                    const lastPart = pathParts[pathParts.length - 1]
                    // Remove query parameters and fragments
                    const cleanPart = lastPart.split('?')[0].split('#')[0]
                    if (cleanPart && cleanPart.length > 0) {
                        return this.sanitizeTestId(cleanPart)
                    }
                }
                return this.sanitizeTestId(href)
            }

            // Extract from text content patterns (handles :contains() pseudo-selector)
            const textMatch = trimmedSelector.match(/:contains\s*\(\s*['"]([^'"]+)['"]\s*\)/)
            if (textMatch && textMatch[1]) {
                return this.sanitizeTestId(textMatch[1])
            }

            // Extract from aria-label patterns
            const ariaLabelMatch = trimmedSelector.match(/\[aria-label\s*[*^$|~]?\s*=\s*['"]([^'"]+)['"]\]/)
            if (ariaLabelMatch && ariaLabelMatch[1]) {
                return this.sanitizeTestId(ariaLabelMatch[1])
            }

            // Extract from class patterns with better validation
            const classMatch = trimmedSelector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/)
            if (classMatch && classMatch[1]) {
                return this.sanitizeTestId(classMatch[1])
            }

            // Extract from class attribute patterns
            const classAttrMatch = trimmedSelector.match(/\[class\s*[*^$|~]?\s*=\s*['"]([^'"]+)['"]\]/)
            if (classAttrMatch && classAttrMatch[1]) {
                // Take the first class if multiple classes
                const firstClass = classAttrMatch[1].split(/\s+/)[0]
                if (firstClass && firstClass.length > 0) {
                    return this.sanitizeTestId(firstClass)
                }
            }

            // Extract from id patterns with better validation
            const idMatch = trimmedSelector.match(/#([a-zA-Z][a-zA-Z0-9_-]*)/)
            if (idMatch && idMatch[1]) {
                return this.sanitizeTestId(idMatch[1])
            }

            // Extract from id attribute patterns
            const idAttrMatch = trimmedSelector.match(/\[id\s*[*^$|~]?\s*=\s*['"]([^'"]+)['"]\]/)
            if (idAttrMatch && idAttrMatch[1]) {
                return this.sanitizeTestId(idAttrMatch[1])
            }

            // Extract from name attribute patterns
            const nameMatch = trimmedSelector.match(/\[name\s*[*^$|~]?\s*=\s*['"]([^'"]+)['"]\]/)
            if (nameMatch && nameMatch[1]) {
                return this.sanitizeTestId(nameMatch[1])
            }

            // Extract from role patterns
            const roleMatch = trimmedSelector.match(/\[role\s*[*^$|~]?\s*=\s*['"]([^'"]+)['"]\]/)
            if (roleMatch && roleMatch[1]) {
                return this.sanitizeTestId(roleMatch[1])
            }

            // Extract from tag names as last resort
            const tagMatch = trimmedSelector.match(/^([a-zA-Z][a-zA-Z0-9]*)/)
            if (tagMatch && tagMatch[1] && tagMatch[1] !== 'div' && tagMatch[1] !== 'span') {
                return this.sanitizeTestId(tagMatch[1])
            }

            return null
        } catch (error) {
            console.warn('Error extracting test ID from selector:', error)
            return null
        }
    }

    /**
     * Sanitize and normalize test ID strings
     */
    private static sanitizeTestId(input: string): string | null {
        if (!input || typeof input !== 'string') {
            return null
        }

        try {
            // Remove leading/trailing whitespace
            let sanitized = input.trim()

            // Handle empty string after trimming
            if (sanitized.length === 0) {
                return null
            }

            // Convert to lowercase for consistency
            sanitized = sanitized.toLowerCase()

            // Replace common separators and special characters with hyphens
            sanitized = sanitized.replace(/[\s\/\\._:;,|~`!@#$%^&*()+=\[\]{}'"<>?]/g, '-')

            // Remove multiple consecutive hyphens
            sanitized = sanitized.replace(/-+/g, '-')

            // Remove leading/trailing hyphens
            sanitized = sanitized.replace(/^-+|-+$/g, '')

            // Ensure it starts with a letter or number (valid CSS identifier)
            if (sanitized.length > 0 && !/^[a-zA-Z0-9]/.test(sanitized)) {
                sanitized = 'test-' + sanitized
            }

            // Limit length to reasonable size
            if (sanitized.length > 50) {
                sanitized = sanitized.substring(0, 50).replace(/-+$/, '')
            }

            // Return null if result is empty or too short
            if (sanitized.length < 2) {
                return null
            }

            return sanitized
        } catch (error) {
            console.warn('Error sanitizing test ID:', error)
            return null
        }
    }





    /**
     * Check if a selector matches known patterns that should be allowed
     */
    private static isKnownPattern(selector: string): boolean {
        if (!selector || typeof selector !== 'string') {
            return false
        }

        try {
            // Allow selectors that contain :contains() or :has() as they have JavaScript fallbacks
            if (selector.includes(':contains(') || selector.includes(':has(')) {
                return true
            }

            // Allow common attribute selectors
            if (/^\[[\w-]+(\s*[*^$|~]?\s*=\s*['"][^'"]*['"])?\]$/.test(selector)) {
                return true
            }

            // Allow simple class and ID selectors
            if (/^[.#][a-zA-Z][a-zA-Z0-9_-]*$/.test(selector)) {
                return true
            }

            // Allow simple tag selectors
            if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(selector)) {
                return true
            }

            return false
        } catch (error) {
            console.warn('Error checking known pattern:', error)
            return false
        }
    }



    /**
     * Create fallback strategies when elements cannot be found
     */
    static createFallbackStrategies(selector: string, context?: {
        elementType?: string
        expectedText?: string
        parentSelector?: string
        attributes?: Record<string, string>
    }): {
        immediate: string[]
        delayed: string[]
        alternative: string[]
        recommendations: string[]
    } {
        const immediate: string[] = []
        const delayed: string[] = []
        const alternative: string[] = []
        const recommendations: string[] = []

        try {
            // Immediate fallbacks (try right away)
            if (context?.attributes?.['data-testid']) {
                immediate.push(`[data-testid="${context.attributes['data-testid']}"]`)
            }

            if (context?.attributes?.id) {
                immediate.push(`#${context.attributes.id}`)
            }

            // Delayed fallbacks (try after waiting)
            if (context?.parentSelector) {
                delayed.push(`${context.parentSelector} ${selector}`)
                delayed.push(`${context.parentSelector} > ${selector}`)
            }

            // Alternative approaches
            if (context?.expectedText) {
                alternative.push(`*:contains("${context.expectedText}")`)
            }

            if (context?.elementType) {
                alternative.push(`${context.elementType}[role="${this.inferRoleFromElementType(context.elementType)}"]`)
            }

            // Generate recommendations
            recommendations.push('Add data-testid attribute for reliable selection')
            recommendations.push('Use semantic HTML elements with proper roles')
            recommendations.push('Ensure elements are present in DOM before validation')

            if (!selector.includes('data-testid')) {
                recommendations.push('Consider using data-testid instead of class or ID selectors')
            }

            if (context?.expectedText) {
                recommendations.push('Add aria-label for better accessibility and selection')
            }

        } catch (error) {
            console.warn('Error creating fallback strategies:', error)
            recommendations.push('Review selector syntax and element structure')
        }

        return {
            immediate,
            delayed,
            alternative,
            recommendations
        }
    }

    /**
     * Infer ARIA role from element type
     */
    private static inferRoleFromElementType(elementType: string): string {
        const roleMap: Record<string, string> = {
            'button': 'button',
            'a': 'link',
            'input': 'textbox',
            'select': 'combobox',
            'textarea': 'textbox',
            'nav': 'navigation',
            'main': 'main',
            'header': 'banner',
            'footer': 'contentinfo',
            'aside': 'complementary',
            'section': 'region',
            'article': 'article',
            'dialog': 'dialog',
            'menu': 'menu',
            'menuitem': 'menuitem',
            'tab': 'tab',
            'tabpanel': 'tabpanel',
            'list': 'list',
            'listitem': 'listitem'
        }

        return roleMap[elementType.toLowerCase()] || 'generic'
    }

    /**
     * Validate tour step elements before starting tour
     * Enhanced with comprehensive error handling, performance monitoring, and fallback strategies
     */
    static async validateTourSteps(steps: Array<{ element: string }>): Promise<{
        valid: boolean
        results: ElementValidationResult[]
        missingElements: string[]
        errors: string[]
        performance: {
            totalTime: number
            averageTimePerStep: number
            slowSteps: Array<{ index: number; selector: string; time: number }>
        }
        recommendations: string[]
        fallbackStrategies: Record<string, ReturnType<typeof TourElementValidator.createFallbackStrategies>>
    }> {
        // Input validation
        if (!Array.isArray(steps)) {
            return {
                valid: false,
                results: [],
                missingElements: [],
                errors: ['Invalid steps array provided'],
                performance: {
                    totalTime: 0,
                    averageTimePerStep: 0,
                    slowSteps: []
                },
                recommendations: ['Provide a valid array of tour steps'],
                fallbackStrategies: {}
            }
        }

        const results: ElementValidationResult[] = []
        const missingElements: string[] = []
        const errors: string[] = []

        // Validate each step with comprehensive error handling
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i]

            try {
                // Validate step structure
                if (!step || typeof step !== 'object' || !step.element || typeof step.element !== 'string') {
                    const error = `Step ${i + 1}: Invalid step structure or missing element selector`
                    errors.push(error)
                    results.push({
                        element: null,
                        selector: step?.element || '',
                        found: false,
                        error,
                        validationMethod: 'hybrid',
                        performance: { searchTime: 0, fallbacksAttempted: 0 }
                    })
                    missingElements.push(step?.element || `step-${i + 1}`)
                    continue
                }

                try {
                    const selectors = this.generateFallbackSelectors(step.element)
                    const result = await this.findElement(selectors, 1000) // Shorter timeout for validation

                    results.push(result)

                    if (!result.found) {
                        missingElements.push(step.element)
                        if (result.error) {
                            errors.push(`Step ${i + 1} (${step.element}): ${result.error}`)
                        }
                    }
                } catch (findError) {
                    const errorMessage = findError instanceof Error ? findError.message : String(findError)
                    const error = `Step ${i + 1} (${step.element}): ${errorMessage}`
                    errors.push(error)

                    results.push({
                        element: null,
                        selector: step.element,
                        found: false,
                        error,
                        validationMethod: 'hybrid',
                        performance: { searchTime: 0, fallbacksAttempted: 0 }
                    })
                    missingElements.push(step.element)
                }
            } catch (stepError) {
                const errorMessage = stepError instanceof Error ? stepError.message : String(stepError)
                const error = `Step ${i + 1}: Unexpected error - ${errorMessage}`
                errors.push(error)

                results.push({
                    element: null,
                    selector: step?.element || '',
                    found: false,
                    error,
                    validationMethod: 'hybrid',
                    performance: { searchTime: 0, fallbacksAttempted: 0 }
                })
                missingElements.push(step?.element || `step-${i + 1}`)
            }
        }

        // Calculate performance metrics
        const totalTime = results.reduce((sum, result) => sum + (result.performance?.searchTime || 0), 0)
        const averageTimePerStep = results.length > 0 ? totalTime / results.length : 0
        const slowSteps = results
            .map((result, index) => ({
                index: index + 1,
                selector: result.selector,
                time: result.performance?.searchTime || 0
            }))
            .filter(step => step.time > 1000) // Steps taking more than 1 second

        return {
            valid: missingElements.length === 0 && errors.length === 0,
            results,
            missingElements,
            errors,
            performance: {
                totalTime,
                averageTimePerStep,
                slowSteps
            },
            recommendations: [
                ...(missingElements.length > 0 ? ['Add missing elements to the DOM or update selectors'] : []),
                ...(errors.length > 0 ? ['Fix validation errors before starting tour'] : []),
                ...(slowSteps.length > 0 ? ['Optimize slow selectors for better performance'] : []),
                'Use data-testid attributes for more reliable element selection',
                'Ensure all tour elements are accessible and visible'
            ],
            fallbackStrategies: results.reduce((acc, result, index) => {
                if (result.fallbackStrategies) {
                    acc[`step-${index + 1}`] = this.createFallbackStrategies(result.selector)
                }
                return acc
            }, {} as Record<string, ReturnType<typeof TourElementValidator.createFallbackStrategies>>)
        }
    }

    /**
     * Create element observer for dynamic content with proper cleanup
     * Enhanced with comprehensive error handling and race condition prevention
     */
    static createElementObserver(
        selector: string,
        callback: (element: HTMLElement) => void,
        options: {
            timeout?: number
            once?: boolean
        } = {}
    ): () => void {
        // Input validation with detailed error handling
        if (!EnvironmentDetector.isBrowser()) {
            console.warn('createElementObserver called in non-browser environment')
            return () => { } // Return no-op cleanup function
        }

        if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
            console.warn('Invalid selector provided to createElementObserver')
            return () => { }
        }

        if (typeof callback !== 'function') {
            console.warn('Invalid callback provided to createElementObserver')
            return () => { }
        }

        // Validate and sanitize options
        const { timeout = 10000, once = true } = options
        const validatedTimeout = typeof timeout === 'number' && timeout >= 0 && isFinite(timeout) ? timeout : 10000
        const validatedOnce = typeof once === 'boolean' ? once : true

        // State management with enhanced tracking
        let timeoutId: TimeoutId | null = null
        let observer: MutationObserver | null = null
        let isCleanedUp = false
        let callbackExecuted = false
        let cleanupCallCount = 0
        let observerId: string | null = null

        // Enhanced cleanup with comprehensive resource management and race condition prevention
        const cleanup = () => {
            cleanupCallCount++

            // Prevent multiple cleanup calls but log if it happens frequently
            if (isCleanedUp) {
                if (cleanupCallCount > 5) {
                    console.warn(`Excessive cleanup calls (${cleanupCallCount}) for selector: ${selector}`)
                }
                return
            }

            isCleanedUp = true

            // Use observer manager for proper cleanup if registered
            if (observerId) {
                ObserverManager.unregisterObserver(observerId)
                observerId = null
                return
            }

            // Fallback cleanup for unregistered observers
            // Clear timeout with error handling
            if (timeoutId) {
                try {
                    clearTimeout(timeoutId)
                } catch (error) {
                    console.warn('Error clearing timeout in element observer:', error)
                }
                timeoutId = null
            }

            // Disconnect observer with error handling
            if (observer) {
                try {
                    observer.disconnect()
                } catch (error) {
                    console.warn('Error disconnecting mutation observer:', error)
                }
                observer = null
            }
        }

        // Enhanced element finding with comprehensive error handling
        const findAndCallback = (): boolean => {
            if (isCleanedUp) return false

            try {
                let element: HTMLElement | null = null

                // Validate DOM availability
                if (!document || typeof document.querySelector !== 'function') {
                    console.warn('DOM not available in findAndCallback')
                    return false
                }

                // Try CSS selector first, then JavaScript fallback
                if (SelectorSupport.isValidSelector(selector)) {
                    try {
                        const foundElement = document.querySelector(selector)
                        element = DOMTypeGuards.isValidElement(foundElement) ? foundElement : null
                    } catch (selectorError) {
                        console.warn(`CSS selector error in observer for "${selector}":`, selectorError)
                        // Fall back to JavaScript implementation
                        try {
                            element = this.findElementWithJavaScriptFallback(selector)
                        } catch (fallbackError) {
                            console.warn(`JavaScript fallback error in observer for "${selector}":`, fallbackError)
                            element = null
                        }
                    }
                } else {
                    try {
                        element = this.findElementWithJavaScriptFallback(selector)
                    } catch (fallbackError) {
                        console.warn(`JavaScript fallback error in observer for "${selector}":`, fallbackError)
                        element = null
                    }
                }

                // Check element and visibility (with enhanced shadow DOM support)
                if (element) {
                    try {
                        // Use enhanced visibility check that includes shadow DOM support
                        const isVisible = this.isElementVisibleInShadowDOM(element)
                        if (isVisible) {
                            // Prevent multiple callback executions for 'once' mode
                            if (validatedOnce && callbackExecuted) {
                                return true
                            }

                            callbackExecuted = true

                            // Execute callback with error handling
                            try {
                                callback(element)
                            } catch (callbackError) {
                                console.warn('Error in element observer callback:', callbackError)
                                // Don't return false here - the element was found successfully
                            }

                            if (validatedOnce) {
                                // Use setTimeout to ensure cleanup happens after callback completes
                                setTimeout(() => cleanup(), 0)
                            }
                            return true
                        }
                    } catch (visibilityError) {
                        console.warn('Error checking enhanced element visibility in observer:', visibilityError)
                        // Fallback to basic visibility check
                        try {
                            if (this.isElementVisible(element)) {
                                // Prevent multiple callback executions for 'once' mode
                                if (validatedOnce && callbackExecuted) {
                                    return true
                                }

                                callbackExecuted = true

                                // Execute callback with error handling
                                try {
                                    callback(element)
                                } catch (callbackError) {
                                    console.warn('Error in element observer callback:', callbackError)
                                    // Don't return false here - the element was found successfully
                                }

                                if (validatedOnce) {
                                    // Use setTimeout to ensure cleanup happens after callback completes
                                    setTimeout(() => cleanup(), 0)
                                }
                                return true
                            }
                        } catch (fallbackError) {
                            console.warn('Fallback visibility check also failed in observer:', fallbackError)
                            return false
                        }
                    }
                }
                return false
            } catch (error) {
                console.warn('Unexpected error in findAndCallback:', error)
                return false
            }
        }

        try {
            // Check if element already exists
            if (findAndCallback()) {
                return cleanup
            }

            // Set up mutation observer with enhanced error handling and proper state management
            if (typeof MutationObserver !== 'undefined') {
                try {
                    // Validate document.body availability
                    if (!document?.body) {
                        console.warn('document.body not available for mutation observer')
                        // Try to wait for DOM ready
                        if (document?.readyState === 'loading') {
                            const domReadyHandler = () => {
                                document.removeEventListener('DOMContentLoaded', domReadyHandler)
                                if (!isCleanedUp && document.body) {
                                    try {
                                        observer = new MutationObserver(() => {
                                            if (!isCleanedUp) {
                                                try {
                                                    findAndCallback()
                                                } catch (error) {
                                                    console.warn('Error in delayed mutation observer callback:', error)
                                                }
                                            }
                                        })

                                        observer.observe(document.body, {
                                            childList: true,
                                            subtree: true,
                                            attributes: true,
                                            attributeFilter: ['class', 'style', 'hidden']
                                        })

                                        // Register with observer manager after successful creation
                                        observerId = ObserverManager.registerObserver(
                                            selector,
                                            observer,
                                            timeoutId,
                                            cleanup
                                        )
                                    } catch (observerError) {
                                        console.warn('Error setting up delayed mutation observer:', observerError)
                                        cleanup()
                                    }
                                }
                            }
                            document.addEventListener('DOMContentLoaded', domReadyHandler)
                        }
                    } else {
                        observer = new MutationObserver(() => {
                            if (!isCleanedUp) {
                                try {
                                    findAndCallback()
                                } catch (error) {
                                    console.warn('Error in mutation observer callback:', error)
                                }
                            }
                        })

                        observer.observe(document.body, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: ['class', 'style', 'hidden']
                        })

                        // Set timeout with enhanced error handling
                        if (validatedTimeout > 0) {
                            try {
                                timeoutId = setTimeout(() => {
                                    if (!isCleanedUp) {
                                        console.warn(`Element observer timeout (${validatedTimeout}ms) for selector: ${selector}`)
                                        cleanup()
                                    }
                                }, validatedTimeout)
                            } catch (timeoutError) {
                                console.warn('Error setting up observer timeout:', timeoutError)
                            }
                        }

                        // Register with observer manager after successful creation
                        observerId = ObserverManager.registerObserver(
                            selector,
                            observer,
                            timeoutId,
                            cleanup
                        )
                    }
                } catch (observerError) {
                    console.warn('Error setting up mutation observer:', observerError)
                    observer = null
                    cleanup()
                }
            } else {
                console.warn('MutationObserver not available')
                cleanup()
            }

        } catch (error) {
            console.warn('Error setting up element observer:', error)
            cleanup()
        }

        return cleanup
    }

    /**
     * Verify observer cleanup and get statistics
     */
    static verifyObserverCleanup(): {
        activeObservers: number
        oldestObserverAge: number
        averageObserverAge: number
        memoryLeakRisk: boolean
    } {
        const stats = ObserverManager.getStatistics()

        return {
            activeObservers: stats.activeCount,
            oldestObserverAge: stats.oldestAge,
            averageObserverAge: stats.averageAge,
            memoryLeakRisk: stats.activeCount > 20 || stats.oldestAge > 600000 // 10 minutes
        }
    }

    /**
     * Force cleanup of all observers (for testing or emergency situations)
     */
    static forceCleanupAllObservers(): void {
        ObserverManager.cleanupAll()
    }

    /**
     * Perform emergency cleanup of stale observers
     */
    static performEmergencyCleanup(): void {
        ObserverManager.performEmergencyCleanup()
    }

    /**
     * Enhanced element validation with comprehensive error reporting
     * Validates element state, accessibility, and provides detailed feedback
     */
    static validateElementComprehensively(
        element: HTMLElement | null,
        selector: string,
        context: Record<string, any> = {}
    ): {
        isValid: boolean
        issues: string[]
        recommendations: string[]
        errorDetails?: ElementValidationResult['errorDetails']
        accessibilityScore: number
    } {
        const issues: string[] = []
        const recommendations: string[] = []
        let accessibilityScore = 100 // Start with perfect score

        try {
            // Basic element validation
            if (!element) {
                return {
                    isValid: false,
                    issues: ['Element not found'],
                    recommendations: [
                        'Check if element exists in DOM',
                        'Verify selector syntax',
                        'Wait for dynamic content to load'
                    ],
                    errorDetails: ValidationErrorReporter.createErrorDetails(
                        'SELECTOR_NOT_FOUND',
                        'Element not found',
                        { selector, ...context }
                    ),
                    accessibilityScore: 0
                }
            }

            if (!DOMTypeGuards.isValidElement(element)) {
                return {
                    isValid: false,
                    issues: ['Invalid element type'],
                    recommendations: [
                        'Ensure element is a valid HTMLElement',
                        'Check element creation process'
                    ],
                    errorDetails: ValidationErrorReporter.createErrorDetails(
                        'DOM_NOT_READY',
                        'Invalid element type',
                        { selector, elementType: typeof element, ...context }
                    ),
                    accessibilityScore: 0
                }
            }

            // Visibility validation
            if (!this.isElementVisible(element)) {
                issues.push('Element is not visible')
                recommendations.push('Check CSS display, visibility, and opacity properties')
                recommendations.push('Verify element is not hidden by parent containers')
                accessibilityScore -= 30
            }

            // Position validation
            const rect = element.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) {
                issues.push('Element has zero dimensions')
                recommendations.push('Check CSS width and height properties')
                accessibilityScore -= 20
            }

            // Viewport validation
            const isInViewport = this.isElementInViewport(element)
            if (!isInViewport) {
                issues.push('Element is outside viewport')
                recommendations.push('Scroll element into view')
                recommendations.push('Check element positioning')
                accessibilityScore -= 15
            }

            // Accessibility validation
            const accessibilityIssues = this.checkElementAccessibility(element)
            if (accessibilityIssues.length > 0) {
                issues.push(...accessibilityIssues)
                recommendations.push('Fix accessibility issues for better user experience')
                accessibilityScore -= accessibilityIssues.length * 10
            }

            // Interactivity validation
            const interactivityIssues = this.checkElementInteractivity(element)
            if (interactivityIssues.length > 0) {
                issues.push(...interactivityIssues)
                recommendations.push('Ensure element is interactive and not disabled')
                accessibilityScore -= interactivityIssues.length * 15
            }

            // Performance validation
            const performanceIssues = this.checkElementPerformance(element, selector)
            if (performanceIssues.length > 0) {
                issues.push(...performanceIssues)
                recommendations.push('Optimize selector for better performance')
                accessibilityScore -= performanceIssues.length * 5
            }

            // Ensure score doesn't go below 0
            accessibilityScore = Math.max(0, accessibilityScore)

            const isValid = issues.length === 0
            let errorDetails: ElementValidationResult['errorDetails'] | undefined

            if (!isValid) {
                const primaryIssue = issues[0]
                let errorCode: keyof typeof ValidationErrorReporter.ERROR_CODES = 'ELEMENT_NOT_ACCESSIBLE'

                if (primaryIssue.includes('not visible')) {
                    errorCode = 'ELEMENT_NOT_VISIBLE'
                } else if (primaryIssue.includes('not found')) {
                    errorCode = 'SELECTOR_NOT_FOUND'
                } else if (primaryIssue.includes('disabled') || primaryIssue.includes('readonly')) {
                    errorCode = 'ELEMENT_NOT_ACCESSIBLE'
                }

                errorDetails = ValidationErrorReporter.createErrorDetails(
                    errorCode,
                    issues.join('; '),
                    {
                        selector,
                        issues,
                        accessibilityScore,
                        elementInfo: this.getElementInfo(element),
                        ...context
                    }
                )
            }

            return {
                isValid,
                issues,
                recommendations,
                errorDetails,
                accessibilityScore
            }

        } catch (error) {
            console.warn('Error during comprehensive element validation:', error)
            return {
                isValid: false,
                issues: ['Validation error occurred'],
                recommendations: ['Check element and try again'],
                errorDetails: ValidationErrorReporter.createErrorDetails(
                    'DOM_NOT_READY',
                    `Validation error: ${error instanceof Error ? error.message : String(error)}`,
                    { selector, error: String(error), ...context }
                ),
                accessibilityScore: 0
            }
        }
    }

    /**
     * Check element interactivity issues
     */
    private static checkElementInteractivity(element: HTMLElement): string[] {
        const issues: string[] = []

        try {
            // Check if element is disabled
            if (element.hasAttribute('disabled') || (element as any).disabled === true) {
                issues.push('Element is disabled')
            }

            // Check if element is readonly
            if (element.hasAttribute('readonly') || (element as any).readOnly === true) {
                issues.push('Element is readonly')
            }

            // Check pointer events
            const style = window.getComputedStyle(element)
            if (style.pointerEvents === 'none') {
                issues.push('Element has pointer-events: none')
            }

            // Check if element is focusable
            const tabIndex = element.getAttribute('tabindex')
            if (tabIndex === '-1') {
                issues.push('Element is not focusable (tabindex=-1)')
            }

            // Check if element is covered by other elements
            if (!this.isElementAccessible(element)) {
                issues.push('Element is covered by other elements')
            }

            // Check for form validation issues
            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                if (!element.checkValidity()) {
                    issues.push('Form element has validation errors')
                }
            }

        } catch (error) {
            console.warn('Error checking element interactivity:', error)
            issues.push('Error checking interactivity')
        }

        return issues
    }

    /**
     * Check element performance issues
     */
    private static checkElementPerformance(element: HTMLElement, selector: string): string[] {
        const issues: string[] = []

        try {
            // Check selector complexity
            const selectorComplexity = this.calculateSelectorComplexity(selector)
            if (selectorComplexity > 10) {
                issues.push('Selector is overly complex')
            }

            // Check if element has many siblings (affects querySelector performance)
            const parent = element.parentElement
            if (parent && parent.children.length > 1000) {
                issues.push('Element has many siblings, affecting performance')
            }

            // Check DOM depth
            const domDepth = this.calculateDOMDepth(element)
            if (domDepth > 20) {
                issues.push('Element is deeply nested in DOM')
            }

            // Check for performance metrics
            const metrics = PerformanceMonitor.getMetrics(selector)
            if (metrics) {
                if (metrics.averageTime > 1000) {
                    issues.push('Selector has slow average search time')
                }
                if (metrics.failedSearches > metrics.successfulSearches) {
                    issues.push('Selector has high failure rate')
                }
            }

        } catch (error) {
            console.warn('Error checking element performance:', error)
            issues.push('Error checking performance')
        }

        return issues
    }

    /**
     * Calculate selector complexity score
     */
    private static calculateSelectorComplexity(selector: string): number {
        if (!selector || typeof selector !== 'string') {
            return 0
        }

        let complexity = 0

        // Count different selector types
        complexity += (selector.match(/\./g) || []).length // Classes
        complexity += (selector.match(/#/g) || []).length // IDs
        complexity += (selector.match(/\[/g) || []).length * 2 // Attributes (more expensive)
        complexity += (selector.match(/:/g) || []).length * 3 // Pseudo-selectors (most expensive)
        complexity += (selector.match(/>/g) || []).length // Direct children
        complexity += (selector.match(/\+/g) || []).length // Adjacent siblings
        complexity += (selector.match(/~/g) || []).length // General siblings

        return complexity
    }

    /**
     * Calculate DOM depth of element
     */
    private static calculateDOMDepth(element: HTMLElement): number {
        let depth = 0
        let current = element.parentElement

        while (current && current !== document.body && depth < 50) {
            depth++
            current = current.parentElement
        }

        return depth
    }

    /**
     * Get comprehensive element information for debugging
     */
    private static getElementInfo(element: HTMLElement): Record<string, any> {
        try {
            const rect = element.getBoundingClientRect()
            const style = window.getComputedStyle(element)

            return {
                tagName: element.tagName.toLowerCase(),
                id: element.id || null,
                className: element.className || null,
                textContent: element.textContent?.trim().substring(0, 100) || null,
                attributes: Array.from(element.attributes).reduce((acc, attr) => {
                    acc[attr.name] = attr.value
                    return acc
                }, {} as Record<string, string>),
                position: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom
                },
                style: {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    pointerEvents: style.pointerEvents,
                    position: style.position,
                    zIndex: style.zIndex
                },
                isVisible: this.isElementVisible(element),
                isAccessible: this.isElementAccessible(element),
                isInViewport: this.isElementInViewport(element)
            }
        } catch (error) {
            console.warn('Error getting element info:', error)
            return { error: 'Could not get element info' }
        }
    }

    /**
     * Enhanced fallback strategy execution with comprehensive error handling
     */
    static async executeWithFallbackStrategies(
        primarySelector: string,
        options: {
            timeout?: number
            maxRetries?: number
            retryDelay?: number
            generateFallbacks?: boolean
            validateAccessibility?: boolean
        } = {}
    ): Promise<ElementValidationResult> {
        const {
            timeout = this.WAIT_TIMEOUT,
            maxRetries = 3,
            retryDelay = 500,
            generateFallbacks = true,
            validateAccessibility = true
        } = options

        const startTime = performance.now()
        let lastError: string | undefined
        const attemptedStrategies: string[] = []
        const failedStrategies: string[] = []
        const allRecommendations: string[] = []

        try {
            // Input validation
            if (!primarySelector || typeof primarySelector !== 'string' || primarySelector.trim().length === 0) {
                const errorDetails = ValidationErrorReporter.createErrorDetails(
                    'SELECTOR_INVALID',
                    'Invalid primary selector provided',
                    { primarySelector, options }
                )

                return {
                    element: null,
                    selector: primarySelector || '',
                    found: false,
                    error: ValidationErrorReporter.createMeaningfulErrorMessage('SELECTOR_INVALID', primarySelector || ''),
                    validationMethod: 'hybrid',
                    performance: { searchTime: 0, fallbacksAttempted: 0 },
                    errorDetails,
                    fallbackStrategies: {
                        attempted: [],
                        failed: [],
                        recommendations: ['Provide a valid CSS selector string']
                    }
                }
            }

            // Generate comprehensive fallback strategies
            let selectors = [primarySelector]
            if (generateFallbacks) {
                const fallbackStrategies = FallbackStrategyManager.generateFallbackStrategies(primarySelector)
                selectors = [primarySelector, ...fallbackStrategies.attempted]
                allRecommendations.push(...fallbackStrategies.recommendations)
            }

            // Execute with retries
            for (let retry = 0; retry <= maxRetries; retry++) {
                if (retry > 0) {
                    // Add delay between retries
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                }

                // Try primary selector and fallbacks
                const result = await this.findElement(selectors, timeout)

                if (result.found && result.element) {
                    // Validate accessibility if requested
                    if (validateAccessibility) {
                        const validation = this.validateElementComprehensively(
                            result.element,
                            result.selector,
                            { retry, totalRetries: maxRetries }
                        )

                        // Add validation results to the response
                        result.fallbackStrategies = {
                            attempted: result.fallbackStrategies?.attempted || [],
                            failed: result.fallbackStrategies?.failed || [],
                            successful: result.fallbackStrategies?.successful,
                            recommendations: [
                                ...allRecommendations,
                                ...validation.recommendations
                            ]
                        }

                        // Add accessibility warnings if issues found
                        if (!validation.isValid) {
                            result.errorDetails = validation.errorDetails
                            result.error = `Element found but has issues: ${validation.issues.join(', ')}`
                        }
                    }

                    // Record successful execution
                    const totalTime = performance.now() - startTime
                    PerformanceMonitor.recordSearch(primarySelector, totalTime, true, retry > 0)

                    return {
                        ...result,
                        performance: {
                            searchTime: totalTime,
                            fallbacksAttempted: result.performance?.fallbacksAttempted || 0
                        }
                    }
                }

                // Record failed attempt
                lastError = result.error
                attemptedStrategies.push(...(result.fallbackStrategies?.attempted || []))
                failedStrategies.push(...(result.fallbackStrategies?.failed || []))
            }

            // All retries failed
            const totalTime = performance.now() - startTime
            PerformanceMonitor.recordSearch(primarySelector, totalTime, false, true)

            const errorDetails = ValidationErrorReporter.createErrorDetails(
                'SELECTOR_NOT_FOUND',
                `All fallback strategies failed after ${maxRetries + 1} attempts`,
                {
                    primarySelector,
                    maxRetries,
                    totalTime,
                    lastError,
                    attemptedStrategies: [...new Set(attemptedStrategies)],
                    failedStrategies: [...new Set(failedStrategies)]
                }
            )

            return {
                element: null,
                selector: primarySelector,
                found: false,
                error: ValidationErrorReporter.createMeaningfulErrorMessage(
                    'SELECTOR_NOT_FOUND',
                    primarySelector,
                    { attempts: maxRetries + 1, searchTime: totalTime }
                ),
                validationMethod: 'hybrid',
                performance: {
                    searchTime: totalTime,
                    fallbacksAttempted: attemptedStrategies.length
                },
                errorDetails,
                fallbackStrategies: {
                    attempted: [...new Set(attemptedStrategies)],
                    failed: [...new Set(failedStrategies)],
                    recommendations: [
                        ...allRecommendations,
                        'Consider adding data-testid attributes to target elements',
                        'Verify element exists and is not dynamically loaded',
                        'Check if element requires user interaction to appear',
                        'Increase timeout for slow-loading content'
                    ]
                }
            }

        } catch (error) {
            const totalTime = performance.now() - startTime
            const errorMessage = error instanceof Error ? error.message : String(error)

            PerformanceMonitor.recordSearch(primarySelector, totalTime, false, true)

            const errorDetails = ValidationErrorReporter.createErrorDetails(
                'DOM_NOT_READY',
                `Execution error: ${errorMessage}`,
                {
                    primarySelector,
                    error: errorMessage,
                    totalTime,
                    options
                }
            )

            return {
                element: null,
                selector: primarySelector,
                found: false,
                error: ValidationErrorReporter.createMeaningfulErrorMessage('DOM_NOT_READY', primarySelector),
                validationMethod: 'hybrid',
                performance: {
                    searchTime: totalTime,
                    fallbacksAttempted: 0
                },
                errorDetails,
                fallbackStrategies: {
                    attempted: [],
                    failed: [primarySelector],
                    recommendations: [
                        'Check browser console for detailed error information',
                        'Ensure DOM is ready before element validation',
                        'Verify JavaScript execution environment'
                    ]
                }
            }
        }
    }

    /**
     * Get comprehensive performance and validation report
     */
    static getValidationReport(): {
        performanceStats: ReturnType<typeof PerformanceMonitor.getOverallStats>
        observerStats: ReturnType<typeof ObserverManager.getStatistics>
        recommendations: string[]
        healthScore: number
    } {
        try {
            const performanceStats = PerformanceMonitor.getOverallStats()
            const observerStats = ObserverManager.getStatistics()
            const recommendations: string[] = []

            // Calculate health score based on various metrics
            let healthScore = 100

            // Performance-based deductions
            if (performanceStats.averageSearchTime > 1000) {
                healthScore -= 20
                recommendations.push('Optimize selectors to reduce average search time')
            }

            if (performanceStats.successRate < 80) {
                healthScore -= 25
                recommendations.push('Improve selector reliability to increase success rate')
            }

            if (performanceStats.slowSearchPercentage > 20) {
                healthScore -= 15
                recommendations.push('Reduce number of slow searches by optimizing complex selectors')
            }

            // Observer-based deductions
            if (observerStats.activeCount > 10) {
                healthScore -= 10
                recommendations.push('High number of active observers may indicate memory leaks')
            }

            if (observerStats.oldestAge > 300000) { // 5 minutes
                healthScore -= 15
                recommendations.push('Long-running observers detected, check cleanup logic')
            }

            // Fallback usage analysis
            if (performanceStats.fallbackUsageRate > 50) {
                healthScore -= 10
                recommendations.push('High fallback usage suggests primary selectors need improvement')
            }

            // General recommendations based on performance grade
            switch (performanceStats.performanceGrade) {
                case 'F':
                    recommendations.push('Critical performance issues detected - immediate attention required')
                    break
                case 'D':
                    recommendations.push('Poor performance - review selector strategies and timeout settings')
                    break
                case 'C':
                    recommendations.push('Average performance - consider optimizing frequently used selectors')
                    break
                case 'B':
                    recommendations.push('Good performance - minor optimizations possible')
                    break
                case 'A':
                    recommendations.push('Excellent performance - maintain current practices')
                    break
            }

            // Ensure health score doesn't go below 0
            healthScore = Math.max(0, healthScore)

            return {
                performanceStats,
                observerStats,
                recommendations,
                healthScore
            }

        } catch (error) {
            console.warn('Error generating validation report:', error)
            return {
                performanceStats: {
                    totalSelectors: 0,
                    averageSearchTime: 0,
                    slowSearchPercentage: 0,
                    successRate: 0,
                    fallbackUsageRate: 0,
                    performanceGrade: 'F' as const
                },
                observerStats: {
                    activeCount: 0,
                    oldestAge: 0,
                    averageAge: 0
                },
                recommendations: ['Error generating report - check system health'],
                healthScore: 0
            }
        }
    }
}

/**
 * Export ObserverManager for testing and monitoring
 */
export { ObserverManager }

/**
 * Enhanced element finder with retry logic and comprehensive error handling
 */
export async function findTourElement(
    selector: string | string[],
    options: {
        timeout?: number
        retries?: number
        retryDelay?: number
    } = {}
): Promise<HTMLElement | null> {
    // Environment validation
    if (!EnvironmentDetector.isBrowser()) {
        console.warn('findTourElement called in non-browser environment')
        return null
    }

    // Input validation
    if (!selector) {
        console.warn('No selector provided to findTourElement')
        return null
    }

    const { timeout = 5000, retries = 3, retryDelay = 1000 } = options

    // Validate and sanitize input parameters
    const validatedTimeout = typeof timeout === 'number' && timeout >= 0 && isFinite(timeout) ? timeout : 5000
    const validatedRetries = typeof retries === 'number' && retries >= 0 && isFinite(retries) ? Math.floor(retries) : 3
    const validatedRetryDelay = typeof retryDelay === 'number' && retryDelay >= 0 && isFinite(retryDelay) ? retryDelay : 1000

    if (validatedTimeout !== timeout || validatedRetries !== retries || validatedRetryDelay !== retryDelay) {
        console.warn('Invalid parameters provided to findTourElement, using sanitized values')
    }

    const errors: string[] = []

    // Retry loop with comprehensive error handling
    for (let attempt = 0; attempt <= validatedRetries; attempt++) {
        try {
            const result = await TourElementValidator.findElement(selector, validatedTimeout)

            if (result?.found && DOMTypeGuards.isValidElement(result.element)) {
                return result.element
            }

            // Log the specific error for this attempt
            if (result?.error) {
                errors.push(`Attempt ${attempt + 1}: ${result.error}`)
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            errors.push(`Attempt ${attempt + 1}: ${errorMessage}`)
            console.warn(`Element search attempt ${attempt + 1} failed:`, error)
        }

        // Wait before retry (except on last attempt)
        if (attempt < validatedRetries) {
            try {
                await new Promise<void>((resolve, reject) => {
                    let timeoutId: TimeoutId | null = null
                    let isResolved = false

                    const safeResolve = () => {
                        if (isResolved) return
                        isResolved = true
                        if (timeoutId) {
                            try {
                                clearTimeout(timeoutId)
                            } catch (clearError) {
                                console.warn('Error clearing retry delay timeout:', clearError)
                            }
                        }
                        resolve()
                    }

                    const safeReject = (error: Error) => {
                        if (isResolved) return
                        isResolved = true
                        if (timeoutId) {
                            try {
                                clearTimeout(timeoutId)
                            } catch (clearError) {
                                console.warn('Error clearing retry delay timeout:', clearError)
                            }
                        }
                        reject(error)
                    }

                    try {
                        timeoutId = setTimeout(safeResolve, validatedRetryDelay)

                        // Safety check for timeout creation
                        if (!timeoutId) {
                            safeReject(new Error('Failed to create retry delay timeout'))
                        }
                    } catch (timeoutError) {
                        const errorMessage = timeoutError instanceof Error ? timeoutError.message : String(timeoutError)
                        safeReject(new Error(`Timeout creation error: ${errorMessage}`))
                    }
                })
            } catch (delayError) {
                console.warn(`Error during retry delay for attempt ${attempt + 1}:`, delayError)
                // Continue with next attempt even if delay fails
            }
        }
    }

    // Log all accumulated errors
    if (errors.length > 0) {
        console.warn(`findTourElement failed after ${validatedRetries + 1} attempts:`, errors.join('; '))
    }

    return null
}

/**
 * Smart selector builder for common UI patterns with valid CSS selectors
 * Enhanced with browser compatibility checks and proper CSS escaping
 */
export class SmartSelectorBuilder {
    /**
     * Generate selectors for navigation elements
     * Fixed to avoid :contains() and :has() pseudo-selectors
     */
    static forNavigation(text: string): string[] {
        if (!text || typeof text !== 'string') {
            return []
        }

        const sanitizedText = this.sanitizeForAttribute(text)
        const testId = this.sanitizeForTestId(text)

        const selectors: string[] = []

        // Add test ID selector if valid
        if (testId) {
            selectors.push(`[data-testid="${testId}"]`)
        }

        // Add navigation-specific selectors with proper escaping
        if (sanitizedText) {
            selectors.push(
                `nav a[href*="${sanitizedText.toLowerCase()}"]`,
                `nav [aria-label*="${sanitizedText}"]`,
                `[role="navigation"] a[href*="${sanitizedText.toLowerCase()}"]`,
                `[aria-label*="${sanitizedText}"]`
            )
        }

        return this.validateSelectors(selectors)
    }

    /**
     * Generate selectors for button elements
     * Fixed to avoid :contains() pseudo-selectors
     */
    static forButton(text: string): string[] {
        if (!text || typeof text !== 'string') {
            return []
        }

        const sanitizedText = this.sanitizeForAttribute(text)
        const testId = this.sanitizeForTestId(text)

        const selectors: string[] = []

        // Add test ID selectors if valid
        if (testId) {
            selectors.push(
                `[data-testid="${testId}-button"]`,
                `[data-testid="${testId}"]`
            )
        }

        // Add button-specific selectors with proper escaping
        if (sanitizedText) {
            selectors.push(
                `button[aria-label*="${sanitizedText}"]`,
                `[role="button"][aria-label*="${sanitizedText}"]`,
                `input[type="button"][value*="${sanitizedText}"]`,
                `input[type="submit"][value*="${sanitizedText}"]`
            )
        }

        return this.validateSelectors(selectors)
    }

    /**
     * Generate selectors for form fields
     * Fixed to avoid label:contains() + input patterns
     */
    static forForm(fieldName: string): string[] {
        if (!fieldName || typeof fieldName !== 'string') {
            return []
        }

        const sanitizedFieldName = this.sanitizeForAttribute(fieldName)
        const testId = this.sanitizeForTestId(fieldName)

        const selectors: string[] = []

        // Add test ID selector if valid
        if (testId) {
            selectors.push(`[data-testid="${testId}"]`)
        }

        // Add form-specific selectors with proper escaping
        if (sanitizedFieldName) {
            selectors.push(
                `input[name="${sanitizedFieldName}"]`,
                `input[id="${sanitizedFieldName}"]`,
                `textarea[name="${sanitizedFieldName}"]`,
                `select[name="${sanitizedFieldName}"]`,
                `[aria-label*="${sanitizedFieldName}"]`,
                `[placeholder*="${sanitizedFieldName}"]`
            )
        }

        return this.validateSelectors(selectors)
    }

    /**
     * Generate selectors for content areas
     * Fixed with proper CSS identifier escaping
     */
    static forContent(className: string): string[] {
        if (!className || typeof className !== 'string') {
            return []
        }

        const sanitizedClassName = this.sanitizeForAttribute(className)
        const escapedClassName = this.escapeCSSIdentifier(className)

        const selectors: string[] = []

        // Add test ID selector
        if (sanitizedClassName) {
            selectors.push(`[data-testid="${sanitizedClassName}"]`)
        }

        // Add class-based selectors with proper escaping
        if (escapedClassName) {
            selectors.push(
                `.${escapedClassName}`,
                `[class*="${sanitizedClassName}"]`,
                `div[class*="${sanitizedClassName}"]`,
                `section[class*="${sanitizedClassName}"]`,
                `main[class*="${sanitizedClassName}"]`,
                `article[class*="${sanitizedClassName}"]`
            )
        }

        return this.validateSelectors(selectors)
    }

    /**
     * Find elements by text content using JavaScript (replaces :contains())
     */
    static findByText(text: string, tagName: string = '*'): HTMLElement[] {
        if (tagName === 'button') {
            return JavaScriptElementFinder.findButtonByText(text)
        } else if (tagName === 'a') {
            return JavaScriptElementFinder.findLinkByText(text)
        } else {
            return JavaScriptElementFinder.findByTextContent(tagName, text)
        }
    }

    /**
     * Find form inputs by label text (replaces label:contains() + input)
     */
    static findInputByLabel(labelText: string): HTMLElement[] {
        return JavaScriptElementFinder.findInputByLabelText(labelText)
    }

    /**
     * Generate hybrid selectors that combine CSS and JavaScript approaches
     */
    static generateHybridSelectors(
        text: string,
        elementType: 'button' | 'link' | 'input' | 'navigation'
    ): {
        cssSelectors: string[]
        jsFunction: () => HTMLElement[]
    } {
        let cssSelectors: string[] = []
        let jsFunction: () => HTMLElement[] = () => []

        switch (elementType) {
            case 'button':
                cssSelectors = this.forButton(text)
                jsFunction = () => this.findByText(text, 'button')
                break
            case 'link':
                cssSelectors = this.forNavigation(text)
                jsFunction = () => this.findByText(text, 'a')
                break
            case 'input':
                cssSelectors = this.forForm(text)
                jsFunction = () => this.findInputByLabel(text)
                break
            case 'navigation':
                cssSelectors = this.forNavigation(text)
                jsFunction = () => this.findByText(text, 'nav')
                break
        }

        return { cssSelectors, jsFunction }
    }

    /**
     * Escape CSS identifier (class names, IDs) for use in selectors
     * Uses proper CSS escaping rules for special characters
     */
    private static escapeCSSIdentifier(input: string): string {
        if (!input || typeof input !== 'string') {
            return ''
        }

        try {
            // Use native CSS.escape if available (modern browsers)
            if (typeof CSS !== 'undefined' && CSS.escape) {
                return CSS.escape(input)
            }

            // Manual escaping fallback for special characters in CSS identifiers
            // Escape dots, colons, and other special characters that have meaning in CSS
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, (match) => {
                return '\\' + match
            })
        } catch (error) {
            console.warn('Error escaping CSS identifier:', error)
            // Fallback: replace special characters with safe alternatives
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, '_')
        }
    }

    /**
     * Escape string for use in CSS attribute values
     * Properly escapes quotes and backslashes for attribute selectors
     */
    private static escapeForAttribute(input: string): string {
        if (!input || typeof input !== 'string') {
            return ''
        }

        try {
            // For attribute values, escape quotes and backslashes
            return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'")
        } catch (error) {
            console.warn('Error escaping for attribute:', error)
            return input
        }
    }

    /**
     * Sanitize string for use in attribute values (removes problematic characters)
     */
    private static sanitizeForAttribute(input: string): string {
        if (!input || typeof input !== 'string') {
            return ''
        }

        try {
            // Remove or replace characters that could cause issues in attribute values
            return input.trim().replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ')
        } catch (error) {
            console.warn('Error sanitizing for attribute:', error)
            return input
        }
    }

    /**
     * Sanitize string for use as test ID
     */
    private static sanitizeForTestId(input: string): string | null {
        if (!input || typeof input !== 'string') {
            return null
        }

        try {
            // Remove leading/trailing whitespace
            let sanitized = input.trim()

            // Handle empty string after trimming
            if (sanitized.length === 0) {
                return null
            }

            // Convert to lowercase for consistency
            sanitized = sanitized.toLowerCase()

            // Replace common separators and special characters with hyphens
            sanitized = sanitized.replace(/[\s\/\\._:;,|~`!@#$%^&*()+=\[\]{}'"<>?]/g, '-')

            // Remove multiple consecutive hyphens
            sanitized = sanitized.replace(/-+/g, '-')

            // Remove leading/trailing hyphens
            sanitized = sanitized.replace(/^-+|-+$/g, '')

            // Ensure it starts with a letter or number (valid CSS identifier)
            if (sanitized.length > 0 && !/^[a-zA-Z0-9]/.test(sanitized)) {
                sanitized = 'test-' + sanitized
            }

            // Limit length to reasonable size
            if (sanitized.length > 50) {
                sanitized = sanitized.substring(0, 50).replace(/-+$/, '')
            }

            // Return null if result is empty or too short
            if (sanitized.length < 2) {
                return null
            }

            return sanitized
        } catch (error) {
            console.warn('Error sanitizing for test ID:', error)
            return null
        }
    }

    /**
     * Check if a CSS selector is valid and supported
     */
    private static isValidCSSSelector(selector: string): boolean {
        if (!selector || typeof selector !== 'string') {
            return false
        }
        return SelectorSupport.isValidSelector(selector)
    }

    /**
     * Validate selectors to ensure they are valid CSS and work across browsers
     * Filters out invalid selectors and provides warnings
     */
    private static validateSelectors(selectors: string[]): string[] {
        const validSelectors: string[] = []
        const seenSelectors = new Set<string>()

        selectors.forEach(selector => {
            if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
                return
            }

            const trimmedSelector = selector.trim()

            // Skip duplicates
            if (seenSelectors.has(trimmedSelector)) {
                return
            }

            // Validate selector syntax
            if (this.isValidCSSSelector(trimmedSelector)) {
                validSelectors.push(trimmedSelector)
                seenSelectors.add(trimmedSelector)
            } else {
                console.warn(`Skipping invalid CSS selector: ${trimmedSelector}`)
            }
        })

        return validSelectors
    }




}
/**
 * CSS Selector Validation and Escaping Utilities
 * These utilities fix the selector generation and validation logic
 */
export class SelectorValidationUtils {
    /**
     * Escape special characters in CSS selectors properly
     */
    static escapeCSSSelector(input: string): string {
        if (!input || typeof input !== 'string') {
            return ''
        }

        try {
            // Use native CSS.escape if available
            if (typeof CSS !== 'undefined' && CSS.escape) {
                return CSS.escape(input)
            }

            // Manual escaping for CSS special characters: !"#$%&'()*+,-./:;<=>?@[\]^`{|}~
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, (match) => {
                return '\\' + match
            })
        } catch (error) {
            console.warn('Error escaping CSS selector:', error)
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '_')
        }
    }

    /**
     * Escape CSS identifier (class names, IDs) for use in selectors
     */
    static escapeCSSIdentifier(input: string): string {
        if (!input || typeof input !== 'string') {
            return ''
        }

        try {
            // Use native CSS.escape if available
            if (typeof CSS !== 'undefined' && CSS.escape) {
                return CSS.escape(input)
            }

            // Manual escaping for CSS identifiers
            // Escape characters that have special meaning in CSS selectors
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, (match) => {
                return '\\' + match
            })
        } catch (error) {
            console.warn('Error escaping CSS identifier:', error)
            return input.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, '_')
        }
    }

    /**
     * Escape string for use in CSS attribute values
     */
    static escapeForAttribute(input: string): string {
        if (!input || typeof input !== 'string') {
            return ''
        }

        try {
            // For attribute values, escape quotes and backslashes
            return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'")
        } catch (error) {
            console.warn('Error escaping for attribute:', error)
            return input
        }
    }

    /**
     * Sanitize string for use as test ID with robust edge case handling
     */
    static sanitizeForTestId(input: string): string | null {
        if (!input || typeof input !== 'string') {
            return null
        }

        try {
            // Remove leading/trailing whitespace
            let sanitized = input.trim()

            // Handle empty string after trimming
            if (sanitized.length === 0) {
                return null
            }

            // Convert to lowercase for consistency
            sanitized = sanitized.toLowerCase()

            // Replace common separators and special characters with hyphens
            sanitized = sanitized.replace(/[\s\/\\._:;,|~`!@#$%^&*()+=\[\]{}'"<>?]/g, '-')

            // Remove multiple consecutive hyphens
            sanitized = sanitized.replace(/-+/g, '-')

            // Remove leading/trailing hyphens
            sanitized = sanitized.replace(/^-+|-+$/g, '')

            // Ensure it starts with a letter or number (valid CSS identifier)
            if (sanitized.length > 0 && !/^[a-zA-Z0-9]/.test(sanitized)) {
                sanitized = 'test-' + sanitized
            }

            // Limit length to reasonable size
            if (sanitized.length > 50) {
                sanitized = sanitized.substring(0, 50).replace(/-+$/, '')
            }

            // Return null if result is empty or too short
            if (sanitized.length < 2) {
                return null
            }

            return sanitized
        } catch (error) {
            console.warn('Error sanitizing for test ID:', error)
            return null
        }
    }

    /**
     * Validate CSS selector and provide meaningful error messages
     */
    static validateCSSSelector(selector: string): {
        isValid: boolean
        error?: string
        suggestion?: string
    } {
        if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
            return {
                isValid: false,
                error: 'Selector is empty or invalid',
                suggestion: 'Provide a non-empty string selector'
            }
        }

        try {
            const trimmedSelector = selector.trim()

            // Check for invalid pseudo-selectors
            if (trimmedSelector.includes(':contains(')) {
                return {
                    isValid: false,
                    error: 'Invalid pseudo-selector :contains() - not supported in standard CSS',
                    suggestion: 'Use JavaScript text matching with JavaScriptElementFinder.findByTextContent()'
                }
            }

            if (trimmedSelector.includes(':has(') && !SelectorSupport.hasHasSupport()) {
                return {
                    isValid: false,
                    error: 'Pseudo-selector :has() not supported in this browser',
                    suggestion: 'Use JavaScript fallback with JavaScriptElementFinder.findWithHasSelector()'
                }
            }

            // Use the existing SelectorSupport utility for validation
            if (SelectorSupport.isValidSelector(trimmedSelector)) {
                return { isValid: true }
            } else {
                return {
                    isValid: false,
                    error: 'Invalid CSS selector syntax',
                    suggestion: 'Check selector syntax and escape special characters'
                }
            }
        } catch (error) {
            return {
                isValid: false,
                error: `Selector validation error: ${error instanceof Error ? error.message : String(error)}`,
                suggestion: 'Check selector syntax and try again'
            }
        }
    }

    /**
     * Generate valid fallback selectors with proper escaping
     */
    static generateValidFallbackSelectors(primarySelector: string): string[] {
        // Input validation
        if (!primarySelector || typeof primarySelector !== 'string' || primarySelector.trim().length === 0) {
            return []
        }

        const selectors = [primarySelector]

        try {
            // Add data-testid fallbacks with proper escaping
            if (!primarySelector.includes('data-testid')) {
                const testId = TourElementValidator.extractTestId(primarySelector)
                if (testId) {
                    const escapedTestId = this.escapeCSSSelector(testId)
                    selectors.push(`[data-testid="${escapedTestId}"]`)
                }
            }

            // Add role-based fallbacks with proper validation
            if (primarySelector.includes('button')) {
                selectors.push('button[role="button"]', '[role="button"]')
            }

            if (primarySelector.includes('nav')) {
                selectors.push('nav[role="navigation"]', '[role="navigation"]')
            }

            // Add class-based fallbacks with proper escaping
            const classMatch = primarySelector.match(/\[class\*?=['"]([^'"]+)['"]\]/)
            if (classMatch && classMatch[1]) {
                const escapedClassName = this.escapeCSSSelector(classMatch[1])
                selectors.push(`.${escapedClassName}`)
            }

            // Add ID-based fallbacks with proper escaping
            const idMatch = primarySelector.match(/#([a-zA-Z0-9_-]+)/)
            if (idMatch && idMatch[1]) {
                const escapedId = this.escapeCSSSelector(idMatch[1])
                selectors.push(`#${escapedId}`)
            }

            // Add attribute-based fallbacks for common patterns
            const ariaLabelMatch = primarySelector.match(/\[aria-label\*?=['"]([^'"]+)['"]\]/)
            if (ariaLabelMatch && ariaLabelMatch[1]) {
                const escapedLabel = this.escapeCSSSelector(ariaLabelMatch[1])
                selectors.push(`[aria-label*="${escapedLabel}"]`)
            }

            // Filter out invalid selectors and remove duplicates
            const validSelectors: string[] = []
            selectors.forEach(selector => {
                if (selector &&
                    typeof selector === 'string' &&
                    selector.trim().length > 0 &&
                    !validSelectors.includes(selector)) {

                    const validation = this.validateCSSSelector(selector)
                    if (validation.isValid || this.isKnownPattern(selector)) {
                        validSelectors.push(selector)
                    }
                }
            })

            return validSelectors
        } catch (error) {
            console.warn('Error generating valid fallback selectors:', error)
            // Return at least the primary selector if fallback generation fails
            return [primarySelector]
        }
    }

    /**
     * Check if a selector matches known patterns that should be allowed
     */
    private static isKnownPattern(selector: string): boolean {
        if (!selector || typeof selector !== 'string') {
            return false
        }

        try {
            // Allow selectors that contain :contains() or :has() as they have JavaScript fallbacks
            if (selector.includes(':contains(') || selector.includes(':has(')) {
                return true
            }

            // Allow common attribute selectors
            if (/^\[[\w-]+(\s*[*^$|~]?\s*=\s*['"][^'"]*['"])?\]$/.test(selector)) {
                return true
            }

            // Allow simple class and ID selectors
            if (/^[.#][a-zA-Z][a-zA-Z0-9_-]*$/.test(selector)) {
                return true
            }

            // Allow simple tag selectors
            if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(selector)) {
                return true
            }

            return false
        } catch (error) {
            console.warn('Error checking known pattern:', error)
            return false
        }
    }
}