# API de Conteo de Calorías con IA

API para una aplicación de conteo de calorías que utiliza inteligencia artificial para reconocer alimentos en imágenes y proporcionar información nutricional.

## Características

- Reconocimiento de alimentos en imágenes utilizando Google Cloud Vision API
- Información nutricional detallada utilizando Nutritionix API
- Búsqueda de alimentos por nombre o descripción
- Optimizado para despliegue en Vercel

## Requisitos

- Node.js 18 o superior
- Cuenta en Google Cloud con Vision API habilitada
- Cuenta en Nutritionix

## Instalación

1. Clona este repositorio
2. Instala las dependencias: `npm install`
3. Copia `.env.example` a `.env` y configura tus variables de entorno
4. Ejecuta en desarrollo: `npm run dev`

## Despliegue en Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Configura las variables de entorno en el dashboard de Vercel

## Endpoints de la API

### Análisis de Alimentos

- `POST /api/food/analyze` - Analiza una imagen para identificar alimentos
- `GET /api/food/search` - Busca alimentos por nombre o descripción
- `GET /api/food/nutrition/:foodName` - Obtiene información nutricional para un alimento específico

### Usuarios (Implementación básica)

- `POST /api/users/register` - Registra un nuevo usuario
- `POST /api/users/login` - Inicia sesión de un usuario
- `GET /api/users/profile` - Obtiene el perfil del usuario actual

## Licencia

MIT
\`\`\`

## Instrucciones para Ejecutar el Proyecto

1. **Crea todos los archivos** mostrados anteriormente en la estructura de carpetas indicada.

2. **Crea un archivo `.env`** basado en el `.env.example` y configura tus claves de API:
   \`\`\`
   PORT=5000
   NODE_ENV=development
   GOOGLE_CLOUD_VISION_API_KEY=tu_clave_de_google_cloud_vision
   NUTRITIONIX_APP_ID=tu_app_id_de_nutritionix
   NUTRITIONIX_API_KEY=tu_clave_de_api_de_nutritionix
   \`\`\`

3. **Instala las dependencias**:
   \`\`\`bash
   npm install
   \`\`\`

4. **Ejecuta en modo desarrollo**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Para desplegar en Vercel**:
   \`\`\`bash
   npm i -g vercel
   vercel
   \`\`\`

# Archivos HTTP para pruebas de API

Este directorio contiene archivos `.http` que te permiten probar las APIs directamente desde tu editor de código.

## Requisitos

Para usar estos archivos, necesitas una de las siguientes extensiones:

- **VS Code**: [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- **IntelliJ IDEA/WebStorm**: Soporte nativo para archivos HTTP

## Cómo usar

1. Abre el archivo `.http` correspondiente a la API que quieres probar
2. Haz clic en "Send Request" que aparece encima de cada petición
3. Verás la respuesta en una nueva pestaña

## Variables

Los archivos usan variables para facilitar las pruebas:

- `@baseUrl`: URL base de la API
- `@contentType`: Tipo de contenido para las peticiones
- `@userId`: ID de usuario para pruebas (debes reemplazarlo con un ID real)

## Flujo de prueba recomendado

1. Ejecuta primero la petición "Crear un nuevo usuario"
2. Copia el ID del usuario creado
3. Reemplaza la variable `@userId` con el ID copiado
4. Prueba las demás peticiones

## Ejemplo

```http
@baseUrl = http://localhost:3000/api
@contentType = application/json
@userId = 123e4567-e89b-12d3-a456-426614174000

### Obtener un usuario por ID
GET {{baseUrl}}/users/{{userId}}
Content-Type: {{contentType}}