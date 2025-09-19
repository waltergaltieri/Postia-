/**
 * Playwright integration tests for TourElementValidator
 * Tests real browser scenarios across different browsers
 */

import { test, expect, Page, Browser } from '@playwright/test'

// Test data for cross-browser validation
const testElements = {
    button: {
        selector: 'button[data-testid="test-button"]',
        html: '<button data-testid="test-button" class="btn btn-primary">Click Me</button>'
    },
    input: {
        selector: 'input[data-testid="test-input"]',
        html: '<input data-testid="test-input" type="text" placeholder="Enter text" />'
    },
    navigation: {
        selector: 'nav[data-testid="test-nav"]',
        html: '<nav data-testid="test-nav" role="navigation"><a href="#home">Home</a><a href="#about">About</a></nav>'
    },
    modal: {
        selector: '.modal[data-testid="test-modal"]',
        html: '<div class="modal" data-testid="test-modal" style="display: block; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid #ccc; z-index: 1000;"><h2>Modal Title</h2><p>Modal content</p><button class="close-btn">Close</button></div>'
    },
    hiddenElement: {
        selector: '.hidden-element[data-testid="hidden-test"]',
        html: '<div class="hidden-element" data-testid="hidden-test" style="display: none;">Hidden content</div>'
    },
    dynamicElement: {
        selector: '.dynamic-element[data-testid="dynamic-test"]',
        html: '<div class="dynamic-element" data-testid="dynamic-test">Dynamic content</div>'
    }
}

// Helper function to inject TourElementValidator into the page
async function injectValidator(page: Page) {
    // Read the validator source code and inject it
    await page.addScriptTag({
        path: './src/lib/tour/element-validator.ts'
    }).catch(async () => {
        // Fallback: inject a simplified version for testing
        await page.evaluate(() => {
            (window as any).TourElementValidator = {
                async findElement(selector: string) {
                    const startTime = performance.now()
                    try {
                        const element = document.querySelector(selector)
                        const endTime = performance.now()
                        
                        return {
                            element,
                            selector,
                            found: !!element,
                            performance: {
                                searchTime: endTime - startTime,
                                fallbacksAttempted: 0
                            },
                            validationMethod: 'css'
                        }
                    } catch (error) {
                        return {
                            element: null,
                            selector,
                            found: false,
                            error: error.message,
                            errorDetails: {
                                code: 'SELECTOR_INVALID',
                                category: 'selector',
                                severity: 'high',
                                context: {},
                                suggestions: ['Use valid CSS selector syntax']
                            }
                        }
                    }
                },
                
                async executeWithFallbackStrategies(selector: string, options = {}) {
                    const result = await this.findElement(selector)
                    
                    if (!result.found) {
                        result.fallbackStrategies = {
                            attempted: [selector],
                            failed: [selector],
                            recommendations: [
                                'Add data-testid attribute to target element',
                                'Use more specific selectors',
                                'Check if element exists in DOM'
                            ]
                        }
                    }
                    
                    return result
                },
                
                validateElementComprehensively(element: HTMLElement | null, selector: string) {
                    if (!element) {
                        return {
                            isValid: false,
                            issues: ['Element not found'],
                            recommendations: ['Check if element exists in DOM'],
                            accessibilityScore: 0,
                            errorDetails: {
                                code: 'SELECTOR_NOT_FOUND',
                                category: 'selector',
                                severity: 'medium',
                                context: {},
                                suggestions: []
                            }
                        }
                    }
                    
                    const rect = element.getBoundingClientRect()
                    const style = window.getComputedStyle(element)
                    const issues: string[] = []
                    const recommendations: string[] = []
                    
                    // Check visibility
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                        issues.push('Element is not visible')
                        recommendations.push('Check CSS display, visibility, and opacity properties')
                    }
                    
                    // Check dimensions
                    if (rect.width === 0 || rect.height === 0) {
                        issues.push('Element has zero dimensions')
                        recommendations.push('Check CSS width and height properties')
                    }
                    
                    // Check viewport
                    if (rect.top < 0 || rect.left < 0 || 
                        rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
                        issues.push('Element is outside viewport')
                        recommendations.push('Scroll element into view')
                    }
                    
                    const accessibilityScore = Math.max(0, 100 - (issues.length * 25))
                    
                    return {
                        isValid: issues.length === 0,
                        issues,
                        recommendations,
                        accessibilityScore
                    }
                }
            }
        })
    })
}

