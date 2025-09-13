# 🎯 Cómo Probar Postia SaaS - Guía Rápida

## ¿Qué necesitas saber?

**Postia SaaS** es una plataforma que usa inteligencia artificial para crear contenido automáticamente para redes sociales. No necesitas ser programador para probarlo.

## 🚀 Instalación Súper Fácil (5 minutos)

### Opción 1: Instalación Automática ⭐ (Recomendada)

1. **Haz doble clic** en el archivo `INSTALAR-FACIL.bat`
2. **Sigue las instrucciones** en pantalla
3. **¡Listo!** El script hace todo automáticamente

### Opción 2: Si necesitas instalar requisitos primero

Si el script te dice que faltan programas:

1. **Instala Docker Desktop**: [Descargar aquí](https://www.docker.com/products/docker-desktop)
2. **Instala Node.js**: [Descargar aquí](https://nodejs.org) (versión LTS)
3. **Reinicia tu computadora**
4. **Ejecuta** `INSTALAR-FACIL.bat` nuevamente

## 🔑 Configurar las Claves de IA (Obligatorio)

### Necesitas cuentas en:

**OpenAI (ChatGPT)**:
- Ve a: https://platform.openai.com
- Crea cuenta → API Keys → Create new secret key
- Copia la clave (empieza con `sk-`)

**Google Gemini**:
- Ve a: https://makersuite.google.com/app/apikey
- Inicia sesión → Create API Key
- Copia la clave (empieza con `AIza`)

### Configurar las claves:
1. **Abre** el archivo `.env` con Bloc de notas
2. **Reemplaza**:
   - `tu_openai_api_key_aqui` → Tu clave de OpenAI
   - `tu_gemini_api_key_aqui` → Tu clave de Gemini
3. **Guarda** el archivo

## 🎮 Iniciar y Probar

### Iniciar la aplicación:
```
npm run dev
```

### Abrir en el navegador:
**http://localhost:3000**

### Credenciales de prueba:
- **Usuario**: `admin@demo-agency.com`
- **Contraseña**: `admin123`

## 🧪 Qué Probar

### 1. 📊 Dashboard
- Ve las estadísticas generales
- Explora el menú lateral

### 2. 👥 Clientes
- Ve la lista de clientes
- Crea un nuevo cliente
- Edita información

### 3. 📢 Campañas
- Crea una nueva campaña
- Configura objetivos y audiencia
- Ve campañas existentes

### 4. 🤖 ¡Generación de Contenido con IA!
**Esto es lo más emocionante:**
- Ve a "Contenido" → "Generar con IA"
- Describe tu producto/servicio
- Selecciona tipo de contenido (post, historia, etc.)
- **¡Deja que la IA genere contenido profesional!**

### 5. 📅 Calendario
- Programa publicaciones
- Ve contenido planificado
- Organiza tu estrategia

### 6. 👤 Usuarios
- Gestiona el equipo
- Asigna permisos
- Ve actividad

## 🔧 Si Algo No Funciona

### Problemas Comunes:

**"Docker no está ejecutándose"**
- Abre Docker Desktop
- Espera a que diga "running"

**"Puerto 3000 ocupado"**
- Cierra otras aplicaciones
- O usa: `npm run dev -- --port 3001`

**"API Key inválida"**
- Verifica que copiaste bien las claves
- Asegúrate de tener créditos en OpenAI/Gemini

**"La página se ve rota"**
- Ejecuta: `npm run build`
- Luego: `npm run dev`

### Reiniciar Todo:
```
Ctrl + C (para detener)
npm run dev (para iniciar)
```

## 💡 Consejos para la Prueba

1. **Empieza simple**: Crea un cliente ficticio primero
2. **Prueba la IA**: Es la funcionalidad estrella
3. **Experimenta**: Prueba diferentes tipos de contenido
4. **Ve el calendario**: Organiza tus publicaciones
5. **Revisa las métricas**: Ve cómo funciona el dashboard

## 🎯 Casos de Uso Reales

**Para Agencias**:
- Gestiona múltiples clientes
- Genera contenido rápidamente
- Programa publicaciones masivas

**Para Empresas**:
- Mantén presencia en redes sociales
- Crea contenido consistente
- Ahorra tiempo en marketing

**Para Freelancers**:
- Ofrece servicios de redes sociales
- Automatiza tareas repetitivas
- Escala tu negocio

## 📞 ¿Necesitas Ayuda?

1. **Lee** `GUIA-INSTALACION.md` para detalles técnicos
2. **Verifica** que Docker esté ejecutándose
3. **Confirma** que las API keys sean correctas
4. **Reinicia** la aplicación si algo falla

## 🚀 ¡Disfruta Probando!

Postia SaaS puede revolucionar cómo manejas las redes sociales. La IA puede generar contenido que normalmente te tomaría horas crear.

**¡Experimenta y descubre todo lo que puede hacer por ti!** 🎉