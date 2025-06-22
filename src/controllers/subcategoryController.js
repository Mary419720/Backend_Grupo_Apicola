const Subcategory = require('../models/Subcategory');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Obtener todas las subcategorías, con opción de filtrar por categoría padre
// @route   GET /api/subcategories?category=categoryId
// @access  Público (o Privado, según se necesite)
exports.getSubcategories = asyncHandler(async (req, res, next) => {
  let query;

  // Si se proporciona un ID de categoría en la consulta, filtramos por él
  if (req.query.category) {
    query = Subcategory.find({ category: req.query.category });
  } else {
    // Si no, devolvemos todas las subcategorías
    query = Subcategory.find();
  }

  const subcategories = await query.populate('category', 'nombre'); // Opcional: trae el nombre de la categoría padre

  res.status(200).json({
    success: true,
    count: subcategories.length,
    data: subcategories
  });
});