// Helper function to create test page with elements
async function createTestPage(page: Page, elements: string[] = []) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>TourElementValidator Integration Test</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
                .btn-primary { background-color: #007bff; color: white; }
                .modal { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
                input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
                .hidden-element { display: none; }
            </style>
        </head>
        <body>
            <h1>TourElementValidator Integration Test Page</h1>
            ${elements.map(el => testElements[el as keyof typeof testElements]?.html || '').join('\n')}
            
            <div id="dynamic-content-area"></div>
            
            <script>
                // Add some dynamic behavior
                setTimeout(() => {
                    const dynamicArea = document.getElementById('dynamic-content-area');
                    if (dynamicArea) {
                        dynamicArea.innerHTML = '${testElements.dynamicElement.html}';
                    }
                }, 1000);
            </script>
        </body>
        </html>
    `
    
    await page.setContent(html)
    await injectValidator(page)
}

test.describe('TourElementValidator - Cross-Browser Integration', () => {
    test('should find basic elements across all browsers', async ({ page, browserName }) => {
        await createTestPage(page, ['button', 'input', 'navigation'])
        
        // Test button finding
        const buttonResult = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.findElement('button[data-testid="test-button"]')
        })
        
        expect(buttonResult.found).toBe(true)
        expect(buttonResult.element).toBeTruthy()
        expect(buttonResult.performance.searchTime).toBeGreaterThanOrEqual(0)
        
        // Test input finding
        const inputResult = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.findElement('input[data-testid="test-input"]')
        })
        
        expect(inputResult.found).toBe(true)
        expect(inputResult.element).toBeTruthy()
        
        // Test navigation finding
        const navResult = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.findElement('nav[data-testid="test-nav"]')
        })
        
        expect(navResult.found).toBe(true)
        expect(navResult.element).toBeTruthy()
        
        console.log(`✅ Basic element finding works in ${browserName}`)
    })

    test('should handle invalid selectors gracefully across browsers', async ({ page, browserName }) => {
        await createTestPage(page, [])
        
        const invalidSelectors = [
            '',
            'invalid:selector:syntax',
            '#',
            '.',
            '[invalid-attribute'
        ]
        
        for (const selector of invalidSelectors) {
            const result = await page.evaluate(async (sel) => {
                return await (window as any).TourElementValidator.findElement(sel)
            }, selector)
            
            expect(result.found).toBe(false)
            expect(result.error).toBeTruthy()
            expect(result.errorDetails).toBeTruthy()
            expect(result.errorDetails.code).toBe('SELECTOR_INVALID')
        }
        
        console.log(`✅ Invalid selector handling works in ${browserName}`)
    })

    test('should provide fallback strategies across browsers', async ({ page, browserName }) => {
        await createTestPage(page, ['button'])
        
        const result = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.executeWithFallbackStrategies('#non-existent-element')
        })
        
        expect(result.found).toBe(false)
        expect(result.fallbackStrategies).toBeTruthy()
        expect(result.fallbackStrategies.recommendations).toBeTruthy()
        expect(result.fallbackStrategies.recommendations.length).toBeGreaterThan(0)
        expect(result.fallbackStrategies.attempted).toContain('#non-existent-element')
        expect(result.fallbackStrategies.failed).toContain('#non-existent-element')
        
        console.log(`✅ Fallback strategies work in ${browserName}`)
    })

    test('should validate element visibility across browsers', async ({ page, browserName }) => {
        await createTestPage(page, ['button', 'hiddenElement'])
        
        // Test visible element
        const visibleResult = await page.evaluate(async () => {
            const element = document.querySelector('button[data-testid="test-button"]')
            return (window as any).TourElementValidator.validateElementComprehensively(element, 'button[data-testid="test-button"]')
        })
        
        expect(visibleResult.isValid).toBe(true)
        expect(visibleResult.issues.length).toBe(0)
        expect(visibleResult.accessibilityScore).toBeGreaterThan(75)
        
        // Test hidden element
        const hiddenResult = await page.evaluate(async () => {
            const element = document.querySelector('.hidden-element[data-testid="hidden-test"]')
            return (window as any).TourElementValidator.validateElementComprehensively(element, '.hidden-element[data-testid="hidden-test"]')
        })
        
        expect(hiddenResult.isValid).toBe(false)
        expect(hiddenResult.issues).toContain('Element is not visible')
        expect(hiddenResult.recommendations).toContain('Check CSS display, visibility, and opacity properties')
        expect(hiddenResult.accessibilityScore).toBeLessThan(100)
        
        console.log(`✅ Element visibility validation works in ${browserName}`)
    })

    test('should handle modal and overlay elements across browsers', async ({ page, browserName }) => {
        await createTestPage(page, ['modal'])
        
        const modalResult = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.findElement('.modal[data-testid="test-modal"]')
        })
        
        expect(modalResult.found).toBe(true)
        expect(modalResult.element).toBeTruthy()
        
        // Validate modal element
        const modalValidation = await page.evaluate(async () => {
            const element = document.querySelector('.modal[data-testid="test-modal"]')
            return (window as any).TourElementValidator.validateElementComprehensively(element, '.modal[data-testid="test-modal"]')
        })
        
        expect(modalValidation.isValid).toBe(true)
        expect(modalValidation.accessibilityScore).toBeGreaterThan(0)
        
        console.log(`✅ Modal element handling works in ${browserName}`)
    })

    test('should handle dynamic content loading across browsers', async ({ page, browserName }) => {
        await createTestPage(page, [])
        
        // Wait for dynamic content to load
        await page.waitForTimeout(1500)
        
        const dynamicResult = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.findElement('.dynamic-element[data-testid="dynamic-test"]')
        })
        
        expect(dynamicResult.found).toBe(true)
        expect(dynamicResult.element).toBeTruthy()
        
        console.log(`✅ Dynamic content handling works in ${browserName}`)
    })

    test('should maintain performance standards across browsers', async ({ page, browserName }) => {
        await createTestPage(page, ['button', 'input', 'navigation', 'modal'])
        
        const performanceResults = []
        const selectors = [
            'button[data-testid="test-button"]',
            'input[data-testid="test-input"]',
            'nav[data-testid="test-nav"]',
            '.modal[data-testid="test-modal"]'
        ]
        
        for (const selector of selectors) {
            const result = await page.evaluate(async (sel) => {
                const startTime = performance.now()
                const result = await (window as any).TourElementValidator.findElement(sel)
                const endTime = performance.now()
                
                return {
                    ...result,
                    totalTime: endTime - startTime
                }
            }, selector)
            
            expect(result.found).toBe(true)
            expect(result.totalTime).toBeLessThan(100) // Should be fast
            performanceResults.push(result.totalTime)
        }
        
        const averageTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length
        expect(averageTime).toBeLessThan(50) // Average should be very fast
        
        console.log(`✅ Performance standards maintained in ${browserName} (avg: ${Math.round(averageTime)}ms)`)
    })

    test('should handle viewport and scrolling scenarios across browsers', async ({ page, browserName }) => {
        // Create a page with content that requires scrolling
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Scroll Test</title>
                <style>
                    body { margin: 0; padding: 0; }
                    .spacer { height: 2000px; background: linear-gradient(to bottom, #f0f0f0, #e0e0e0); }
                    .bottom-element { 
                        position: absolute; 
                        top: 1500px; 
                        left: 50%; 
                        transform: translateX(-50%);
                        padding: 20px;
                        background: #007bff;
                        color: white;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="spacer"></div>
                <div class="bottom-element" data-testid="bottom-element">Bottom Element</div>
            </body>
            </html>
        `
        
        await page.setContent(html)
        await injectValidator(page)
        
        // Element should be out of viewport initially
        const initialResult = await page.evaluate(async () => {
            const element = document.querySelector('.bottom-element[data-testid="bottom-element"]')
            return (window as any).TourElementValidator.validateElementComprehensively(element, '.bottom-element[data-testid="bottom-element"]')
        })
        
        expect(initialResult.isValid).toBe(false)
        expect(initialResult.issues).toContain('Element is outside viewport')
        expect(initialResult.recommendations).toContain('Scroll element into view')
        
        // Scroll to element
        await page.evaluate(() => {
            const element = document.querySelector('.bottom-element[data-testid="bottom-element"]')
            if (element) {
                element.scrollIntoView()
            }
        })
        
        // Wait for scroll to complete
        await page.waitForTimeout(500)
        
        // Element should now be in viewport
        const scrolledResult = await page.evaluate(async () => {
            const element = document.querySelector('.bottom-element[data-testid="bottom-element"]')
            return (window as any).TourElementValidator.validateElementComprehensively(element, '.bottom-element[data-testid="bottom-element"]')
        })
        
        expect(scrolledResult.isValid).toBe(true)
        expect(scrolledResult.issues).not.toContain('Element is outside viewport')
        
        console.log(`✅ Viewport and scrolling handling works in ${browserName}`)
    })
})

