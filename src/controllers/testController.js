// const Test = require('../models/TestModel'); // Opcional por ahora

exports.getTestMessage = (req, res) => {
    res.json({ message: 'El API (desde el controlador) está funcionando correctamente!' });
  };
  
  /*
  exports.createTestData = async (req, res) => {
    const { name, value } = req.body;
    try {
      const newTestData = new Test({ name, value });
      await newTestData.save();
      res.status(201).json(newTestData);
    } catch (error) {
      res.status(400).json({ message: 'Error al crear el dato de prueba', error: error.message });
    }
  };
  */