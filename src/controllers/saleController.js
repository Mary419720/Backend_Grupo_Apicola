const Sale = require('../models/Sale');
const Product = require('../models/product');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

// @desc    Crear una nueva venta
// @route   POST /api/sales
// @access  Private
exports.createSale = asyncHandler(async (req, res, next) => {
  const { cliente, productos, totales, metodo_pago, notas, ubicacion_venta } = req.body;

  // 1. Generar un folio único para la venta
  const lastSale = await Sale.findOne().sort({ fecha_creacion: -1 });
  const newFolio = 'VTA-' + (lastSale ? parseInt(lastSale.folio.split('-')[1]) + 1 : 1).toString().padStart(4, '0');

  // Iniciar una sesión de MongoDB para asegurar la atomicidad
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 2. Actualizar el stock de cada producto vendido de forma atómica
    for (const item of productos) {
      const updateResult = await Product.updateOne(
        {
          _id: item.producto_id,
          'presentaciones._id': item.presentacion_id,
          'presentaciones.stock': { $gte: item.cantidad } // Asegurar que hay stock suficiente
        },
        {
          $inc: { 'presentaciones.$.stock': -item.cantidad }
        },
        { session }
      );

      // Si no se modificó ninguna fila, es porque no se encontró el producto o no había stock
      if (updateResult.modifiedCount === 0) {
        const product = await Product.findById(item.producto_id).session(session);
        if (!product || !product.presentaciones.id(item.presentacion_id)) {
          throw new Error(`Producto o presentación con ID ${item.producto_id} / ${item.presentacion_id} no fue encontrado.`);
        }
        throw new Error(`Stock insuficiente para el producto: ${product.nombre}.`);
      }
    }

    // 3. Crear y guardar la nueva venta
    const sale = new Sale({
      folio: newFolio,
      cliente,
      productos,
      totales,
      metodo_pago,
      notas,
      ubicacion_venta,
      usuario_vendedor_id: req.user.id, // Asumiendo que el ID del usuario está en req.user.id
      estado: 'completada'
    });

    await sale.save({ session });

    // Si todo fue bien, confirmar la transacción
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: sale
    });

  } catch (error) {
    // Si algo falla, abortar la transacción
    await session.abortTransaction();
    console.error('Error al crear la venta:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    // Finalizar la sesión
    session.endSession();
  }
});

// @desc    Obtener todas las ventas
// @route   GET /api/sales
// @access  Private
exports.getAllSales = asyncHandler(async (req, res, next) => {
  const sales = await Sale.find().populate('usuario_vendedor_id', 'name email');
  res.status(200).json({
    success: true,
    count: sales.length,
    data: sales
  });
});

// @desc    Obtener una venta por ID
// @route   GET /api/sales/:id
// @access  Private
exports.getSaleById = asyncHandler(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id)
    .populate('usuario_vendedor_id', 'name email')
    .populate('productos.producto_id', 'nombre codigo');

  if (!sale) {
    return res.status(404).json({ success: false, message: 'Venta no encontrada' });
  }

  res.status(200).json({
    success: true,
    data: sale
  });
});
