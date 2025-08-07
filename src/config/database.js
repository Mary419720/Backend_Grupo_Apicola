const mongoose = require('mongoose');

// Escuchas de eventos de Mongoose para depuración avanzada
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose conectado exitosamente al cluster.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose error de conexión: \n${err.stack}`);
  process.exit(1);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado.');
});

const connectDB = async () => {
  const dbURI = process.env.MONGODB_URI;

  if (!dbURI) {
    console.error('CRITICAL ERROR: La variable MONGODB_URI no se encontró en el archivo .env');
    process.exit(1);
  }

  console.log('Iniciando conexión a MongoDB Atlas...');
    // Opciones de conexión (puedes añadir serverSelectionTimeoutMS aquí si lo deseas para futuras depuraciones)
  // const options = {
  //   serverSelectionTimeoutMS: 10000 // Ejemplo: 10 segundos 
  // };
  await mongoose.connect(dbURI /*, options */);
};

module.exports = connectDB;
