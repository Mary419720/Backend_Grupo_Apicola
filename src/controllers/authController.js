const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Función auxiliar para generar un token JWT
const generateToken = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
    expiresIn: '1d', // El token expirará en 1 día
  });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  const { name, email, password, rol } = req.body;

  try {
    // 1. Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // 2. Crear el nuevo usuario
    // La contraseña se hashea automáticamente gracias al middleware en el modelo User.js
    const user = await User.create({
      name,
      email,
      password,
      rol: 'visitante', // Forzamos el rol a 'visitante'
    });

    // 3. Generar token y enviar respuesta
    if (user) {
      const token = generateToken(user._id, user.rol);
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          rol: user.rol,
        },
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error('Error en registerUser:', error);
    next(error); // Pasa el error al middleware de manejo de errores
  }
};

// @desc    Autenticar (iniciar sesión) un usuario
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Validar que email y contraseña existan
    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor, proporcione email y contraseña' });
    }

    // 2. Buscar al usuario y seleccionar explícitamente la contraseña
    const user = await User.findOne({ email }).select('+password');

    // 3. Si el usuario existe y la contraseña es correcta
    if (user && (await user.comparePassword(password))) {
      // Actualizar la fecha de último login
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false }); // Guardar sin re-validar todo

      const token = generateToken(user._id, user.rol);
      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          rol: user.rol,
        },
      });
    } else {
      // Si el usuario no existe o la contraseña es incorrecta
      res.status(401).json({ message: 'Email o contraseña inválidos' });
    }
  } catch (error) {
    console.error('Error en loginUser:', error);
    next(error);
  }
};
