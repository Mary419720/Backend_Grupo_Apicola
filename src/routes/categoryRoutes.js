const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/categories
// Ruta pública para permitir mostrar categorías sin autenticación
// Esto permite que el carrusel de productos y navegación pública funcionen correctamente
router.route('/').get(getAllCategories);

// Si en el futuro se necesitan rutas protegidas para administración de categorías,
// se pueden implementar aquí con el middleware 'protect'
// Ejemplo: router.route('/admin').post(protect, crearCategoria);

module.exports = router;