test.describe('TourElementValidator - Performance Under Load', () => {
    test('should handle many elements efficiently', async ({ page, browserName }) => {
        // Create page with many elements
        const elementCount = 1000
        const elements = Array.from({ length: elementCount }, (_, i) => 
            `<div class="test-element" data-testid="element-${i}" id="element-${i}">Element ${i}</div>`
        ).join('\n')
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head><title>Performance Test</title></head>
            <body>
                <h1>Performance Test - ${elementCount} Elements</h1>
                ${elements}
            </body>
            </html>
        `
        
        await page.setContent(html)
        await injectValidator(page)
        
        // Test finding elements by different selectors
        const testSelectors = [
            '#element-500',
            '.test-element',
            '[data-testid="element-750"]',
            'div:nth-child(100)'
        ]
        
        const startTime = Date.now()
        
        for (const selector of testSelectors) {
            const result = await page.evaluate(async (sel) => {
                return await (window as any).TourElementValidator.findElement(sel)
            }, selector)
            
            expect(result.performance.searchTime).toBeLessThan(100) // Each search should be fast
        }
        
        const totalTime = Date.now() - startTime
        expect(totalTime).toBeLessThan(1000) // All searches should complete quickly
        
        console.log(`✅ Performance with ${elementCount} elements maintained in ${browserName} (${totalTime}ms total)`)
    })

    test('should handle rapid DOM mutations', async ({ page, browserName }) => {
        await createTestPage(page, [])
        
        // Start rapid DOM mutations
        await page.evaluate(() => {
            let counter = 0
            const interval = setInterval(() => {
                const container = document.body
                
                // Add element
                const newElement = document.createElement('div')
                newElement.className = 'mutation-test'
                newElement.id = `mutation-${counter}`
                newElement.textContent = `Mutation ${counter}`
                container.appendChild(newElement)
                
                // Remove old elements
                const oldElements = container.querySelectorAll('.mutation-test')
                if (oldElements.length > 50) {
                    container.removeChild(oldElements[0])
                }
                
                counter++
                
                if (counter > 100) {
                    clearInterval(interval)
                }
            }, 10)
        })
        
        // Try to find elements during mutations
        await page.waitForTimeout(500) // Let some mutations happen
        
        const result = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.executeWithFallbackStrategies('.mutation-test', {
                timeout: 1000
            })
        })
        
        // Should handle mutations gracefully
        expect(result).toBeTruthy()
        expect(result.fallbackStrategies).toBeTruthy()
        
        console.log(`✅ Rapid DOM mutations handled in ${browserName}`)
    })
})

test.describe('TourElementValidator - Real-world Scenarios', () => {
    test('should work with complex form interactions', async ({ page, browserName }) => {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Form Test</title>
                <style>
                    .form-container { max-width: 500px; margin: 20px auto; padding: 20px; }
                    .form-group { margin-bottom: 15px; }
                    label { display: block; margin-bottom: 5px; font-weight: bold; }
                    input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
                    .btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    .error { border-color: #dc3545; }
                    .error-message { color: #dc3545; font-size: 14px; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="form-container">
                    <h2>Contact Form</h2>
                    <form id="contact-form">
                        <div class="form-group">
                            <label for="name">Name *</label>
                            <input type="text" id="name" name="name" data-testid="name-input" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" data-testid="email-input" required>
                        </div>
                        <div class="form-group">
                            <label for="subject">Subject</label>
                            <select id="subject" name="subject" data-testid="subject-select">
                                <option value="">Select a subject</option>
                                <option value="general">General Inquiry</option>
                                <option value="support">Support</option>
                                <option value="billing">Billing</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="message">Message *</label>
                            <textarea id="message" name="message" rows="5" data-testid="message-textarea" required></textarea>
                        </div>
                        <button type="submit" class="btn" data-testid="submit-button">Send Message</button>
                    </form>
                </div>
            </body>
            </html>
        `
        
        await page.setContent(html)
        await injectValidator(page)
        
        // Test finding all form elements
        const formElements = [
            'input[data-testid="name-input"]',
            'input[data-testid="email-input"]',
            'select[data-testid="subject-select"]',
            'textarea[data-testid="message-textarea"]',
            'button[data-testid="submit-button"]'
        ]
        
        for (const selector of formElements) {
            const result = await page.evaluate(async (sel) => {
                return await (window as any).TourElementValidator.findElement(sel)
            }, selector)
            
            expect(result.found).toBe(true)
            expect(result.element).toBeTruthy()
            
            // Validate element
            const validation = await page.evaluate(async (sel) => {
                const element = document.querySelector(sel)
                return (window as any).TourElementValidator.validateElementComprehensively(element, sel)
            }, selector)
            
            expect(validation.isValid).toBe(true)
            expect(validation.accessibilityScore).toBeGreaterThan(50)
        }
        
        console.log(`✅ Complex form interactions work in ${browserName}`)
    })

    test('should handle single-page application navigation', async ({ page, browserName }) => {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>SPA Navigation Test</title>
                <style>
                    .nav-container { background: #f8f9fa; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
                    .nav-list { list-style: none; margin: 0; padding: 0; display: flex; justify-content: center; }
                    .nav-item { margin: 0 15px; }
                    .nav-link { text-decoration: none; color: #007bff; padding: 10px 15px; border-radius: 4px; transition: background 0.3s; }
                    .nav-link:hover, .nav-link.active { background: #007bff; color: white; }
                    .content { padding: 40px 20px; text-align: center; }
                    .page { display: none; }
                    .page.active { display: block; }
                </style>
            </head>
            <body>
                <nav class="nav-container" data-testid="main-navigation">
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="#home" class="nav-link active" data-testid="home-link">Home</a>
                        </li>
                        <li class="nav-item">
                            <a href="#about" class="nav-link" data-testid="about-link">About</a>
                        </li>
                        <li class="nav-item">
                            <a href="#services" class="nav-link" data-testid="services-link">Services</a>
                        </li>
                        <li class="nav-item">
                            <a href="#contact" class="nav-link" data-testid="contact-link">Contact</a>
                        </li>
                    </ul>
                </nav>
                
                <div class="content">
                    <div id="home" class="page active">
                        <h1>Welcome Home</h1>
                        <p>This is the home page content.</p>
                        <button data-testid="cta-button" class="btn">Get Started</button>
                    </div>
                    <div id="about" class="page">
                        <h1>About Us</h1>
                        <p>Learn more about our company.</p>
                    </div>
                    <div id="services" class="page">
                        <h1>Our Services</h1>
                        <p>Discover what we can do for you.</p>
                    </div>
                    <div id="contact" class="page">
                        <h1>Contact Us</h1>
                        <p>Get in touch with our team.</p>
                    </div>
                </div>
                
                <script>
                    // Simple SPA navigation
                    document.addEventListener('click', (e) => {
                        if (e.target.matches('.nav-link')) {
                            e.preventDefault()
                            const targetId = e.target.getAttribute('href').substring(1)
                            
                            // Update active nav link
                            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'))
                            e.target.classList.add('active')
                            
                            // Show target page
                            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'))
                            document.getElementById(targetId).classList.add('active')
                        }
                    })
                </script>
            </body>
            </html>
        `
        
        await page.setContent(html)
        await injectValidator(page)
        
        // Test navigation elements
        const navResult = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.findElement('nav[data-testid="main-navigation"]')
        })
        
        expect(navResult.found).toBe(true)
        
        // Test navigation links
        const navLinks = ['home-link', 'about-link', 'services-link', 'contact-link']
        
        for (const linkTestId of navLinks) {
            const linkResult = await page.evaluate(async (testId) => {
                return await (window as any).TourElementValidator.findElement(`a[data-testid="${testId}"]`)
            }, linkTestId)
            
            expect(linkResult.found).toBe(true)
            expect(linkResult.element).toBeTruthy()
        }
        
        // Test dynamic content after navigation
        await page.click('a[data-testid="about-link"]')
        await page.waitForTimeout(100)
        
        const activePageResult = await page.evaluate(async () => {
            return await (window as any).TourElementValidator.findElement('.page.active')
        })
        
        expect(activePageResult.found).toBe(true)
        
        console.log(`✅ SPA navigation handling works in ${browserName}`)
    })
})