const express = require('express');
const router = express.Router();
const {
  createSale,
  getAllSales,
  getSaleById,
  getDashboardData,
  getSalesByPeriod,
  getSalesByDateRange,
  exportSalesToExcel // Importar la nueva función
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Todas las rutas de ventas requieren que el usuario esté autenticado
router.use(protect);

// Rutas para el dashboard
router.get('/dashboard', getDashboardData);
router.get('/sales-by-period', getSalesByPeriod);
router.get('/history', getSalesByDateRange);

// Ruta para exportar a Excel, solo para administradores
router.get('/export', protect, authorize('administrador'), exportSalesToExcel);

router.route('/')
  .post(createSale)
  .get(getAllSales);

router.route('/:id')
  .get(getSaleById);

module.exports = router;
