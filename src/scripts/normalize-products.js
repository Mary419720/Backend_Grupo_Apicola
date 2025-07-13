/**
 * Script para normalizar productos existentes y añadir campos normalizados
 * 
 * Ejecutar con: node normalize-products.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Obtener conexión a la base de datos
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error al conectar con MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Función para normalizar texto (eliminar acentos)
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Actualizar productos con campos normalizados
const updateProducts = async () => {
  // Importamos el modelo aquí para evitar errores de modelo no registrado
  const Product = require('../models/product');
  
  try {
    console.log('Iniciando actualización de productos...');
    
    // Obtener todos los productos (incluidos los eliminados lógicamente)
    const products = await Product.find({});
    console.log(`Se encontraron ${products.length} productos para actualizar.`);
    
    let updatedCount = 0;
    
    // Actualizar cada producto
    for (const product of products) {
      // Normalizar campos principales
      product.nombre_normalizado = normalizeText(product.nombre);
      product.codigo_normalizado = normalizeText(product.codigo);
      product.descripcion_normalizada = normalizeText(product.descripcion);
      
      // Normalizar presentaciones
      if (Array.isArray(product.presentaciones)) {
        product.presentaciones.forEach(presentacion => {
          if (presentacion.sku) {
            presentacion.sku_normalizado = normalizeText(presentacion.sku);
          }
          if (presentacion.formato) {
            presentacion.formato_normalizado = normalizeText(presentacion.formato);
          }
          if (presentacion.capacidad) {
            presentacion.capacidad_normalizada = normalizeText(presentacion.capacidad);
          }
        });
      }
      
      // Guardar el producto actualizado
      await product.save();
      updatedCount++;
      
      // Mostrar progreso cada 10 productos
      if (updatedCount % 10 === 0) {
        console.log(`${updatedCount}/${products.length} productos actualizados...`);
      }
    }
    
    console.log(`¡Completado! Se actualizaron ${updatedCount} productos con campos normalizados.`);
  } catch (error) {
    console.error('Error al actualizar productos:', error);
  }
};

// Ejecutar la migración
const runMigration = async () => {
  const conn = await connectDB();
  await updateProducts();
  
  console.log('Migración completada. Cerrando conexión...');
  await mongoose.connection.close();
  process.exit(0);
};

// Iniciar la migración
runMigration();
