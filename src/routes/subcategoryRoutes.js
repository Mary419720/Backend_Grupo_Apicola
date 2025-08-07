const express = require('express');
const router = express.Router();
const { getSubcategories } = require('../controllers/subcategoryController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/subcategories
// @route   GET /api/subcategories?category=categoryId
// Se aplica el middleware 'protect' para asegurar que solo usuarios autenticados puedan acceder.
router.route('/').get(protect, getSubcategories);

module.exports = router;
