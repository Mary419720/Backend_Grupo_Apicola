const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['registrado', 'invitado'],
    default: 'invitado'
  },
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  rfc: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  producto_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  presentacion_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  unidad: {
    type: String
  },
  precio_unitario: {
    type: Number,
    required: true
  },
  subtotal_producto: {
    type: Number,
    required: true
  }
}, { _id: false });

const totalsSchema = new mongoose.Schema({
  subtotal: {
    type: Number,
    required: true
  },
  descuento: {
    type: Number,
    default: 0
  },
  iva: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  moneda: {
    type: String,
    default: 'MXN'
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  folio: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  cliente: clientSchema,
  productos: [productSchema],
  totales: totalsSchema,
  metodo_pago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia'],
    required: true
  },
  estado: {
    type: String,
    enum: ['completada', 'pendiente', 'cancelada'],
    default: 'pendiente'
  },
  usuario_vendedor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ubicacion_venta: {
    type: String,
    trim: true
  },
  notas: {
    type: String,
    trim: true
  },
  qr: {
    type: String
  }
}, {
  timestamps: { createdAt: 'fecha_creacion', updatedAt: 'fecha_actualizacion' },
  versionKey: false
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
