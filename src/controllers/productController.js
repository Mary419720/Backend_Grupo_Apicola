const Product = require('../models/product');
const mongoose = require('mongoose');

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (Solo administradores)
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    
    // Manejo específico para errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: messages
      });
    }
    
    // Manejo para errores de duplicación (código único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con este código'
      });
    }
    
    next(error);
  }
};

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    console.log('Obteniendo todos los productos');
    console.log('Headers de autorización:', req.headers.authorization ? 'Presente' : 'Ausente');
    
    // Verificar si el modelo está registrado correctamente
    if (!mongoose.modelNames().includes('Product')) {
      console.log('Modelos disponibles:', mongoose.modelNames());
      return res.status(500).json({
        success: false,
        message: 'Error: Modelo de producto no encontrado',
        availableModels: mongoose.modelNames()
      });
    }
    
    // Usar una consulta más simple y agregar más información para depuración
    console.log('Ejecutando consulta de productos...');
    const products = await Product.find().lean();
    
    console.log(`Productos encontrados: ${products.length}`);
    if (products.length > 0) {
      console.log('Primer producto:', JSON.stringify(products[0]));
    } else {
      console.log('No hay productos en la base de datos');
    }
    
    // Devolver respuesta exitosa
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoria_id', 'nombre')
      .populate('subcategoria_id', 'nombre');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    
    // Manejo específico para IDs inválidos
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado - ID inválido'
      });
    }
    
    next(error);
  }
};

// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private (Solo administradores)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Actualizar campos principales del producto
    Object.assign(product, req.body);

    // El array de presentaciones se reemplaza completamente con los datos del frontend.
    // Esto simplifica el manejo de añadir, editar y eliminar presentaciones desde el cliente.
    product.presentaciones = req.body.presentaciones;

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El código del producto ya existe'
      });
    }

    next(error);
  }
};

// @desc    Eliminar un producto (hard delete)
// @route   DELETE /api/products/:id
// @access  Private (Solo administradores)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    await product.remove(); // Usamos remove() para activar el middleware

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    next(error);
  }
};

// @desc    Buscar productos por nombre, código o descripción
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }
    
    const products = await Product.find({
      activo: true,
      $or: [
        { nombre: { $regex: query, $options: 'i' } },
        { codigo: { $regex: query, $options: 'i' } },
        { descripcion: { $regex: query, $options: 'i' } }
      ]
    }).populate('categoria_id', 'nombre')
      .populate('subcategoria_id', 'nombre');
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error al buscar productos:', error);
    next(error);
  }
};

// @desc    Obtener todas las presentaciones de un producto
// @route   GET /api/products/:id/presentaciones
// @access  Public
exports.getProductPresentations = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Verificar si el producto tiene presentaciones
    const presentaciones = product.presentaciones || [];
    
    res.status(200).json({
      success: true,
      count: presentaciones.length,
      data: presentaciones
    });
  } catch (error) {
    console.error('Error al obtener presentaciones:', error);
    
    // Manejo específico para IDs inválidos
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado - ID inválido'
      });
    }
    
    next(error);
  }
};
