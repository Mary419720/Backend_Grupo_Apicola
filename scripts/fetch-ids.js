const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Cargar modelos
const Category = require('../src/models/Category');
const Subcategory = require('../src/models/Subcategory');

// Función de conexión a la BD
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('La variable de entorno MONGODB_URI no está definida.');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error(`Error de conexión: ${err.message}`);
    process.exit(1);
  }
};

const fetchAndDisplayIds = async () => {
  console.log('Conectando a la base de datos...');
  await connectDB();
  console.log('Conexión exitosa. Obteniendo datos...\n');

  try {
    // Obtener todas las categorías
    const categories = await Category.find({}, 'nombre');
    if (categories.length === 0) {
      console.log('No se encontraron categorías en la base de datos.');
    } else {
      console.log('--- CATEGORÍAS ---');
      categories.forEach(cat => {
        console.log(`Nombre: ${cat.nombre}`);
        console.log(`  _id: ${cat._id}\n`);
      });
    }

    // Obtener todas las subcategorías y poblarlas con el nombre de la categoría padre
    const subcategories = await Subcategory.find({}, 'nombre category').populate('category', 'nombre');
    if (subcategories.length === 0) {
      console.log('No se encontraron subcategorías en la base de datos.');
    } else {
      console.log('\n--- SUBCATEGORÍAS ---');
      subcategories.forEach(sub => {
        const categoryName = sub.category ? sub.category.nombre : 'SIN CATEGORÍA ASIGNADA';
        console.log(`Nombre: ${sub.nombre} (Categoría: ${categoryName})`);
        console.log(`  _id: ${sub._id}\n`);
      });
    }

  } catch (error) {
    console.error(`Error al obtener los datos: ${error.message}`);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada.');
    process.exit();
  }
};

fetchAndDisplayIds();
