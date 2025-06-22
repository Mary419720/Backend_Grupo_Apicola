const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

// Cargar modelos
const Category = require('../src/models/Category');
const Subcategory = require('../src/models/Subcategory');

// Conectar a la base de datos
if (!process.env.MONGODB_URI) {
    console.error('Error Crítico: La variable de entorno MONGODB_URI no está definida. Revisa tu archivo .env en la raíz del backend.');
    process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI);

// Leer el archivo JSON
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'Archivos_para_la_BD', 'categorias_apicolas (1).json'), 'utf-8')
);

// Importar datos a la BD
const importData = async () => {
  try {
    // Limpiar datos existentes
    await Category.deleteMany();
    await Subcategory.deleteMany();

    console.log('Datos antiguos eliminados...');

    for (const item of data) {
      // Crear la categoría
      const category = await Category.create({ nombre: item.categoria });
      console.log(`Categoría creada: ${category.nombre}`);

      // Crear las subcategorías asociadas
      if (item.subcategorias && item.subcategorias.length > 0) {
        const subcategoriesToCreate = item.subcategorias.map(subName => ({
          nombre: subName,
          category: category._id
        }));
        await Subcategory.insertMany(subcategoriesToCreate);
        console.log(`  - ${item.subcategorias.length} subcategorías insertadas para ${category.nombre}`);
      }
    }

    console.log('¡Datos importados exitosamente!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Eliminar datos de la BD
const deleteData = async () => {
  try {
    await Category.deleteMany();
    await Subcategory.deleteMany();
    console.log('¡Datos eliminados exitosamente!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Lógica para ejecutar desde la línea de comandos
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Por favor, usa el flag -i para importar o -d para eliminar los datos.');
  process.exit();
}
