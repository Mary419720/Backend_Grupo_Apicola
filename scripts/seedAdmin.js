// Este script crea un usuario administrador si no existe.
// Ejecútalo una vez para configurar tu primer administrador.
// USO: node scripts/seedAdmin.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/user');

// --- CONFIGURA AQUÍ LOS DATOS DE TU ADMINISTRADOR ---
const adminData = {
  name: 'Administrador Principal',
  email: 'admin@melarium.com', // <<< CAMBIA ESTE EMAIL
  password: 'melarium_admin88', // <<< CAMBIA ESTA CONTRASEÑA
  rol: 'administrador',
};
// ----------------------------------------------------

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB para el seeding...');
  } catch (err) {
    console.error(`❌ Error de conexión a MongoDB: ${err.message}`);
    process.exit(1);
  }
};

const seedAdminUser = async () => {
  await connectDB();

  try {
    // 1. Verificar si el usuario administrador ya existe
    const adminExists = await User.findOne({ email: adminData.email });

    if (adminExists) {
      console.log('ℹ️ El usuario administrador ya existe. No se necesita ninguna acción.');
      return;
    }

    // 2. Si no existe, crearlo
    console.log('Creando usuario administrador...');
    // Usamos User.create para que se active el hook de pre-save
    await User.create(adminData);

    console.log('✅ ¡Usuario administrador creado exitosamente!');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Contraseña: ${adminData.password} (¡Úsala para iniciar sesión!)`);

  } catch (error) {
    console.error('❌ Error al crear el usuario administrador:', error);
  } finally {
    // 3. Desconectar de la base de datos
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB.');
  }
};

seedAdminUser();
