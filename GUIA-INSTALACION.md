# 🚀 Guía de Instalación y Prueba - Postia SaaS

## ¿Qué es Postia SaaS?
Postia es una plataforma de gestión de redes sociales con inteligencia artificial que te permite:
- Generar contenido automáticamente para redes sociales
- Gestionar múltiples clientes y campañas
- Programar publicaciones
- Analizar el rendimiento de tus posts

## 📋 Requisitos Previos

Antes de comenzar, necesitarás:
1. **Una computadora con Windows** (que ya tienes)
2. **Conexión a internet**
3. **Cuentas en servicios de IA** (te explico cómo obtenerlas)

## 🔑 Paso 1: Obtener las API Keys Necesarias

### OpenAI (ChatGPT)
1. Ve a [https://platform.openai.com](https://platform.openai.com)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" en el menú lateral
4. Haz clic en "Create new secret key"
5. Copia la clave que empieza con `sk-`
6. **⚠️ IMPORTANTE**: Guarda esta clave en un lugar seguro

### Google Gemini
1. Ve a [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la clave que empieza con `AIza`

### Redes Sociales (Opcional para pruebas básicas)
- **Facebook/Instagram**: [Meta for Developers](https://developers.facebook.com/)
- **Twitter/X**: [Twitter Developer Portal](https://developer.twitter.com/)
- **LinkedIn**: [LinkedIn Developer Portal](https://developer.linkedin.com/)

## 🛠️ Paso 2: Instalación del Sistema

### Opción A: Instalación Automática (Recomendada)
1. Abre PowerShell como administrador:
   - Presiona `Windows + X`
   - Selecciona "Windows PowerShell (Admin)"

2. Navega al directorio del proyecto:
   ```powershell
   cd "C:\Users\quime\Documents\GitHub\Postia\postia-saas"
   ```

3. Ejecuta el script de instalación:
   ```powershell
   .\scripts\setup-dev.bat
   ```

### Opción B: Instalación Manual
Si la opción A no funciona, sigue estos pasos:

1. **Instalar Docker Desktop**:
   - Ve a [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Descarga e instala Docker Desktop
   - Reinicia tu computadora si es necesario

2. **Instalar Node.js**:
   - Ve a [https://nodejs.org](https://nodejs.org)
   - Descarga la versión LTS (recomendada)
   - Instala siguiendo el asistente

3. **Configurar el proyecto**:
   ```powershell
   # Instalar dependencias
   npm install
   
   # Configurar base de datos
   docker-compose up -d
   
   # Generar cliente de base de datos
   npx prisma generate
   
   # Crear tablas
   npx prisma db push
   
   # Poblar con datos de prueba
   npx prisma db seed
   ```

## ⚙️ Paso 3: Configuración

1. **Copia el archivo de configuración**:
   ```powershell
   copy .env.example .env
   ```

2. **Edita el archivo .env**:
   - Abre el archivo `.env` con el Bloc de notas
   - Reemplaza los valores de ejemplo con tus API keys:
   
   ```env
   # Reemplaza con tus claves reales
   OPENAI_API_KEY="tu_clave_openai_aqui"
   GEMINI_API_KEY="tu_clave_gemini_aqui"
   
   # Estas ya están configuradas
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postia_dev"
   REDIS_URL="redis://localhost:6379"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="tu_secreto_super_seguro_aqui"
   ```

## 🚀 Paso 4: Iniciar el Sistema

1. **Inicia los servicios de base de datos**:
   ```powershell
   docker-compose up -d
   ```

2. **Inicia la aplicación**:
   ```powershell
   npm run dev
   ```

3. **Abre tu navegador** y ve a: [http://localhost:3000](http://localhost:3000)

## 🧪 Paso 5: Probar el Sistema

### Credenciales de Prueba
Usa estas credenciales para iniciar sesión:
- **Email**: `admin@demo-agency.com`
- **Contraseña**: `admin123`

### Funcionalidades para Probar

1. **Dashboard Principal**:
   - Ve las estadísticas generales
   - Explora las diferentes secciones

2. **Gestión de Clientes**:
   - Ve a "Clientes" en el menú
   - Explora el cliente de demostración
   - Crea un nuevo cliente

3. **Campañas**:
   - Ve a "Campañas"
   - Crea una nueva campaña
   - Configura los parámetros

4. **Generación de Contenido con IA**:
   - Ve a "Contenido" → "Generar con IA"
   - Selecciona un tipo de contenido
   - Describe tu producto/servicio
   - ¡Deja que la IA genere contenido para ti!

5. **Calendario de Publicaciones**:
   - Ve a "Calendario"
   - Programa publicaciones
   - Ve el contenido planificado

## 🔧 Solución de Problemas Comunes

### Error: "Docker no está ejecutándose"
- Abre Docker Desktop
- Espera a que aparezca "Docker Desktop is running"
- Vuelve a intentar

### Error: "Puerto 3000 ya está en uso"
- Cierra otras aplicaciones que puedan usar el puerto 3000
- O cambia el puerto en el archivo `package.json`

### Error: "API Key inválida"
- Verifica que copiaste correctamente las API keys
- Asegúrate de que las cuentas de OpenAI/Gemini tengan créditos

### La aplicación se ve rota o sin estilos
- Ejecuta: `npm run build`
- Luego: `npm run dev`

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas:
1. Revisa esta guía paso a paso
2. Verifica que Docker Desktop esté ejecutándose
3. Asegúrate de que las API keys sean correctas
4. Reinicia la aplicación: `Ctrl+C` y luego `npm run dev`

## 🎯 Próximos Pasos

Una vez que tengas el sistema funcionando:
1. **Configura tus redes sociales** reales
2. **Crea tus propios clientes** y campañas
3. **Experimenta con diferentes tipos de contenido**
4. **Programa publicaciones** reales
5. **Analiza los resultados**

¡Disfruta explorando Postia SaaS! 🚀