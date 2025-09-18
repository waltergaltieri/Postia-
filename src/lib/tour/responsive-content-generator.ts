import { ResponsiveTourStep, DeviceInfo } from './responsive-tour-adapter'

export interface ContentGenerationOptions {
  deviceType: 'mobile' | 'tablet' | 'desktop'
  screenSize: 'small' | 'medium' | 'large'
  orientation: 'portrait' | 'landscape'
  touchCapable: boolean
  preferredLanguage?: string
  userExperienceLevel?: 'beginner' | 'intermediate' | 'advanced'
}

export interface GeneratedContent {
  title: string
  description: string
  instructions?: string
  visualCues?: string[]
  interactionHints?: string[]
}

export class ResponsiveContentGenerator {
  private templates: Map<string, ContentTemplate> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  private initializeTemplates() {
    // Mobile templates
    this.templates.set('mobile-welcome', {
      title: {
        short: 'Bienvenido',
        medium: 'Bienvenido a Postia',
        long: 'Bienvenido a Postia SaaS'
      },
      description: {
        short: 'Te guiaremos por las funciones principales.',
        medium: 'Te mostraremos las funciones principales de la plataforma.',
        long: 'Te guiaremos paso a paso por las funciones principales de Postia SaaS.'
      },
      touchInstructions: 'Toca para continuar o desliza para navegar',
      visualCues: ['👆', '👈', '👉'],
      interactionHints: ['Toca aquí', 'Desliza hacia la izquierda', 'Desliza hacia la derecha']
    })

    this.templates.set('mobile-navigation', {
      title: {
        short: 'Navegación',
        medium: 'Menú de navegación',
        long: 'Cómo navegar por la aplicación'
      },
      description: {
        short: 'Usa el menú para moverte entre secciones.',
        medium: 'Usa el menú lateral para navegar entre las diferentes secciones.',
        long: 'Utiliza el menú lateral para navegar fácilmente entre las diferentes secciones de la aplicación.'
      },
      touchInstructions: 'Toca el ícono del menú para abrir',
      visualCues: ['☰', '←', '→'],
      interactionHints: ['Toca el menú', 'Desliza desde el borde izquierdo']
    })

    // Tablet templates
    this.templates.set('tablet-welcome', {
      title: {
        short: 'Bienvenido a Postia',
        medium: 'Bienvenido a Postia SaaS',
        long: 'Bienvenido a la plataforma Postia SaaS'
      },
      description: {
        short: 'Exploraremos las características principales de la plataforma.',
        medium: 'Te guiaremos a través de las características y funcionalidades principales de Postia.',
        long: 'Te mostraremos paso a paso todas las características y funcionalidades principales que ofrece Postia SaaS.'
      },
      touchInstructions: 'Toca los botones o usa gestos para navegar',
      visualCues: ['👆', '✋', '👈', '👉'],
      interactionHints: ['Toca para seleccionar', 'Mantén presionado para opciones', 'Desliza para navegar']
    })

    // Desktop templates
    this.templates.set('desktop-welcome', {
      title: {
        short: 'Bienvenido a Postia SaaS',
        medium: 'Bienvenido a la plataforma Postia SaaS',
        long: 'Bienvenido a la plataforma completa de gestión de contenido Postia SaaS'
      },
      description: {
        short: 'Exploraremos todas las funcionalidades disponibles en la plataforma.',
        medium: 'Te guiaremos a través de todas las funcionalidades y herramientas disponibles en Postia SaaS.',
        long: 'Te mostraremos detalladamente todas las funcionalidades, herramientas y características avanzadas que ofrece la plataforma Postia SaaS para la gestión eficiente de contenido.'
      },
      touchInstructions: 'Usa el mouse y teclado para navegar',
      visualCues: ['🖱️', '⌨️', '↑', '↓', '←', '→'],
      interactionHints: ['Haz clic para continuar', 'Usa las flechas del teclado', 'Presiona Enter para avanzar']
    })
  }

