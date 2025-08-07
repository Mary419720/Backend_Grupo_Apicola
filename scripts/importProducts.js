const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Product = require('../src/models/product');

// Cargar variables de entorno desde el archivo .env en la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const productsDataPath = path.resolve(__dirname, '../data/products3.json');
const products = JSON.parse(fs.readFileSync(productsDataPath, 'utf-8'));

const importData = async () => {
  let connection;
  try {
    connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a la base de datos MongoDB.');

    let productsAdded = 0;
    let productsSkipped = 0;

    for (const productData of products) {
      // Verificar si un producto con el mismo código ya existe
      const existingProduct = await Product.findOne({ codigo: productData.codigo });

      if (existingProduct) {
        console.log(`-> Omitiendo: El producto con código '${productData.codigo}' ya existe.`);
        productsSkipped++;
      } else {
        // Convertir los IDs de string a ObjectId antes de crear
        productData.categoria_id = new mongoose.Types.ObjectId(productData.categoria_id);
        productData.subcategoria_id = new mongoose.Types.ObjectId(productData.subcategoria_id);

        await Product.create(productData);
        console.log(`=> Importado: Producto '${productData.nombre}' (${productData.codigo}).`);
        productsAdded++;
      }
    }

    console.log('\n---------------------------------');
    console.log(' RESUMEN DE LA IMPORTACIÓN');
    console.log('---------------------------------');
    console.log(`✅ Productos nuevos añadidos: ${productsAdded}`);
    console.log(`⏭️ Productos omitidos (ya existían): ${productsSkipped}`);
    console.log('---------------------------------\n');
    console.log('¡Importación de datos completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la importación de datos:', error);
    process.exit(1);
  } finally {
    // Asegurarse de que la conexión se cierre
    if (connection) {
      await mongoose.disconnect();
      console.log('Desconectado de la base de datos.');
    }
    process.exit();
  }
};

importData();
