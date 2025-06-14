const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Necesitaremos bcryptjs aquí

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true, // Asegura que no haya correos duplicados
    lowercase: true, // Guarda los correos en minúsculas para consistencia
    trim: true,
    // Validación simple de formato de email
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Por favor, introduce un correo electrónico válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false, // Por defecto, no se devuelve la contraseña en las consultas
  },
  rol: {
    type: String,
    required: true,
    enum: ['administrador', 'visitante'], // Roles permitidos
    default: 'visitante', // Rol por defecto al registrarse
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  // Podrías añadir más campos si los necesitas, como:
  // telefono: String,
  // direccion: String,
  // activo: { type: Boolean, default: true },
});

// Middleware (hook) de Mongoose: Hashear la contraseña ANTES de guardar (si se ha modificado)
userSchema.pre('save', async function (next) {
  // Solo hashear la contraseña si ha sido modificada (o es nueva)
  if (!this.isModified('password')) {
    return next();
  }
  // Generar un "salt" y hashear la contraseña
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar la contraseña ingresada con la almacenada (hasheada)
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;