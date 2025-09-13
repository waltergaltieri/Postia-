@echo off
chcp 65001 >nul
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 POSTIA SaaS INSTALLER                  ║
echo ║              Instalación Automática Simplificada            ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Verificar si estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontró package.json
    echo    Asegúrate de ejecutar este script desde el directorio postia-saas
    pause
    exit /b 1
)

echo ✅ Directorio correcto detectado
echo.

REM Verificar si Docker está instalado
echo 🔍 Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado o no está en el PATH
    echo.
    echo 📥 Por favor instala Docker Desktop desde:
    echo    https://www.docker.com/products/docker-desktop
    echo.
    echo    Después de instalar Docker, reinicia tu computadora y ejecuta este script nuevamente.
    pause
    exit /b 1
)
echo ✅ Docker encontrado

REM Verificar si Node.js está instalado
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo.
    echo 📥 Por favor instala Node.js desde:
    echo    https://nodejs.org (versión LTS recomendada)
    echo.
    echo    Después de instalar Node.js, ejecuta este script nuevamente.
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

REM Verificar si npm está disponible
echo 🔍 Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no está disponible
    echo    npm debería venir con Node.js. Reinstala Node.js.
    pause
    exit /b 1
)
echo ✅ npm encontrado
echo.

echo 🔧 Iniciando instalación...
echo.

REM Crear archivo .env si no existe
if not exist ".env" (
    echo 📝 Creando archivo de configuración...
    copy ".env.example" ".env" >nul
    if errorlevel 1 (
        echo ❌ Error al crear archivo .env
        pause
        exit /b 1
    )
    echo ✅ Archivo .env creado
) else (
    echo ✅ Archivo .env ya existe
)

REM Instalar dependencias
echo 📦 Instalando dependencias de Node.js...
echo    (Esto puede tomar varios minutos)
npm install
if errorlevel 1 (
    echo ❌ Error al instalar dependencias
    echo    Intenta ejecutar: npm install --force
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

REM Iniciar servicios de Docker
echo 🐳 Iniciando servicios de base de datos...
docker-compose up -d
if errorlevel 1 (
    echo ❌ Error al iniciar Docker services
    echo    Asegúrate de que Docker Desktop esté ejecutándose
    pause
    exit /b 1
)
echo ✅ Servicios de Docker iniciados

REM Esperar un poco para que los servicios se inicien
echo ⏳ Esperando que los servicios se inicialicen...
timeout /t 10 /nobreak >nul

REM Generar cliente Prisma
echo 🔨 Generando cliente de base de datos...
npx prisma generate
if errorlevel 1 (
    echo ❌ Error al generar cliente Prisma
    pause
    exit /b 1
)
echo ✅ Cliente de base de datos generado

REM Aplicar migraciones
echo 🗃️ Configurando base de datos...
npx prisma db push
if errorlevel 1 (
    echo ❌ Error al configurar base de datos
    pause
    exit /b 1
)
echo ✅ Base de datos configurada

REM Poblar base de datos con datos de prueba
echo 🌱 Poblando base de datos con datos de prueba...
npx prisma db seed
if errorlevel 1 (
    echo ❌ Error al poblar base de datos
    echo    Esto no es crítico, puedes continuar
) else (
    echo ✅ Datos de prueba agregados
)
echo.

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🎉 ¡INSTALACIÓN COMPLETA!                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📋 PRÓXIMOS PASOS:
echo.
echo 1. 🔑 Configura tus API Keys en el archivo .env:
echo    - Abre el archivo .env con el Bloc de notas
echo    - Reemplaza "tu_openai_api_key_aqui" con tu clave de OpenAI
echo    - Reemplaza "tu_gemini_api_key_aqui" con tu clave de Gemini
echo.
echo 2. 🚀 Para iniciar la aplicación, ejecuta:
echo    npm run dev
echo.
echo 3. 🌐 Abre tu navegador y ve a:
echo    http://localhost:3000
echo.
echo 4. 🔐 Credenciales de prueba:
echo    Email: admin@demo-agency.com
echo    Contraseña: admin123
echo.
echo 📖 Para más información, lee el archivo GUIA-INSTALACION.md
echo.
echo ¿Quieres iniciar la aplicación ahora? (s/n)
set /p respuesta=
if /i "%respuesta%"=="s" (
    echo.
    echo 🚀 Iniciando Postia SaaS...
    echo    La aplicación se abrirá en http://localhost:3000
    echo    Presiona Ctrl+C para detener la aplicación
    echo.
    npm run dev
) else (
    echo.
    echo 👋 ¡Perfecto! Cuando estés listo, ejecuta: npm run dev
)

echo.
echo Presiona cualquier tecla para salir...
pause >nul