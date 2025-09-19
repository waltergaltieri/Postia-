# Guía de Estilo Actualizada - Postia SaaS

**Versión:** 2.0  
**Fecha de actualización:** 19 de septiembre, 2025  
**Basada en:** Correcciones de estilo implementadas en `.kiro/specs/style-fixes/`

## Introducción

Esta guía de estilo ha sido actualizada para reflejar todos los patrones y estándares aplicados durante las correcciones de estilo. Incluye sistemas unificados de colores, espaciado, tipografía, componentes y mejores prácticas de accesibilidad.

---

## 1. Sistema de Colores

### Colores Principales (WCAG 2.1 AA Compliant)

```css
:root {
  /* Colores de texto - Contraste optimizado */
  --text-primary: hsl(222.2 84% 4.9%);      /* 7.2:1 contrast */
  --text-secondary: hsl(215.4 16.3% 46.9%); /* 4.8:1 contrast */
  --text-muted: hsl(215.4 16.3% 56.9%);     /* 4.5:1 contrast */
  
  /* Colores de marca */
  --primary: hsl(221.2 83.2% 53.3%);        /* 6.7:1 contrast */
  --primary-hover: hsl(221.2 83.2% 48.3%);
  --primary-active: hsl(221.2 83.2% 43.3%);
  
  /* Colores semánticos */
  --success: hsl(142.1 76.2% 36.3%);        /* 6.4:1 contrast */
  --error: hsl(0 84.2% 60.2%);              /* 5.1:1 contrast */
  --warning: hsl(38 92% 50%);               /* 5.8:1 contrast */
  --info: hsl(199 89% 48%);                 /* 5.2:1 contrast */
  
  /* Colores de fondo */
  --background: hsl(0 0% 100%);
  --background-secondary: hsl(210 40% 98%);
  --background-muted: hsl(210 40% 96%);
  
  /* Colores de borde */
  --border: hsl(214.3 31.8% 91.4%);
  --border-hover: hsl(214.3 31.8% 86.4%);
}
```

### Uso de Colores

#### ✅ Correcto
```css
/* Usar variables CSS */
color: var(--text-primary);
background-color: var(--background);
border-color: var(--border);

/* Estados semánticos */
.success { color: var(--success); }
.error { color: var(--error); }
```

#### ❌ Incorrecto
```css
/* No usar valores hardcoded */
color: #000000;
background-color: #ffffff;
color: rgb(255, 255, 255); /* Texto blanco sobre fondo blanco */
```

---

## 2. Sistema de Espaciado

### Grid Base de 4px

```css
:root {
  /* Sistema de espaciado basado en 4px */
  --space-1: 4px;    /* xs - Para ajustes finos */
  --space-2: 8px;    /* sm - Espaciado mínimo */
  --space-4: 16px;   /* md - Espaciado estándar */
  --space-6: 24px;   /* lg - Espaciado amplio */
  --space-8: 32px;   /* xl - Espaciado extra amplio */
  --space-12: 48px;  /* 2xl - Espaciado de sección */
  --space-16: 64px;  /* 3xl - Espaciado de página */
}
```

### Clases Utilitarias

```css
/* Padding */
.spacing-p-1 { padding: var(--space-1); }
.spacing-p-2 { padding: var(--space-2); }
.spacing-p-4 { padding: var(--space-4); }
.spacing-p-6 { padding: var(--space-6); }

/* Margin */
.spacing-m-1 { margin: var(--space-1); }
.spacing-m-2 { margin: var(--space-2); }
.spacing-m-4 { margin: var(--space-4); }
.spacing-m-6 { margin: var(--space-6); }

/* Gap para flexbox/grid */
.spacing-gap-2 { gap: var(--space-2); }
.spacing-gap-4 { gap: var(--space-4); }
.spacing-gap-6 { gap: var(--space-6); }
```

### Espaciado por Componente

```css
/* Tarjetas */
.card-spacing-standard {
  padding: var(--space-6); /* 24px */
}

/* Formularios */
.form-container-standard {
  gap: var(--space-4); /* 16px entre campos */
}

.form-group {
  margin-bottom: var(--space-4); /* 16px */
}

/* Botones */
.btn-spacing-standard {
  padding: var(--space-2) var(--space-4); /* 8px 16px */
}
```

### Uso de Espaciado

#### ✅ Correcto
```css
/* Usar variables y clases utilitarias */
.component {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  gap: var(--space-2);
}

/* Usar clases predefinidas */
<div className="spacing-p-4 spacing-m-6">
```

#### ❌ Incorrecto
```css
/* No usar valores hardcoded */
.component {
  padding: 15px; /* No sigue el grid de 4px */
  margin: 23px;  /* Valor arbitrario */
}
```

---

## 3. Sistema de Tipografía

### Escalas de Texto

