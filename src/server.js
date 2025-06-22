// 1. Importar dependencias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const path = require('path');

// 2. Configuración de la aplicación
const app = express();
const PORT = process.env.PORT || 3001;

// 3. Middlewares
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:4200'];
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin 'origin' (como las de Postman o apps móviles) o si el origen está en la lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origen no permitido'));
    }
  },
  credentials: true // Si necesitas enviar cookies o encabezados de autorización
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 4. Rutas
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);

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