const mongoose = require('mongoose');

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
  precio: {
    type: Number,
    required: [true, 'El precio del producto es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'El stock no puede ser negativo']
  },
  imagenes: {
    type: [String],
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

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
