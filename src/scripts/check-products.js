const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

// Conexión a la base de datos
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/melarium')
  .then(() => console.log('✅ Conexión a MongoDB establecida correctamente'))
  .catch(err => {
    console.error('❌ Error al conectar con MongoDB:', err.message);
    process.exit(1);
  });

// Definir modelo de Producto (esquema simplificado)
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

// Función principal para analizar productos
async function checkProducts() {
  try {
    console.log('🔍 Buscando productos en la base de datos...');
    
    // Obtener todos los productos
    const products = await Product.find().lean();
    
    console.log(`\n📊 ESTADÍSTICAS DE PRODUCTOS:`);
    console.log(`- Total de productos: ${products.length}`);
    
    if (products.length === 0) {
      console.log('⚠️ No hay productos en la base de datos');
      return closeConnection();
    }
    
    // Analizar campos presentes en los productos
    const fieldsCount = {};
    products.forEach(product => {
      Object.keys(product).forEach(field => {
        fieldsCount[field] = (fieldsCount[field] || 0) + 1;
      });
    });
    
    console.log('\n📋 CAMPOS ENCONTRADOS EN PRODUCTOS:');
    Object.entries(fieldsCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        const percentage = Math.round((count / products.length) * 100);
        console.log(`- ${field}: presente en ${count}/${products.length} productos (${percentage}%)`);
      });
    
    // Analizar el primer producto en detalle
    const firstProduct = products[0];
    console.log('\n🔎 DETALLE DEL PRIMER PRODUCTO:');
    console.log(JSON.stringify(firstProduct, null, 2));
    
    // Analizar estructura de categorías
    console.log('\n🏷️ ANÁLISIS DE CATEGORÍAS:');
    const categoriesTypes = {};
    products.forEach(product => {
      const type = product.categoria_id 
        ? typeof product.categoria_id === 'object' 
          ? 'ObjectId' 
          : typeof product.categoria_id
        : 'ausente';
      categoriesTypes[type] = (categoriesTypes[type] || 0) + 1;
    });
    console.log('Tipos de campos categoría_id encontrados:');
    Object.entries(categoriesTypes).forEach(([type, count]) => {
      console.log(`- ${type}: ${count} productos`);
    });
    
    // Analizar presentaciones o estado físico
    console.log('\n📦 ANÁLISIS DE PRESENTACIONES:');
    const presentationCount = products.filter(p => p.presentaciones && p.presentaciones.length > 0).length;
    const estadoFisicoCount = products.filter(p => p.estado_fisico).length;
    console.log(`- Productos con presentaciones: ${presentationCount}/${products.length}`);
    console.log(`- Productos con estado_fisico: ${estadoFisicoCount}/${products.length}`);
    
    // Analizar imágenes
    console.log('\n🖼️ ANÁLISIS DE IMÁGENES:');
    const imagesCount = products.filter(p => p.imagenes && p.imagenes.length > 0).length;
    console.log(`- Productos con imágenes: ${imagesCount}/${products.length}`);
    if (imagesCount > 0) {
      const sampleProduct = products.find(p => p.imagenes && p.imagenes.length > 0);
      if (sampleProduct) {
        console.log('- Ejemplo de URLs de imágenes:');
        sampleProduct.imagenes.forEach(img => console.log(`  * ${img}`));
      }
    }
    
    closeConnection();
    
  } catch (error) {
    console.error('❌ Error al analizar productos:', error);
    closeConnection(1);
  }
}

// Cerrar conexión a MongoDB
function closeConnection(code = 0) {
  console.log('\n👋 Cerrando conexión a MongoDB...');
  mongoose.connection.close();
  console.log('✅ Conexión cerrada correctamente');
  process.exit(code);
}

// Ejecutar función principal
checkProducts();
