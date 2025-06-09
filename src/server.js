// 1. Importar dependencias
require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 2. Configurar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3001; // Usa el puerto de .env o 3001 por defecto

// 3. Middlewares
app.use(cors()); // Permite solicitudes de diferentes orígenes (tu frontend Angular)
app.use(express.json()); // Permite al servidor entender JSON en las solicitudes
app.use(express.urlencoded({ extended: true })); // Permite al servidor entender datos de formularios URL-encoded

// --- INICIO DE CAMBIOS ---

// Importar nuestras nuevas rutas
const testRoutes = require('./routes/testRoutes');

// 4. Conexión a MongoDB Atlas
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  console.error('Error: MONGODB_URI no está definida en el archivo .env');
  process.exit(1); // Termina la aplicación si no hay URI
}

mongoose.connect(dbURI)
  .then(() => {
    console.log(`Conexión a MongoDB Atlas exitosa! Conectado a la base de datos: ${mongoose.connection.name}`);
    
    // 5. Montar las Rutas de la Aplicación
    // Todas las rutas definidas en testRoutes.js estarán prefijadas con /api/test
    app.use('/api/test', testRoutes);

    // Ruta raíz simple (opcional, puedes quitarla si no la necesitas)
    app.get('/', (req, res) => {
      res.send('¡Bienvenido al API de Melariu Grupo Apícola! (Refactorizado)');
    });

    // Middleware de Manejo de Errores (debe ir DESPUÉS de tus rutas)
    // Si alguna ruta llama a next(error), este middleware lo capturará.
    app.use((err, req, res, next) => {
      console.error(err.stack); // Loguea el stack trace del error para depuración
      // Evita enviar el stack trace en producción por seguridad
      const statusCode = err.statusCode || 500; // Usa el código de estado del error o 500 por defecto
      const message = err.message || 'Algo salió mal en el servidor!';
      res.status(statusCode).json({ 
        status: 'error',
        message: message,
        // Solo incluir el stack en desarrollo
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // 6. Iniciar el servidor DESPUÉS de una conexión exitosa a la BD y configuración de rutas
    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB Atlas:', err.message);
    process.exit(1); // Termina la aplicación si la conexión falla
  });

// --- FIN DE CAMBIOS ---
// Ya no necesitamos las rutas de ejemplo que estaban aquí abajo.
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  console.log('DEBUG: app.listen callback completada. El servidor debería estar activo.');

  // Mantener el proceso vivo por unos segundos más para diagnóstico
  setTimeout(() => {
    console.log('DEBUG: setTimeout ejecutado. El proceso sigue vivo después de 5 segundos.');
  }, 5000);
});