  // Generate content for specific step and device
  generateContent(
    stepId: string,
    options: ContentGenerationOptions,
    customTemplate?: Partial<ContentTemplate>
  ): GeneratedContent {
    const templateKey = this.getTemplateKey(stepId, options.deviceType)
    const template = customTemplate || this.templates.get(templateKey) || this.getDefaultTemplate()
    
    const contentLength = this.getOptimalContentLength(options)
    const title = this.selectContentByLength(template.title, contentLength.title)
    const description = this.selectContentByLength(template.description, contentLength.description)
    
    let instructions = template.touchInstructions
    if (!options.touchCapable) {
      instructions = template.keyboardInstructions || 'Usa el teclado para navegar'
    }

    // Add device-specific interaction hints
    const interactionHints = this.generateInteractionHints(options, template)
    const visualCues = this.selectVisualCues(options, template)

    return {
      title,
      description,
      instructions,
      interactionHints,
      visualCues
    }
  }

  private getTemplateKey(stepId: string, deviceType: string): string {
    return `${deviceType}-${stepId}`
  }

  private getDefaultTemplate(): ContentTemplate {
    return {
      title: {
        short: 'Paso del tour',
        medium: 'Paso del tour',
        long: 'Paso del tour'
      },
      description: {
        short: 'Descripción del paso.',
        medium: 'Descripción del paso del tour.',
        long: 'Descripción detallada del paso del tour.'
      },
      touchInstructions: 'Toca para continuar',
      keyboardInstructions: 'Presiona Enter para continuar',
      visualCues: ['👆'],
      interactionHints: ['Continuar']
    }
  }

  private getOptimalContentLength(options: ContentGenerationOptions): {
    title: 'short' | 'medium' | 'long'
    description: 'short' | 'medium' | 'long'
  } {
    const { deviceType, screenSize, orientation } = options

    if (deviceType === 'mobile') {
      if (screenSize === 'small' || orientation === 'landscape') {
        return { title: 'short', description: 'short' }
      }
      return { title: 'medium', description: 'medium' }
    }

    if (deviceType === 'tablet') {
      if (orientation === 'portrait') {
        return { title: 'medium', description: 'medium' }
      }
      return { title: 'long', description: 'medium' }
    }

    return { title: 'long', description: 'long' }
  }

  private selectContentByLength(
    content: { short: string; medium: string; long: string },
    length: 'short' | 'medium' | 'long'
  ): string {
    return content[length] || content.medium || content.short
  }

  private generateInteractionHints(
    options: ContentGenerationOptions,
    template: ContentTemplate
  ): string[] {
    const hints: string[] = []

    if (options.touchCapable) {
      hints.push(...(template.interactionHints || []))
      
      if (options.deviceType === 'mobile') {
        hints.push('Desliza para navegar entre pasos')
        hints.push('Toca dos veces para pantalla completa')
      }
    } else {
      hints.push('Usa las flechas del teclado para navegar')
      hints.push('Presiona Escape para cerrar')
      hints.push('Presiona Enter para continuar')
    }

    return hints
  }

  private selectVisualCues(
    options: ContentGenerationOptions,
    template: ContentTemplate
  ): string[] {
    const cues = template.visualCues || []
    
    if (!options.touchCapable) {
      // Replace touch cues with keyboard cues
      return cues.map(cue => {
        switch (cue) {
          case '👆': return '⌨️'
          case '👈': return '←'
          case '👉': return '→'
          case '✋': return '🖱️'
          default: return cue
        }
      })
    }

    return cues
  }

  // Generate step-by-step instructions
  generateStepInstructions(
    stepIndex: number,
    totalSteps: number,
    options: ContentGenerationOptions
  ): string[] {
    const instructions: string[] = []
    const { deviceType, touchCapable } = options

    // Progress indication
    instructions.push(`Paso ${stepIndex} de ${totalSteps}`)

    // Navigation instructions
    if (touchCapable) {
      if (deviceType === 'mobile') {
        instructions.push('Desliza hacia la izquierda para el siguiente paso')
        if (stepIndex > 1) {
          instructions.push('Desliza hacia la derecha para el paso anterior')
        }
      } else {
        instructions.push('Toca "Siguiente" para continuar')
        if (stepIndex > 1) {
          instructions.push('Toca "Anterior" para retroceder')
        }
      }
    } else {
      instructions.push('Usa las flechas del teclado o los botones para navegar')
    }

    // Exit instructions
    instructions.push(touchCapable ? 'Toca "Omitir" para salir del tour' : 'Presiona Escape para salir')

    return instructions
  }

