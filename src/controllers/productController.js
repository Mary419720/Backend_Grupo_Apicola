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
    // Si se suben archivos, se generan las rutas. Si no, se asegura que sea un array vacío.
    if (req.files && req.files.length > 0) {
      productData.imagenes = req.files.map(file => `/uploads/products/${file.filename}`);
    } else {
      // Ignorar lo que venga del frontend y asegurar que sea un array vacío si no hay archivos.
      productData.imagenes = [];
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

// @desc    Obtener todos los productos con filtros, búsqueda y paginación
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    // Extraer parámetros de consulta
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoria_id,
      sort = '-fecha_creacion', // Ordenar por fecha de creación descendente por defecto
      activo
    } = req.query;

    // Convertir página y límite a números
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Construir el objeto de filtro base (siempre excluir productos eliminados)
    const filter = { eliminado: { $ne: true } };

    // Añadir filtro por estado activo si se proporciona
    if (activo !== undefined) {
      filter.activo = activo === 'true';
    }

    // Añadir filtro por categoría si se proporciona
    if (categoria_id) {
      filter.categoria_id = categoria_id;
    }

    // Añadir búsqueda por texto si se proporciona
    if (search) {
      // Función para normalizar texto (eliminar acentos) - igual que en el modelo
      const normalizeText = text => {
        if (!text) return '';
        return text
          .normalize("NFD")         // Descomponer caracteres acentuados
          .replace(/[\u0300-\u036f]/g, "") // Eliminar los acentos (marcas diacríticas)
          .toLowerCase();           // Convertir a minúsculas
      };
      
      // Normalizar el término de búsqueda
      const normalizedSearch = normalizeText(search);
      console.log(`Búsqueda: Original='${search}', Normalizada='${normalizedSearch}'`)
      
      // Crear patrones de búsqueda que escapen caracteres especiales de regex
      const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      
      const searchPattern = escapeRegExp(search);
      const normalizedPattern = escapeRegExp(normalizedSearch);
      
      // Crear expresiones regulares seguras
      const searchRegex = new RegExp(searchPattern, 'i');
      const normalizedRegex = new RegExp(normalizedPattern, 'i');
      
      // Enfoque optimizado: usar los campos normalizados para búsqueda más eficiente
      filter.$or = [
        // Búsqueda en campos originales (para compatibilidad)
        { nombre: searchRegex },
        { codigo: searchRegex },
        { descripcion: searchRegex },
        
        // Búsqueda optimizada en campos normalizados (más rápida por índices)
        { nombre_normalizado: normalizedRegex },
        { codigo_normalizado: normalizedRegex },
        { descripcion_normalizada: normalizedRegex },
        
        // Búsqueda en presentaciones
        { 'presentaciones.sku': searchRegex },
        { 'presentaciones.formato': searchRegex },
        { 'presentaciones.capacidad': searchRegex },
        
        // Búsqueda en campos normalizados de presentaciones
        { 'presentaciones.sku_normalizado': normalizedRegex },
        { 'presentaciones.formato_normalizado': normalizedRegex },
        { 'presentaciones.capacidad_normalizada': normalizedRegex }
      ];
      
      // Estrategia híbrida para búsquedas parciales y completas
      if (normalizedSearch.length >= 3) {
        // Crear patrones regex para búsqueda por substring y prefijo
        const prefixNormalizedRegex = new RegExp('^' + escapeRegExp(normalizedSearch), 'i');
        
        // IMPORTANTE: Eliminar la búsqueda por $text que estaba interfiriendo
        // con los resultados cuando se usaba junto con $or
        
        // En su lugar, optimizar la búsqueda por regex para todos los casos
        filter.$or = [
          // Búsqueda en campos originales para compatibilidad
          { nombre: searchRegex },
          { codigo: searchRegex },
          { descripcion: searchRegex },
          { 'presentaciones.sku': searchRegex },
          { 'presentaciones.formato': searchRegex },
          { 'presentaciones.capacidad': searchRegex },
          
          // Búsqueda exacta en campos normalizados (más eficiente por índices)
          { nombre_normalizado: normalizedRegex },
          { codigo_normalizado: normalizedRegex },
          { descripcion_normalizada: normalizedRegex },
          { 'presentaciones.sku_normalizado': normalizedRegex },
          { 'presentaciones.formato_normalizado': normalizedRegex },
          { 'presentaciones.capacidad_normalizada': normalizedRegex },
          
          // Búsqueda por prefijo (muy útil para autocompletar)
          { nombre_normalizado: prefixNormalizedRegex },
          { codigo_normalizado: prefixNormalizedRegex },
          { descripcion_normalizada: prefixNormalizedRegex },
          { 'presentaciones.sku_normalizado': prefixNormalizedRegex },
          { 'presentaciones.formato_normalizado': prefixNormalizedRegex },
          { 'presentaciones.capacidad_normalizada': prefixNormalizedRegex }
        ];
        
        // Para palabras completas exactas, usar $text en una consulta separada si es necesario
        // Esto es para mejorar rendimiento en bases de datos muy grandes
        if (normalizedSearch.length >= 5 && false) { // Desactivado por ahora
          // Esta sería una implementación alternativa usando el operador $text
          // Pero como está causando conflictos, lo dejamos comentado
          // filter.$text = { $search: normalizedSearch };
        }
      }
      
      // Nota sobre rendimiento: para bases de datos muy grandes (millones de productos)
      // se recomendaría implementar una solución de búsqueda más avanzada como Elasticsearch
      
      // Crear una versión serializable del filtro para el log
      const logFilter = JSON.parse(JSON.stringify(filter, (key, value) => {
        if (value instanceof RegExp) {
          return { $regex: value.source, $options: value.flags };
        }
        return value;
      }));
      
      console.log('Filtro de búsqueda optimizado:', JSON.stringify(logFilter));
    }
    
    // Configurar opciones de proyección y ordenamiento
    const projection = {};
    let sortOptions = {};
    
    // Procesar el ordenamiento
    // Para búsquedas con regex no podemos usar textScore, así que usamos otros criterios
    if (sort === '-fecha_creacion' || !sort) {
      // Ordenamiento por defecto: productos más recientes primero
      sortOptions = { fecha_creacion: -1 };
    } else {
      // Si el usuario especificó un ordenamiento personalizado, respetarlo
      sortOptions = sort.startsWith('-') 
        ? { [sort.substring(1)]: -1 }
        : { [sort]: 1 };
    }
    
    // Ejecutar consulta paginada y contar total en paralelo
    const [products, total] = await Promise.all([
      Product.find(filter, projection)
        .populate('categoria_id', 'nombre')
        .populate('subcategoria_id', 'nombre')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        // Usar lean() para optimizar rendimiento (devuelve objetos JS planos)
        .lean(),
      Product.countDocuments(filter)
    ]);
    
    // Registrar la cantidad de productos encontrados
    console.log(`Se encontraron ${total} productos que coinciden con los filtros.`);
    
    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limitNum);
    
    return res.status(200).json({
      success: true,
      data: products,
      total,         // Total de productos que coinciden con los filtros
      count: products.length, // Número de productos en la página actual
      page: pageNum,  // Página actual
      pages: totalPages, // Total de páginas
      limit: limitNum  // Límite por página
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

// @desc    Obtener múltiples productos por un array de IDs
// @route   POST /api/products/by-ids
// @access  Public
exports.getProductsByIds = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de productos.'
      });
    }

    // Filtrar solo los productos que no han sido eliminados
    const products = await Product.find({
      '_id': { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
      'eliminado': { $ne: true }
    })
    .populate('categoria_id', 'nombre')
    .populate('subcategoria_id', 'nombre')
    .lean();

    // Opcional: Mantener el orden original de los IDs solicitados
    const orderedProducts = ids.map(id => products.find(p => p._id.toString() === id)).filter(Boolean);

    res.status(200).json(orderedProducts);

  } catch (error) {
    console.error('Error al obtener productos por IDs:', error);
    next(error);
  }
};

// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private (Solo administradores)
exports.updateProduct = async (req, res, next) => {
  // DIAGNÓSTICO DETALLADO: Imprimir toda la estructura del request
  console.log('--- Iniciando updateProduct ---');
  console.log('req.headers [Content-Type]:', req.headers['content-type']);
  console.log('req.body:', req.body ? JSON.stringify(req.body, null, 2) : 'undefined');
  console.log('req.files:', req.files ? JSON.stringify(Object.keys(req.files || {}), null, 2) : 'undefined');
  if (req.files) {
    console.log('req.files.imagenes:', req.files.imagenes ? `${req.files.imagenes.length} archivos` : 'undefined');
  }
  console.log('-----------------------------');

  try {
    const { id } = req.params;
    
    // ACCESO SEGURO: Usar optional chaining para evitar el crash si req.body es undefined.
    const productDataString = req.body?.producto;

    if (!productDataString) {
      console.log('ERROR: No se encontraron datos del producto en req.body.producto');
      return res.status(400).json({
        success: false,
        message: 'No se encontraron datos del producto (campo \'producto\') en la petición.'
      });
    }

    const productData = JSON.parse(productDataString);
    console.log('productData parseado correctamente:', productData.nombre);

    // 2. Encontrar el producto existente en la base de datos
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    // 3. Lógica para manejar la actualización de imágenes
    const oldImagePaths = product.imagenes || [];
    let finalImagePaths = [];

    // Las imágenes existentes que se conservan vienen en `productData.imagenes` como strings
    const keptImages = productData.imagenes || [];
    finalImagePaths.push(...keptImages);
    console.log(`Manteniendo ${keptImages.length} imágenes existentes`);

    // Añadir las nuevas imágenes que se acaban de subir
    // CORRECCIÓN: Cuando se usa upload.fields(), req.files es un objeto con claves, no un array
    if (req.files && req.files.imagenes && req.files.imagenes.length > 0) {
      console.log(`Procesando ${req.files.imagenes.length} nuevas imágenes`);
      const newImagePaths = req.files.imagenes.map(file => `/uploads/products/${file.filename}`);
      finalImagePaths.push(...newImagePaths);
    } else {
      console.log('No hay nuevas imágenes para procesar');
    }

    // 4. Limpiar del servidor las imágenes que ya no se usan
    oldImagePaths.forEach(oldPath => {
      if (!finalImagePaths.includes(oldPath)) {
        const fullPath = path.join(__dirname, '../../public', oldPath);
        if (fs.existsSync(fullPath)) {
          console.log(`Eliminando imagen no utilizada: ${oldPath}`);
          fs.unlinkSync(fullPath);
        }
      }
    });

    // 5. Asignar la lista final de imágenes y actualizar el producto
    productData.imagenes = finalImagePaths;
    console.log(`Total de imágenes finales: ${finalImagePaths.length}`);

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true, context: 'query' }
    );

    console.log('Producto actualizado exitosamente');
    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    // Si el error es de parseo de JSON, es un Bad Request
    if (error instanceof SyntaxError) {
      return res.status(400).json({ success: false, message: 'Datos del producto mal formados.' });
    }
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
