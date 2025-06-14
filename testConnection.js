// Script simple para probar la conexión a MongoDB Atlas
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Script de prueba de conexión a MongoDB Atlas');
console.log(`MONGODB_URI disponible: ${process.env.MONGODB_URI ? 'Sí ✅' : 'NO ❌'}`);

// Registrar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose conectado exitosamente al cluster.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose error de conexión:`);
  console.error(err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado.');
});

// Función para probar la conexión
async function testConnection() {
  try {
    console.log('Intentando conectar a MongoDB Atlas...');

    // Opciones minimalistas
    const options = {
      serverSelectionTimeoutMS: 10000 // 10 segundos
    };
    
    // Intentar la conexión
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Si llegamos aquí, la conexión fue exitosa
    console.log('Conexión establecida correctamente.');
    
    // Crear una colección de prueba
    console.log('Intentando realizar una operación simple...');
    const testSchema = new mongoose.Schema({ name: String, test: Boolean });
    const TestModel = mongoose.model('TestCollection', testSchema);
    
    // Intentar crear un documento
    const testDoc = new TestModel({ name: 'Test Connection', test: true });
    await testDoc.save();
    console.log('✅ Operación exitosa! Documento guardado.');
    
    // Intentar leer documentos
    const count = await TestModel.countDocuments();
    console.log(`Documentos en la colección: ${count}`);
    
    // Mantener la conexión abierta
    console.log('Manteniendo la conexión abierta por 10 segundos...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Cerrar la conexión limpiamente
    await mongoose.disconnect();
    console.log('Conexión cerrada manualmente.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la prueba de conexión:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar la prueba
console.log('Iniciando prueba de conexión...');
testConnection().catch(err => {
  console.error('Error en la función principal:');
  console.error(err);
  process.exit(1);
});

// Mantener el proceso vivo
console.log('Script ejecutándose...');
