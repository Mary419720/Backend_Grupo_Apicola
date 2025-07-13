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
  sku_normalizado: {
    type: String
  },
  formato: {
    type: String,
    trim: true
  },
  formato_normalizado: {
    type: String
  },
  capacidad: {
    type: String,
    trim: true
  },
  capacidad_normalizada: {
    type: String
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
  },
  eliminado: {
    type: Boolean,
    default: false
  },
  fecha_eliminacion: {
    type: Date,
    default: null
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
  codigo_normalizado: {
    type: String,
    index: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  nombre_normalizado: {
    type: String,
    index: true
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
    ref: 'Subcategory',
    required: [true, 'La subcategoría es obligatoria.']
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
  descripcion_normalizada: {
    type: String,
    index: true
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
  eliminado: {
    type: Boolean,
    default: false
  },
  fecha_eliminacion: {
    type: Date,
    default: null
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

// Función para normalizar texto (eliminar acentos)
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize("NFD")         // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Eliminar los acentos (marcas diacríticas)
    .toLowerCase();           // Convertir a minúsculas
}

// Middleware para actualizar fecha_actualizacion automáticamente y campos normalizados
productSchema.pre('save', function(next) {
  // Actualizar fecha
  this.fecha_actualizacion = Date.now();
  
  // Generar campos normalizados para búsqueda optimizada
  this.nombre_normalizado = normalizeText(this.nombre);
  this.codigo_normalizado = normalizeText(this.codigo);
  this.descripcion_normalizada = normalizeText(this.descripcion);
  
  // Si hay presentaciones, normalizar sus campos también
  if (Array.isArray(this.presentaciones)) {
    this.presentaciones.forEach(presentacion => {
      if (presentacion.sku) {
        presentacion.sku_normalizado = normalizeText(presentacion.sku);
      }
      if (presentacion.formato) {
        presentacion.formato_normalizado = normalizeText(presentacion.formato);
      }
      if (presentacion.capacidad) {
        presentacion.capacidad_normalizada = normalizeText(presentacion.capacidad);
      }
    });
  }
  
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

// Crear índices para optimizar consultas

// 1. Índice de texto para búsqueda optimizada
productSchema.index(
  { 
    nombre_normalizado: 'text', 
    codigo_normalizado: 'text', 
    descripcion_normalizada: 'text' 
  },
  {
    weights: {
      nombre_normalizado: 10,      // Mayor prioridad para coincidencias en nombre
      codigo_normalizado: 5,       // Prioridad media para coincidencias en código
      descripcion_normalizada: 1   // Prioridad normal para coincidencias en descripción
    },
    name: "productos_texto_idx"
  }
);

// 2. Índices simples para filtros comunes
productSchema.index({ categoria_id: 1 });
productSchema.index({ subcategoria_id: 1 });
productSchema.index({ eliminado: 1 });
productSchema.index({ activo: 1 });

// 3. Índices compuestos para consultas frecuentes
productSchema.index({ eliminado: 1, activo: 1 });
productSchema.index({ fecha_creacion: -1 }); // Para ordenar por más reciente

// NOTA: No necesitamos definir un índice para 'codigo' aquí porque ya está
// declarado como único en la definición del campo (unique: true)

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
