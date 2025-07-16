const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Asegúrate que la ruta al middleware de protección es correcta

const {
  addFavorite,
  removeFavorite,
  getFavorites,
  syncFavorites
} = require('../controllers/favoritesController');

// Todas las rutas aquí estarán protegidas y requerirán un token válido
router.use(protect);

router.route('/')
  .get(getFavorites)
  .post(addFavorite);

router.route('/sync')
  .post(syncFavorites);

router.route('/:productId')
  .delete(removeFavorite);

module.exports = router;
