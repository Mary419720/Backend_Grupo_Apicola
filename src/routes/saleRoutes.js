const express = require('express');
const router = express.Router();
const { createSale, getAllSales, getSaleById } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');

// Todas las rutas de ventas requieren que el usuario esté autenticado
router.use(protect);

router.route('/')
  .post(createSale)
  .get(getAllSales);

router.route('/:id')
  .get(getSaleById);

module.exports = router;
