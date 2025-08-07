const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rutas - verifica el token JWT
exports.protect = async (req, res, next) => {
  try {
    // Comprobar si la ruta es para productos y permitir acceso sin autenticación (solo para depuración)
    if (req.originalUrl.includes('/api/products') && req.method === 'GET') {
      console.log('Permitiendo acceso sin autenticación a la ruta de productos para depuración');
      return next();
    }
    
    let token;

    // Verificar si hay token en el header de Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta'
      });
    }

    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Añadir el usuario al request
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'El usuario ya no existe'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// Middleware para autorizar roles específicos
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.user.rol} no está autorizado para acceder a esta ruta`
      });
    }

    next();
  };
};
