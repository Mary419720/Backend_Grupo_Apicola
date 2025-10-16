# Backend - Grupo Apícola API

API REST robusta y escalable para el sistema de gestión del Grupo Apícola. Construida con Node.js, Express y MongoDB.

## 🚀 Tecnologías

- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MongoDB Atlas** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación y autorización
- **bcryptjs** - Hash de contraseñas
- **Multer** - Subida de archivos/imágenes

## 📋 Requisitos Previos

- Node.js v16 o superior
- npm o yarn
- Cuenta de MongoDB Atlas (o instancia de MongoDB)

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
cd backend/Backend_Grupo_Apicola
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales reales
```

4. **Variables de entorno requeridas** (ver `.env.example`):
   - `MONGODB_URI` - URL de conexión a MongoDB
   - `PORT` - Puerto del servidor (default: 3001)
   - `JWT_SECRET` - Secreto para tokens JWT
   - `FRONTEND_URL` - URL del frontend (para CORS)
   - `NODE_ENV` - Entorno (development/production)

## 🏃 Ejecución

### Modo Desarrollo (con auto-reload)
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

### Scripts de Datos
```bash
# Importar datos de prueba
npm run data:import

# Limpiar base de datos
npm run data:destroy

# Crear usuario administrador
npm run seed:admin
```

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuración de base de datos
├── controllers/     # Lógica de negocio
├── middleware/      # Middleware de autenticación, upload, etc.
├── models/          # Modelos de datos (Mongoose schemas)
├── routes/          # Definición de rutas de la API
└── server.js        # Punto de entrada de la aplicación

public/
└── uploads/         # Archivos subidos (imágenes de productos)

scripts/             # Scripts de utilidad y seeding
```

## 🔐 Seguridad

- Autenticación con **JWT**
- Contraseñas hasheadas con **bcrypt**
- Control de acceso basado en roles (RBAC)
- **CORS** configurado
- Validación de datos con Mongoose

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login

### Productos
- `GET /api/products` - Listar productos (paginado, filtros)
- `GET /api/products/:id` - Detalle de producto
- `POST /api/products` - Crear producto (Admin)
- `PUT /api/products/:id` - Actualizar producto (Admin)
- `DELETE /api/products/:id` - Eliminar producto (Admin)

### Categorías
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear categoría (Admin)

### Ventas
- `POST /api/sales` - Registrar venta
- `GET /api/sales` - Historial de ventas (Admin)

### Favoritos
- `GET /api/favorites` - Lista de favoritos del usuario
- `POST /api/favorites/:productId` - Agregar a favoritos
- `DELETE /api/favorites/:productId` - Quitar de favoritos

## 🚀 Despliegue

### Plataformas Recomendadas
- **Render** (recomendado)
- **Railway**
- **Heroku**
- **AWS EC2 / DigitalOcean**

### Consideraciones para Producción
1. Configurar todas las variables de entorno en el hosting
2. Asegurar que MongoDB Atlas permita la IP del servidor
3. Actualizar `FRONTEND_URL` con el dominio real del frontend
4. Configurar `NODE_ENV=production`
5. (Opcional) Usar PM2 para gestión de procesos

### Ejemplo con Render
1. Crear Web Service en render.com
2. Conectar repositorio
3. Configurar:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend/Backend_Grupo_Apicola`
4. Agregar variables de entorno
5. Deploy

## 📚 Documentación Completa

Para más detalles sobre la arquitectura, funcionalidades y patrones de diseño, consulta el documento:
- **[INFORME_BACKEND.md](../../INFORME_BACKEND.md)** (540 líneas de documentación técnica completa)

## 🤝 Soporte

Para problemas o preguntas, revisa primero la documentación completa en `INFORME_BACKEND.md`.

---

**Estado**: ✅ Producción Ready
**Versión**: 1.0.0
