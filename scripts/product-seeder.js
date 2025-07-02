const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// --- Rutas ajustadas para funcionar desde la carpeta /scripts ---
// Cargar variables de entorno desde la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Cargar modelos subiendo un nivel en el directorio
const Product = require('../src/models/product');
const Category = require('../src/models/Category');
const Subcategory = require('../src/models/Subcategory');

// Función de conexión a la BD
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('La variable de entorno MONGODB_URI no está definida. Revisa tu archivo .env');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Conectado para el seeder de productos...');
  } catch (err) {
    console.error(`Error de conexión: ${err.message}`);
    process.exit(1);
  }
};

// Leer el archivo JSON de productos
const productsJSONPath = path.resolve(__dirname, '../data/products.json');
if (!fs.existsSync(productsJSONPath)) {
  console.error(`Error: No se encuentra el archivo en ${productsJSONPath}. Asegúrate de que 'backend/data/products.json' existe.`);
  process.exit(1);
}
const products = JSON.parse(fs.readFileSync(productsJSONPath, 'utf-8'));

// Importar datos a la BD
const importData = async () => {
  await connectDB();
  try {
    console.log('Validando IDs de categorías y subcategorías...');
    for (const product of products) {
      if (!mongoose.Types.ObjectId.isValid(product.categoria_id) || !await Category.findById(product.categoria_id)) {
        throw new Error(`El ID de categoría '${product.categoria_id}' para el producto '${product.nombre}' no es válido o no existe.`);
      }
      if (!mongoose.Types.ObjectId.isValid(product.subcategoria_id) || !await Subcategory.findById(product.subcategoria_id)) {
        throw new Error(`El ID de subcategoría '${product.subcategoria_id}' para el producto '${product.nombre}' no es válido o no existe.`);
      }
    }
    console.log('Validación completada. Importando productos...');
    
    // Opcional: Limpiar la colección antes de importar.
    // await Product.deleteMany();
    // console.log('Productos existentes eliminados.');

    await Product.insertMany(products);
    console.log('¡Productos importados correctamente!');
  } catch (error) {
    console.error(`Error al importar datos: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
    process.exit();
  }
};

// Eliminar datos de la BD
const deleteData = async () => {
  await connectDB();
  try {
    await Product.deleteMany();
    console.log('¡Todos los productos han sido eliminados!');
  } catch (error) {
    console.error(`Error al eliminar datos: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
    process.exit();
  }
};

// Lógica para ejecutar desde la línea de comandos
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Por favor, usa los flags -i para importar o -d para eliminar los datos de los productos.');
  process.exit();
}
