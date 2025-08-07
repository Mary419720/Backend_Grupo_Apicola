const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno ANTES que cualquier otra cosa
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ahora sí, cargar el resto de los módulos
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Subcategory = require('../src/models/Subcategory');

// Función principal asíncrona
async function run() {
  console.log('Iniciando script para obtener IDs...');

  try {
    // Conectar a la base de datos (sin opciones obsoletas y con timeout)
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000
    });
    console.log('Conexión a la base de datos exitosa.');

    // Obtener todas las categorías
    console.log('\n--- OBTENIENDO CATEGORÍAS ---');
    const categories = await Category.find({}, 'nombre');
    if (categories.length > 0) {
      categories.forEach(cat => {
        console.log(`Nombre: ${cat.nombre}\n  _id: ${cat._id}\n`);
      });
    } else {
      console.log('No se encontraron categorías.');
    }

    // Obtener todas las subcategorías
    console.log('\n--- OBTENIENDO SUBCATEGORÍAS ---');
    const subcategories = await Subcategory.find({}, 'nombre category').populate('category', 'nombre');
    if (subcategories.length > 0) {
      subcategories.forEach(sub => {
        const categoryName = sub.category ? sub.category.nombre : 'SIN CATEGORÍA';
        console.log(`Nombre: ${sub.nombre} (Categoría: ${categoryName})\n  _id: ${sub._id}\n`);
      });
    } else {
      console.log('No se encontraron subcategorías.');
    }

    console.log('\nScript finalizado exitosamente.');

  } catch (error) {
    console.error('\n--- ERROR EN LA EJECUCIÓN ---');
    console.error(error);
    process.exit(1); // Salir con código de error
  } finally {
    // Asegurar que la conexión se cierre
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}

// Ejecutar la función principal
run();
