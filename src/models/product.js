const mongoose = require('mongoose');

// Esquema para las diferentes presentaciones de un producto.
// Cada presentación tiene su propio SKU, precio, stock, etc.
const presentacionSchema = new mongoose.Schema({
  // _id es generado automáticamente por MongoDB para cada presentación
  sku: {
    type: String,
    trim: true,
    uppercase: true
  },
  formato: {
    type: String,
    trim: true
  },
  capacidad: {
    type: String,
    trim: true
  },
  precio_venta: {
    type: Number,
    required: [true, 'El precio de venta es obligatorio para la presentación'],
    min: [0, 'El precio de venta no puede ser negativo']
  },
  precio_compra: {
    type: Number,
    min: [0, 'El precio de compra no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio para la presentación'],
    default: 0,
    min: [0, 'El stock no puede ser negativo']
  },
  stock_minimo: {
    type: Number,
    default: 10,
    min: [0, 'El stock mínimo no puede ser negativo']
  },
  lote: {
    type: String,
    trim: true
  },
  fecha_ingreso: {
    type: Date
  },
  fecha_vencimiento: {
    type: Date
  },
  proveedor: {
    type: String,
    trim: true
  },
  ubicacion: {
    type: String,
    trim: true
  },
  observaciones: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'fecha_creacion', updatedAt: 'fecha_actualizacion' },
  versionKey: false,
  _id: true
});

const productSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: [true, 'El código del producto es obligatorio'],
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de producto es obligatorio'],
    trim: true
  },
  categoria_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría es obligatoria']
  },
  subcategoria_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  },
  estado_fisico: {
    type: String,
    enum: ['Líquido', 'Sólido', 'Semi-sólido'],
    default: 'Líquido'
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción del producto es obligatoria']
  },
  atributos: {
    type: Object,
    default: {}
  },

  imagenes: {
    type: [String],
    default: []
  },
  // Agregamos el campo de presentaciones como un array de presentacionSchema
  presentaciones: {
    type: [presentacionSchema],
    default: []
  },
  activo: {
    type: Boolean,
    default: true
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_actualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { 
    createdAt: 'fecha_creacion', 
    updatedAt: 'fecha_actualizacion' 
  }
});

// Middleware para actualizar fecha_actualizacion automáticamente
productSchema.pre('save', function(next) {
  this.fecha_actualizacion = Date.now();
  next();
});

// Hook para eliminar las presentaciones asociadas antes de eliminar el producto
productSchema.pre('remove', async function(next) {
  console.log(`Eliminando presentaciones para el producto ${this._id}...`);
  // Como las presentaciones están embebidas, no se necesita una acción explícita aquí
  // pero si hubiera modelos relacionados, aquí se eliminarían.
  // Ejemplo: await Presentation.deleteMany({ producto_id: this._id });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
