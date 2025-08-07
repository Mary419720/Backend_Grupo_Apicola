const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/', testController.getTestMessage);

// router.post('/', testController.createTestData);

module.exports = router;