const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Ruta para buscar productos
router.get('/search', productController.searchProducts);

// Rutas CRUD básicas para productos
router.route('/')
  .get(productController.getAllProducts)
  .post(protect, authorize('administrador'), productController.createProduct);

router.route('/:id')
  .get(productController.getProductById)
  .put(protect, authorize('administrador'), productController.updateProduct)
  .delete(protect, authorize('administrador'), productController.deleteProduct);



module.exports = router;
