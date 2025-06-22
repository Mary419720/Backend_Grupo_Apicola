const express = require('express');
const router = express.Router();
const { getAllCategories } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/categories
// Se aplica el middleware 'protect' para asegurar que solo usuarios autenticados puedan acceder.
router.route('/').get(protect, getAllCategories);

module.exports = router;
