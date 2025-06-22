const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la subcategoría es obligatorio.'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría padre es obligatoria.']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subcategory', subcategorySchema);
