const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Ruta para buscar productos
router.get('/search', productController.searchProducts);

// Rutas CRUD básicas para productos
router.route('/')
  .get(productController.getAllProducts)
  .post(protect, authorize('administrador'), upload.array('imagenes', 5), productController.createProduct);

// Ruta para obtener productos por un array de IDs (para la página de favoritos)
router.post('/by-ids', productController.getProductsByIds);

// Ruta para eliminar una presentación específica de un producto
router.route('/:productId/presentations/:presentationId')
  .delete(protect, authorize('administrador'), productController.deletePresentation);

router.route('/:id')
  .get(productController.getProductById)
  .put(protect, authorize('administrador'), upload.array('imagenes', 5), productController.updateProduct)
  .delete(protect, authorize('administrador'), productController.deleteProduct);



module.exports = router;
