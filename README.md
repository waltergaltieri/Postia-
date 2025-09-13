# Postia SaaS - Plataforma de Gestión de Contenido para Agencias

Una plataforma SaaS completa para agencias de marketing que permite gestionar clientes, generar contenido con IA, y automatizar publicaciones en redes sociales.

## 🚀 Características Principales

### Para Agencias
- **Gestión Multi-Cliente**: Administra múltiples clientes desde un dashboard centralizado
- **Facturación por Tokens**: Sistema de consumo basado en tokens con integración Stripe
- **Roles y Permisos**: Control granular de acceso para equipos
- **API Externa**: Permite a bots externos generar contenido

### Generación de Contenido IA
- **Dual AI Engine**: OpenAI GPT-4 + Google Gemini integrados
- **Generación de Texto**: Contenido optimizado para cada plataforma social
- **Generación de Imágenes**: BananaBanana powered by Gemini Vision
- **Múltiples Plataformas**: Twitter, LinkedIn, Facebook, Instagram
- **Plantillas Personalizables**: Prompts adaptados por cliente y marca
- **Versionado de Contenido**: Historial completo de versiones y cambios
- **Flujo de Aprobación**: Workflow configurable para revisión de contenido

### Automatización
- **Programación de Publicaciones**: Calendario integrado para planificar posts
- **Campañas Multi-Plataforma**: Gestión centralizada de campañas
- **Integración Social Media**: Conexión directa con APIs de redes sociales
- **Monitoreo y Analytics**: Métricas detalladas de rendimiento

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Cache**: Redis
- **Autenticación**: NextAuth.js
- **Pagos**: Stripe
- **IA**: OpenAI GPT-4 + Google Gemini (BananaBanana para imágenes)
- **Deployment**: Vercel
- **Monitoreo**: Sentry
- **Testing**: Jest, Playwright, Testing Library

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- npm o yarn

## 🚀 Instalación y Configuración

### Instalación Automática (Recomendada)

#### Windows
```cmd
cd postia-saas
scripts\setup.bat
```

#### Mac/Linux
```bash
cd postia-saas
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Instalación Manual

#### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd postia-saas
```

#### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
```

**⚠️ IMPORTANTE**: Edita el archivo `.env` con tus API keys:

```env
# ⚠️ CONFIGURA TUS PROPIAS API KEYS
OPENAI_API_KEY="tu_openai_api_key_aqui"
GEMINI_API_KEY="tu_gemini_api_key_aqui"

# Base de datos (Docker se encarga automáticamente)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postia_dev"
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="postia-development-secret-key-2024"

# 🔧 PENDIENTES DE CONFIGURAR (opcionales para desarrollo)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
STRIPE_SECRET_KEY="sk_test_tu-clave-stripe"
```

#### 3. Instalar Dependencias
```bash
npm install
```

#### 4. Iniciar Base de Datos (Docker)
```bash
docker-compose up postgres redis -d
```

#### 5. Configurar Base de Datos
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

#### 6. Iniciar Desarrollo
```bash
npm run dev
```

### 🎯 Acceso Rápido

- **Aplicación**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (ejecutar `npm run db:studio`)
- **Documentación API**: http://localhost:3000/api/external/bot/docs

### 👤 Credenciales Demo

- **Email**: admin@demo.com
- **Cliente Demo**: Demo Client Corp
- **Campaña Demo**: Q1 2024 Social Media Campaign

## 🐳 Desarrollo con Docker

### Iniciar todos los servicios
```bash
docker-compose up -d
```

### Solo base de datos y cache
```bash
docker-compose up postgres redis -d
```

### Incluir Prisma Studio
```bash
docker-compose --profile tools up -d
```

## 🧪 Testing

### Tests Unitarios
```bash
# Ejecutar tests
npm run test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:ci
```

### Tests E2E
```bash
# Instalar navegadores
npx playwright install

# Ejecutar tests E2E
npm run test:e2e

# Tests E2E con UI
npm run test:e2e:ui
```

### Tests de Performance
```bash
# Lighthouse CI
npm run test:lighthouse

# Load testing con Artillery
npm install -g artillery
npm run test:load
```

## 📊 Monitoreo y Observabilidad

### Health Checks
```bash
# Verificar salud de la base de datos
npm run db:health-check

# Endpoint de salud de la API
curl http://localhost:3000/api/health
```

### Logs y Métricas
- **Aplicación**: Logs estructurados con Winston
- **Errores**: Monitoreo con Sentry
- **Performance**: Métricas con Vercel Analytics
- **Uptime**: Monitoreo de disponibilidad

## 🔐 Seguridad

### Autenticación y Autorización
- OAuth 2.0 con Google
- Verificación de email obligatoria
- Roles basados en permisos (ADMIN, USER, CLIENT)
- API Keys para acceso externo

### Protección de APIs
- Rate limiting por IP y usuario
- Validación de entrada con Zod
- Sanitización de datos
- Headers de seguridad

### Auditoría
- Log completo de acciones de usuarios
- Trazabilidad de cambios en contenido
- Monitoreo de accesos a APIs

## 📈 Escalabilidad

### Arquitectura
- **Stateless**: Aplicación sin estado para escalado horizontal
- **Cache**: Redis para sesiones y datos frecuentes
- **Queue**: Sistema de colas para tareas pesadas
- **CDN**: Assets estáticos servidos por Vercel Edge

### Performance
- **SSR/SSG**: Renderizado optimizado con Next.js
- **Code Splitting**: Carga lazy de componentes
- **Image Optimization**: Optimización automática de imágenes
- **Database**: Índices optimizados y queries eficientes

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker Production
```bash
# Build imagen
docker build -t postia-saas .

# Run container
docker run -p 3000:3000 postia-saas
```

### Variables de Entorno Producción
Asegúrate de configurar todas las variables necesarias en tu plataforma de deployment:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- Credenciales OAuth
- Configuración de monitoreo

## 📚 API Documentation

### Endpoints Principales

#### Autenticación
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual

#### Contenido
- `POST /api/content/generate` - Generar contenido con IA
- `GET /api/content/jobs/{id}` - Obtener trabajo de generación
- `POST /api/content/jobs/{id}/regenerate` - Regenerar contenido

#### Campañas
- `GET /api/campaigns` - Listar campañas
- `POST /api/campaigns` - Crear campaña
- `GET /api/campaigns/{id}/calendar` - Calendario de campaña

#### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `GET /api/clients/{id}/api-keys` - API keys del cliente

#### API Externa (Bot)
- `POST /api/external/bot/generate` - Generar contenido (API externa)
- `GET /api/external/bot/jobs/{id}` - Estado del trabajo
- `GET /api/external/bot/docs` - Documentación de la API

### Autenticación API Externa
```bash
# Usar API Key en header
curl -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Create a post about AI"}' \
     https://your-domain.com/api/external/bot/generate
```

## 🤝 Contribución

### Flujo de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código
- **Linting**: ESLint + Prettier
- **Tipos**: TypeScript estricto
- **Tests**: Cobertura mínima 70%
- **Commits**: Conventional Commits

### CI/CD Pipeline
- ✅ Linting y type checking
- ✅ Tests unitarios e integración
- ✅ Security scanning
- ✅ Performance testing
- ✅ Deployment automático

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

### Documentación
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Architecture Overview](./docs/architecture.md)

### Contacto
- **Issues**: [GitHub Issues](https://github.com/your-org/postia-saas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/postia-saas/discussions)
- **Email**: support@postia.com

---

**Postia SaaS** - Potenciando agencias de marketing con IA 🚀