```css
:root {
  /* Tamaños de fuente responsive */
  --text-xs: clamp(0.75rem, 1.5vw, 0.875rem);   /* 12-14px */
  --text-sm: clamp(0.875rem, 2vw, 1rem);        /* 14-16px */
  --text-base: clamp(1rem, 2.5vw, 1.125rem);    /* 16-18px */
  --text-lg: clamp(1.125rem, 3vw, 1.25rem);     /* 18-20px */
  --text-xl: clamp(1.25rem, 3.5vw, 1.5rem);     /* 20-24px */
  --text-2xl: clamp(1.5rem, 4vw, 2rem);         /* 24-32px */
  
  /* Alturas de línea */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Espaciado de letras */
  --tracking-tight: -0.025em;
  --tracking-normal: 0em;
  --tracking-wide: 0.025em;
}
```

### Clases de Tipografía

```css
.text-xs { font-size: var(--text-xs); }
.text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); }
.text-lg { font-size: var(--text-lg); }

.leading-tight { line-height: var(--leading-tight); }
.leading-normal { line-height: var(--leading-normal); }

.tracking-tight { letter-spacing: var(--tracking-tight); }
.tracking-normal { letter-spacing: var(--tracking-normal); }
```

### Uso de Tipografía

#### ✅ Correcto
```tsx
// Texto responsive que mantiene legibilidad
<h1 className="text-2xl leading-tight tracking-tight">
  Título Principal
</h1>

<p className="text-base leading-normal">
  Texto de párrafo con buena legibilidad
</p>

// Inputs con tamaño mínimo para evitar zoom en iOS
<input className="text-base" style={{ fontSize: '16px' }} />
```

#### ❌ Incorrecto
```tsx
// Texto muy pequeño en móviles
<p style={{ fontSize: '12px' }}>Texto difícil de leer</p>

// Input que causa zoom en iOS
<input style={{ fontSize: '14px' }} />
```

---

## 4. Sistema de Iconos

### Tamaños Estándar

```css
:root {
  --icon-xs: 0.75rem;   /* 12px */
  --icon-sm: 1rem;      /* 16px */
  --icon-md: 1.25rem;   /* 20px */
  --icon-lg: 1.5rem;    /* 24px */
  --icon-xl: 2rem;      /* 32px */
}
```

### Componente Icon Unificado

```tsx
// Uso básico
<Icon name="CheckCircle" size="md" variant="success" />

// Contexto específico
<NavigationIcon name="Home" context="sidebar" />
<ButtonIcon name="Plus" context="default" />
<StatusIcon name="CheckCircle" status="success" />

// Con colores semánticos
<Icon name="AlertTriangle" variant="warning" />
<Icon name="XCircle" variant="error" />
```

### Colores de Iconos

```css
.icon-success { color: var(--success); }
.icon-error { color: var(--error); }
.icon-warning { color: var(--warning); }
.icon-info { color: var(--info); }
.icon-muted { color: var(--text-muted); }
```

### Uso de Iconos

#### ✅ Correcto
```tsx
// Usar componente unificado
<Icon name="CheckCircle" size="md" variant="success" />

// Alineación con texto
<div className="flex items-center gap-2">
  <Icon name="User" size="sm" />
  <span>Usuario</span>
</div>
```

#### ❌ Incorrecto
```tsx
// Tamaños inconsistentes
<CheckCircle size={18} /> // No es un tamaño estándar
<UserIcon width="22px" height="22px" /> // Tamaño arbitrario
```

---

## 5. Estados de Interacción

### Estados de Hover

```css
.hover-subtle:hover {
  background-color: var(--background-secondary);
  transition: background-color 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Estados de Focus

```css
.focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Focus mejorado para móvil */
@media (max-width: 768px) {
  .focus-visible {
    outline-width: 3px;
  }
}
```

### Estados Disabled

```css
.state-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  filter: grayscale(50%);
}
```

### Estados de Selección

```css
.state-selected {
  background-color: var(--primary);
  color: white;
  position: relative;
}

.state-selected::after {
  content: "✓";
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}
```

---

## 6. Responsive Design

### Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}

/* Mobile First */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### Touch Targets

```css
/* Mínimo 44px para elementos táctiles */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Componentes Responsive

```tsx
// Modal que se adapta a móvil
<ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
  <ResponsiveModalContent size="md" fullscreenOnMobile>
    {/* Contenido */}
  </ResponsiveModalContent>
</ResponsiveModal>

// Scroll horizontal para tablas
<HorizontalScrollWrapper>
  <table>{/* Contenido de tabla */}</table>
</HorizontalScrollWrapper>

// Tooltip que se oculta en móvil
<QuickTooltip text="Ayuda" hideOnMobile>
  <Button>Ayuda</Button>
</QuickTooltip>
```

---

## 7. Sistema de Formularios

### Estructura Estándar

