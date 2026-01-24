// 1. Importar dependencias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const saleRoutes = require('./routes/saleRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const path = require('path');

// 2. Configuración de la aplicación
const app = express();
const PORT = process.env.PORT || 3001;

// 3. Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200',
  'https://tumelarium.netlify.app',
  'https://68f172107791c200b38472c2--tumelarium.netlify.app',
  'http://localhost:8888', 
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin 'origin' (como las de Postman o apps móviles) o si el origen está en la lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origen no permitido'));
    }
  },
  credentials: true, // Permite el envío de cookies y cabeceras de autorización.
  allowedHeaders: ['Authorization', 'Content-Type'], // Cabeceras permitidas en las solicitudes.
  exposedHeaders: ['Content-Disposition'] // Exponer esta cabecera para descargas de archivos.
};
// Middleware de compresión GZIP
// Debe ir antes de cualquier ruta para asegurar que todas las respuestas se compriman
app.use(compression());

app.use(cors(corsOptions));

// Middlewares para parsear JSON y datos de formularios.
// Deben registrarse antes de las rutas que los utilizan.
app.use(express.json({ limit: '10mb' })); // Aumentar límite para posibles imágenes en base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 4. Rutas de la API
// Nota: Las rutas que manejan multipart/form-data (subida de archivos)
// deben usar un middleware específico como `multer` y no dependen de `express.json()`.
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes); // Ahora puede manejar JSON y multipart (con multer)
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/favorites', favoritesRoutes);

app.get('/', (req, res) => {
  res.send('¡Bienvenido al API de Melariu Grupo Apícola!');
});

// 5. Middleware de Manejo de Errores (debe ir al final)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Algo salió mal en el servidor.';
  res.status(statusCode).json({ 
    status: 'error',
    message: message,
  });
});

// 6. Función de inicio del servidor
const startServer = async () => {
  try {
    // Primero conecta a la BD
    await connectDB();
    
    // Luego inicia el servidor Express
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
      console.log(`📚 API disponible en http://localhost:${PORT}/api/test`);
    });
    
    // Manejo de señales de terminación para un cierre elegante
    process.on('SIGINT', async () => {
      console.log('👋 Recibida señal de interrupción. Cerrando servidor y conexión a la BD...');
      try {
        // Cierra el servidor y espera a que todas las conexiones existentes terminen
        await new Promise(resolve => server.close(resolve));
        console.log('✅ Servidor Express cerrado.');

        // Cierra la conexión a la base de datos
        await mongoose.connection.close();
        console.log('✅ Conexión a MongoDB cerrada correctamente.');
        
        process.exit(0);
      } catch (error) {
        console.error('❌ Error durante el cierre elegante:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

// 7. Iniciar la aplicación
startServer();