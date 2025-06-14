// 1. Importar dependencias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

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

// 4. Rutas
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

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
    
    // Manejo de señales de terminación
    process.on('SIGINT', () => {
      console.log('👋 Cerrando servidor y conexión a la BD');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('✅ Conexiones cerradas correctamente');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

// 7. Iniciar la aplicación
startServer();