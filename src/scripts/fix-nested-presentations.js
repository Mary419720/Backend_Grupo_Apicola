/**
 * Script para corregir productos que tienen las presentaciones anidadas
 * incorrectamente dentro de 'atributos.presentaciones'.
 * 
 * Este script moverá las presentaciones al campo raíz 'presentaciones'
 * y limpiará el campo 'atributos'.
 * 
 * Ejecutar con: node src/scripts/fix-nested-presentations.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde el archivo .env en la raíz del backend
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Importar el modelo de Producto
const Product = require('../models/product');

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error al conectar con MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Función principal para migrar los datos
const migratePresentations = async () => {
  try {
    console.log('🚀 Iniciando migración de presentaciones anidadas...');

    // 1. Buscar productos con el problema: 'atributos.presentaciones' existe y tiene elementos.
    const problematicProducts = await Product.find({
      'atributos.presentaciones': { $exists: true, $ne: [] }
    });

    if (problematicProducts.length === 0) {
      console.log('✅ No se encontraron productos con presentaciones anidadas. ¡La base de datos está limpia!');
      return;
    }

    console.log(`🔍 Se encontraron ${problematicProducts.length} productos para corregir.`);

    let updatedCount = 0;

    // 2. Iterar sobre cada producto y corregirlo
    for (const product of problematicProducts) {
      console.log(`🔧 Corrigiendo producto: ${product.nombre} (ID: ${product._id})`);

      // Mover las presentaciones anidadas al campo raíz
      product.presentaciones = product.atributos.presentaciones;

      // Limpiar el campo 'atributos' eliminando la clave 'presentaciones'
      delete product.atributos.presentaciones;
      
      // Marcar el campo 'atributos' como modificado para que Mongoose lo guarde
      product.markModified('atributos');

      // Guardar el producto actualizado
      await product.save();
      updatedCount++;
      console.log(`  -> ¡Corregido!`);
    }

    console.log(`
🎉 ¡Migración completada! Se actualizaron ${updatedCount} productos.`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
};

// Función para ejecutar todo el proceso
const runMigration = async () => {
  await connectDB();
  await migratePresentations();
  
  console.log('🔌 Cerrando conexión a la base de datos...');
  await mongoose.connection.close();
  process.exit(0);
};

// Iniciar la migración
runMigration();
