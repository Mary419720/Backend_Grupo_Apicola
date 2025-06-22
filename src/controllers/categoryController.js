const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Obtener todas las categorías
// @route   GET /api/categories
// @access  Público (o Privado si se requiere autenticación)
exports.getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({});

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});