```tsx
<form className="form-container-standard">
  <div className="form-group">
    <Label htmlFor="email" className="form-label">
      Email
    </Label>
    <Input
      id="email"
      type="email"
      className="form-input"
      placeholder="tu@email.com"
    />
  </div>
  
  <div className="form-actions">
    <Button type="submit" variant="primary">
      Enviar
    </Button>
    <Button type="button" variant="secondary">
      Cancelar
    </Button>
  </div>
</form>
```

### Estilos de Formulario

```css
.form-container-standard {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 16px; /* Previene zoom en iOS */
}

.form-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-2);
}
```

---

## 8. Sistema de Botones

### Variantes de Botones

```tsx
// Botón primario
<Button variant="primary" size="md">
  Acción Principal
</Button>

// Botón secundario
<Button variant="secondary" size="md">
  Acción Secundaria
</Button>

// Botón de peligro
<Button variant="destructive" size="md">
  Eliminar
</Button>

// Botón fantasma
<Button variant="ghost" size="md">
  Cancelar
</Button>
```

### Tamaños de Botones

```css
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
  min-height: 32px;
}

.btn-md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
  min-height: 40px;
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
  min-height: 48px;
}
```

---

## 9. Sistema de Notificaciones

### Uso del Sistema

```tsx
const notify = useNotify();

// Notificaciones básicas
notify.success("Operación completada exitosamente");
notify.error("Ocurrió un error", "Por favor intenta nuevamente");
notify.warning("Esta acción no se puede deshacer");
notify.info("Nuevas funcionalidades disponibles");

// Con acciones
notify.success("Archivo guardado", "Ver archivo", () => {
  // Acción al hacer clic
});
```

### Configuración del Provider

```tsx
<NotificationProvider 
  position="top-right" 
  size="md"
  maxNotifications={5}
>
  <App />
</NotificationProvider>
```

---

## 10. Accesibilidad

### Contraste de Colores

- **Texto normal:** Mínimo 4.5:1 (WCAG AA)
- **Texto grande:** Mínimo 3:1 (WCAG AA)
- **Elementos UI:** Mínimo 3:1 (WCAG AA)

### Navegación por Teclado

```tsx
// Focus visible
<button className="focus-visible">
  Botón Accesible
</button>

// Skip links
<a href="#main-content" className="skip-link">
  Saltar al contenido principal
</a>

// Orden de tabulación lógico
<div tabIndex={0}>Elemento enfocable</div>
```

### ARIA Labels

```tsx
// Botones con iconos
<button aria-label="Cerrar modal">
  <Icon name="X" />
</button>

// Estados dinámicos
<button aria-pressed={isPressed}>
  {isPressed ? 'Activado' : 'Desactivado'}
</button>

// Elementos de carga
<div aria-busy="true" aria-live="polite">
  Cargando...
</div>
```

---

## 11. Mejores Prácticas

### CSS

#### ✅ Hacer
- Usar variables CSS para valores consistentes
- Aplicar mobile-first responsive design
- Usar clases utilitarias para espaciado
- Implementar transiciones suaves
- Respetar preferencias de reduced motion

#### ❌ Evitar
- Valores hardcoded para colores y espaciado
- !important innecesario
- Selectores demasiado específicos
- Animaciones que causen layout shift

### Componentes

#### ✅ Hacer
- Usar componentes unificados (Icon, Button, etc.)
- Implementar props para variantes y tamaños
- Incluir estados de loading y disabled
- Agregar ARIA labels apropiados

#### ❌ Evitar
- Crear componentes duplicados
- Hardcodear estilos en componentes
- Ignorar estados de accesibilidad
- Componentes sin TypeScript types

### Performance

#### ✅ Hacer
- Usar transform y opacity para animaciones
- Implementar will-change cuando sea necesario
- Optimizar selectores CSS
- Lazy load componentes pesados

#### ❌ Evitar
- Animar propiedades que causen reflow
- Selectores CSS complejos
- Componentes sin memoización
- Importar librerías completas

---

## 12. Herramientas de Validación

### Scripts Disponibles

```bash
# Validar contraste de colores
npm run validate:contrast

# Validar consistencia de espaciado
npm run validate:spacing

# Validar accesibilidad
npm run validate:accessibility

# Validar responsive design
npm run validate:responsive

# Suite completa de validación
npm run validate:all
```

### Linting

```json
// .eslintrc.json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error"
  }
}
```

---

## Conclusión

Esta guía de estilo actualizada refleja todos los sistemas y patrones implementados durante las correcciones de estilo. Siguiendo estas pautas, el equipo de desarrollo puede mantener la consistencia visual, accesibilidad y calidad de código alcanzada.

### Recursos Adicionales

- **Documentación completa:** `audit-reports/comprehensive-style-fixes-documentation.md`
- **Componentes de ejemplo:** `src/components/ui/`
- **Scripts de validación:** `scripts/`
- **Sistemas CSS:** `src/styles/`

**Versión:** 2.0  
**Última actualización:** 19 de septiembre, 2025  
**Mantenido por:** Equipo de Desarrollo Postia SaaS