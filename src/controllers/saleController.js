const Sale = require('../models/Sale');
const Product = require('../models/product');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ExcelJS = require('exceljs');
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

// @desc    Obtener datos para el dashboard principal
// @route   GET /api/sales/dashboard
// @access  Private
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  const totalSalesResult = await Sale.aggregate([
    { $group: { _id: null, total: { $sum: '$totales.total' } } }
  ]);

  const totalProducts = await Product.countDocuments();

  // Calcular nuevos clientes (últimos 30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCustomers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  console.log(`Nuevos clientes encontrados (últimos 30 días): ${newCustomers}`);

  // Calcular ingresos del mes actual y anterior para el KPI
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonthSalesResult = await Sale.aggregate([
    { $match: { fecha_creacion: { $gte: startOfCurrentMonth } } },
    { $group: { _id: null, total: { $sum: '$totales.total' } } }
  ]);

  const previousMonthSalesResult = await Sale.aggregate([
    { $match: { fecha_creacion: { $gte: startOfPreviousMonth, $lt: startOfCurrentMonth } } },
    { $group: { _id: null, total: { $sum: '$totales.total' } } }
  ]);

  const currentMonthSales = currentMonthSalesResult.length > 0 ? currentMonthSalesResult[0].total : 0;
  const previousMonthSales = previousMonthSalesResult.length > 0 ? previousMonthSalesResult[0].total : 0;

  let monthlyRevenueGrowth = 0;
  if (previousMonthSales > 0) {
    monthlyRevenueGrowth = ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;
  } else if (currentMonthSales > 0) {
    monthlyRevenueGrowth = 100; // Crecimiento infinito si el mes pasado fue 0
  }

  const sevenMonthsAgo = new Date();
  sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

  const monthlySales = await Sale.aggregate([
    { $match: { fecha_creacion: { $gte: sevenMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$fecha_creacion' }, month: { $month: '$fecha_creacion' } },
        total: { $sum: '$totales.total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const labels = monthlySales.map(s => monthNames[s._id.month - 1]);
  const salesData = monthlySales.map(s => s.total);

  console.log('[Backend] Dashboard Data:', { totalSales: totalSalesResult[0]?.total || 0, totalProducts, monthlySales });

  res.status(200).json({
    totalSales: totalSalesResult.length > 0 ? totalSalesResult[0].total : 0,
    totalProducts: totalProducts,
    newCustomers: newCustomers,
    months: labels,
    salesData: salesData,
    profitData: salesData.map(s => s * 0.4), // Dato simulado
    revenueData: salesData.map(s => s * 1.2), // Dato simulado
    monthlyRevenueGrowth: monthlyRevenueGrowth.toFixed(1)
  });
});

// @desc    Obtener ventas por período
// @route   GET /api/sales/sales-by-period
// @access  Private
exports.getSalesByPeriod = asyncHandler(async (req, res, next) => {
    const { period } = req.query;
    let startDate = new Date();
    let groupByFormat;
    
    switch (period) {
        case 'day':
            startDate.setDate(startDate.getDate() - 7);
            groupByFormat = '%Y-%m-%d';
            break;
        case 'week':
            startDate.setDate(startDate.getDate() - 28);
            groupByFormat = '%Y-%U';
            break;
        case 'month':
            startDate.setMonth(startDate.getMonth() - 7);
            groupByFormat = '%Y-%m';
            break;
        case 'year':
            startDate.setFullYear(startDate.getFullYear() - 4);
            groupByFormat = '%Y';
            break;
        default:
            return res.status(400).json({ success: false, message: 'Período no válido' });
    }

    const sales = await Sale.aggregate([
        { $match: { fecha_creacion: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: groupByFormat, date: '$fecha_creacion' } },
                total: { $sum: '$totales.total' }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    console.log(`Sales by Period (${period}):`, sales);

    res.status(200).json({
        labels: sales.map(s => s._id),
        sales: sales.map(s => s.total)
    });
});

// @desc    Obtener ventas por rango de fechas para el historial
// @route   GET /api/sales/history
// @access  Private
exports.getSalesByDateRange = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Fechas no proporcionadas.' });
  }

  const sales = await Sale.aggregate([
    {
      $match: {
        fecha_creacion: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // Incluir todo el día final
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha_creacion' } },
        total: { $sum: '$totales.total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const labels = sales.map(sale => new Date(sale._id).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }));

  console.log(`[Backend] Sales by Date Range (${startDate} - ${endDate}):`, sales);

  res.status(200).json({
    labels: labels,
    sales: sales.map(s => s.total)
  });
});

// @desc    Exportar todas las ventas a un archivo Excel
// @route   GET /api/sales/export
// @access  Private/Admin
exports.exportSalesToExcel = asyncHandler(async (req, res, next) => {
  const sales = await Sale.find({}).populate('usuario_vendedor_id', 'name email').populate('productos.producto_id', 'nombre codigo');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ventas');

  // Definir las columnas y el formato
  worksheet.columns = [
    { header: 'Folio', key: 'folio', width: 15 },
    { header: 'Fecha', key: 'fecha', width: 20, style: { numFmt: 'dd/mm/yyyy hh:mm:ss' } },
    { header: 'Cliente', key: 'cliente_nombre', width: 30 },
    { header: 'Email Cliente', key: 'cliente_email', width: 30 },
    { header: 'RFC Cliente', key: 'cliente_rfc', width: 20 },
    { header: 'Vendedor', key: 'vendedor', width: 30 },
    { header: 'Método de Pago', key: 'metodo_pago', width: 15 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Subtotal', key: 'subtotal', width: 15, style: { numFmt: '$#,##0.00' } },
    { header: 'Descuento', key: 'descuento', width: 15, style: { numFmt: '$#,##0.00' } },
    { header: 'IVA', key: 'iva', width: 15, style: { numFmt: '$#,##0.00' } },
    { header: 'Total', key: 'total', width: 15, style: { numFmt: '$#,##0.00' } },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Ubicación Venta', key: 'ubicacion_venta', width: 25 },
    { header: 'Notas', key: 'notas', width: 40 },
    { header: 'Productos', key: 'productos', width: 100 }
  ];

  // Añadir filas con los datos de las ventas
  sales.forEach(sale => {
    worksheet.addRow({
      folio: sale.folio,
      fecha: sale.fecha,
      cliente_nombre: sale.cliente.nombre,
      cliente_email: sale.cliente.email,
      cliente_rfc: sale.cliente.rfc,
      vendedor: sale.usuario_vendedor_id ? sale.usuario_vendedor_id.name : 'N/A',
      metodo_pago: sale.metodo_pago,
      estado: sale.estado,
      subtotal: sale.totales.subtotal,
      descuento: sale.totales.descuento,
      iva: sale.totales.iva,
      total: sale.totales.total,
      moneda: sale.totales.moneda,
      ubicacion_venta: sale.ubicacion_venta,
      notas: sale.notas,
      productos: sale.productos.map(p => 
        `${p.cantidad} x ${p.producto_id ? p.producto_id.nombre : 'Producto no encontrado'} (SKU: ${p.sku}) @ $${p.precio_unitario}`
      ).join('\n')
    });
  });

  // Estilizar la cabecera
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '002060' } // Azul oscuro
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // Ajustar el alto de las filas que contienen múltiples productos
  worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
    if (rowNumber > 1) {
      const cell = row.getCell('productos');
      const numLines = (cell.value.toString().match(/\n/g) || []).length + 1;
      if (numLines > 1) {
        row.height = 15 * numLines;
        cell.alignment = { wrapText: true, vertical: 'middle' };
      }
    }
  });

  // Configurar las cabeceras de la respuesta para la descarga
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Reporte_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`
  );

  // Escribir el libro de trabajo en la respuesta. Esto también finaliza la respuesta.
  return workbook.xlsx.write(res);
});
