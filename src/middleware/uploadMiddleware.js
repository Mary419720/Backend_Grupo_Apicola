const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/products/');
  },
  filename: function (req, file, cb) {
    // Generar un nombre de archivo único para evitar colisiones
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceptar solo archivos de imagen
const fileFilter = (req, file, cb) => {
  // Comprobar si el archivo es una imagen válida.
  const filetypes = /jpeg|jpg|png|webp/;
  const isImageType = filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase());

  if (isImageType) {
    // El archivo es válido, aceptarlo.
    cb(null, true);
  } else {
    // El archivo no es válido. Rechazarlo de forma segura sin colapsar la petición.
    // También podemos adjuntar un error al request para que el controlador lo sepa.
    req.fileValidationError = 'Error: Solo se permiten archivos de imagen (jpeg, jpg, png, webp).';
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Límite de 5MB por archivo
  fileFilter: fileFilter
});

module.exports = upload;
