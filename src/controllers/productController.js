const Product = require('../models/product');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (Solo administradores)
exports.createProduct = async (req, res, next) => {
  try {
    // Los datos del producto vienen como un string JSON que necesita ser parseado
    const productData = JSON.parse(req.body.producto);

    // Las URLs de las imágenes se generan a partir de los archivos subidos
    if (req.files) {
      productData.imagenes = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const product = await Product.create(productData);
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: 'Error de validación', errors: messages });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe un producto con este código' });
    }
    
    next(error);
  }
};

// @desc    Obtener todos los productos (excluyendo eliminados por defecto)
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    // Por defecto, solo se muestran los productos no eliminados
    const query = { eliminado: { $ne: true } };

    const products = await Product.find(query).lean();
    
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
    const product = await Product.findOne({ _id: req.params.id, eliminado: { $ne: true } })
      .populate('categoria_id', 'nombre')
      .populate('subcategoria_id', 'nombre');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o ha sido eliminado'
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
    const productData = JSON.parse(req.body.producto);

    // Primero, necesitamos el producto actual para saber qué imágenes borrar
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const oldImageUrls = product.imagenes || [];
    let newImageUrls = [];

    // Mantener las imágenes existentes que se envían desde el frontend
    const existingImages = productData.imagenes || [];
    newImageUrls.push(...existingImages);

    // Añadir nuevas imágenes subidas
    if (req.files && req.files.length > 0) {
      const uploadedImageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
      newImageUrls.push(...uploadedImageUrls);
    }

    // Identificar y eliminar del servidor las imágenes que ya no se usan
    oldImageUrls.forEach(oldUrl => {
      if (!newImageUrls.includes(oldUrl)) {
        const imagePath = path.join(__dirname, '../../public', oldUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    });

    // Asignar la lista final de imágenes a los datos que se van a actualizar
    productData.imagenes = newImageUrls;

    // Actualizar el producto usando findByIdAndUpdate para atomicidad y robustez
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true, context: 'query' }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'No se pudo actualizar el producto' });
    }

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: 'Error de validación', errors: messages });
    }
    next(error);
  }
};

// @desc    Eliminar un producto (soft delete)
// @route   DELETE /api/products/:id
// @access  Private (Solo administradores)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, {
      activo: false,
      eliminado: true,
      fecha_eliminacion: new Date()
    }, { new: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Producto eliminado lógicamente',
      data: product
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    next(error);
  }
};

// @desc    Eliminar una presentación de un producto
// @route   DELETE /api/products/:productId/presentations/:presentationId
// @access  Private (Solo administradores)
exports.deletePresentation = async (req, res, next) => {
  try {
    const { productId, presentationId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const presentation = product.presentaciones.id(presentationId);

    if (!presentation) {
      return res.status(404).json({ success: false, message: 'Presentación no encontrada' });
    }

    // Marcar la presentación como eliminada
    presentation.eliminado = true;
    presentation.activo = false;
    presentation.fecha_eliminacion = new Date();

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Presentación eliminada lógicamente',
      data: product
    });
  } catch (error) {
    console.error('Error al eliminar la presentación:', error);
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
      eliminado: { $ne: true },
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
    
    // Filtrar presentaciones no eliminadas
    const presentaciones = product.presentaciones.filter(p => !p.eliminado) || [];
    
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
