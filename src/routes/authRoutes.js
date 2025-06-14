const express = require('express');
const router = express.Router();

// Importar los métodos del controlador
const { registerUser, loginUser } = require('../controllers/authController');

// Definir las rutas
// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

module.exports = router;
