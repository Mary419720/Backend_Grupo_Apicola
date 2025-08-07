const User = require('../models/user');
const Product = require('../models/product.js'); // Asegúrate que la ruta y el nombre del modelo son correctos
const asyncHandler = require('../middleware/asyncHandler'); // Middleware para manejar errores asíncronos

// @desc    Añadir un producto a favoritos
// @route   POST /api/favorites
// @access  Private
exports.addFavorite = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  // Verificar que el producto exista
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  }

  // Añadir a favoritos si no está ya en la lista
  if (!user.favorites.includes(productId)) {
    user.favorites.push(productId);
    await user.save();
  }

  res.status(200).json({ success: true, data: user.favorites });
});

// @desc    Eliminar un producto de favoritos
// @route   DELETE /api/favorites/:productId
// @access  Private
exports.removeFavorite = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  user.favorites = user.favorites.filter(
    (favId) => favId.toString() !== productId
  );

  await user.save();

  res.status(200).json({ success: true, data: user.favorites });
});

// @desc    Obtener los productos favoritos del usuario
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('favorites');

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  res.status(200).json({ success: true, data: user.favorites });
});

// @desc    Sincronizar favoritos desde localStorage
// @route   POST /api/favorites/sync
// @access  Private
exports.syncFavorites = asyncHandler(async (req, res, next) => {
  const { favorites: favoriteIds } = req.body;

  if (!Array.isArray(favoriteIds)) {
    return res.status(400).json({ success: false, message: 'Favoritos debe ser un array de Ids' });
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  }

  // Filtrar para obtener solo los IDs que no están ya en los favoritos del usuario
  const newFavorites = favoriteIds.filter(
    (favId) => !user.favorites.some(existingFav => existingFav.toString() === favId)
  );

  if (newFavorites.length > 0) {
    user.favorites.push(...newFavorites);
    await user.save();
  }

  res.status(200).json({ success: true, message: 'Favoritos sincronizados correctamente', data: user.favorites });
});