  // Generate accessibility descriptions
  generateAccessibilityContent(
    content: GeneratedContent,
    options: ContentGenerationOptions
  ): {
    ariaLabel: string
    ariaDescription: string
    screenReaderText: string
  } {
    const { title, description, instructions } = content
    const { deviceType, touchCapable } = options

    const ariaLabel = `Tour paso: ${title}`
    const ariaDescription = `${description}${instructions ? ` ${instructions}` : ''}`
    
    let screenReaderText = `${title}. ${description}.`
    
    if (instructions) {
      screenReaderText += ` ${instructions}.`
    }

    // Add navigation context for screen readers
    if (touchCapable && deviceType === 'mobile') {
      screenReaderText += ' Deslice horizontalmente para navegar entre pasos.'
    } else {
      screenReaderText += ' Use las flechas del teclado para navegar.'
    }

    return {
      ariaLabel,
      ariaDescription,
      screenReaderText
    }
  }

  // Add custom template
  addTemplate(key: string, template: ContentTemplate) {
    this.templates.set(key, template)
  }

  // Get all available templates
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys())
  }
}

interface ContentTemplate {
  title: {
    short: string
    medium: string
    long: string
  }
  description: {
    short: string
    medium: string
    long: string
  }
  touchInstructions?: string
  keyboardInstructions?: string
  visualCues?: string[]
  interactionHints?: string[]
}

// React hook for responsive content generation
export function useResponsiveContentGenerator() {
  const generatorRef = React.useRef<ResponsiveContentGenerator | null>(null)

  React.useEffect(() => {
    generatorRef.current = new ResponsiveContentGenerator()
  }, [])

  const generateContent = React.useCallback((
    stepId: string,
    options: ContentGenerationOptions,
    customTemplate?: Partial<ContentTemplate>
  ) => {
    return generatorRef.current?.generateContent(stepId, options, customTemplate) || {
      title: 'Tour Step',
      description: 'Tour step description'
    }
  }, [])

  const generateStepInstructions = React.useCallback((
    stepIndex: number,
    totalSteps: number,
    options: ContentGenerationOptions
  ) => {
    return generatorRef.current?.generateStepInstructions(stepIndex, totalSteps, options) || []
  }, [])

  const generateAccessibilityContent = React.useCallback((
    content: GeneratedContent,
    options: ContentGenerationOptions
  ) => {
    return generatorRef.current?.generateAccessibilityContent(content, options) || {
      ariaLabel: content.title,
      ariaDescription: content.description,
      screenReaderText: `${content.title}. ${content.description}.`
    }
  }, [])

  return {
    generateContent,
    generateStepInstructions,
    generateAccessibilityContent,
    generator: generatorRef.current
  }
}

// Utility functions for content optimization
export const ContentOptimizationUtils = {
  // Optimize text for mobile reading
  optimizeForMobile(text: string, maxLength: number = 120): string {
    if (text.length <= maxLength) return text

    // Try to break at sentence boundaries
    const sentences = text.split(/[.!?]+/)
    let result = ''
    
    for (const sentence of sentences) {
      if ((result + sentence).length <= maxLength) {
        result += sentence + '.'
      } else {
        break
      }
    }

    if (result.length === 0) {
      // Fallback to word boundaries
      const words = text.split(' ')
      for (const word of words) {
        if ((result + ' ' + word).length <= maxLength) {
          result += (result ? ' ' : '') + word
        } else {
          break
        }
      }
      result += '...'
    }

    return result.trim()
  },

  // Convert complex instructions to simple bullet points
  simplifyInstructions(instructions: string[]): string[] {
    return instructions.map(instruction => {
      // Remove complex language
      return instruction
        .replace(/utiliza|emplea|implementa/gi, 'usa')
        .replace(/funcionalidad|característica/gi, 'función')
        .replace(/posteriormente|a continuación/gi, 'después')
        .replace(/adicionalmente|además/gi, 'también')
    })
  },

  // Add visual emphasis for mobile
  addMobileEmphasis(text: string): string {
    return text
      .replace(/importante/gi, '⚠️ Importante')
      .replace(/nota/gi, '📝 Nota')
      .replace(/consejo/gi, '💡 Consejo')
      .replace(/atención/gi, '⚡ Atención')
  },

  // Generate touch-friendly action words
  getTouchActionWords(): { [key: string]: string } {
    return {
      'click': 'toca',
      'hover': 'mantén presionado',
      'scroll': 'desliza',
      'drag': 'arrastra',
      'select': 'toca para seleccionar',
      'navigate': 'navega tocando',
      'open': 'toca para abrir',
      'close': 'toca para cerrar'
    }
  }
}

import * as React from 'react'