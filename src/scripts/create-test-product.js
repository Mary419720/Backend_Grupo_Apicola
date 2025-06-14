const axios = require('axios');

// Datos del producto de prueba
const testProduct = {
  codigo: 'MIEL-PUR-001',
  nombre: 'Miel Pura de Abeja',
  tipo: 'Miel',
  descripcion: 'Miel pura de abeja, sin conservadores',
  categoria_id: '65d4fe9b32e2426a8c0aaf31', // Este ID deberás ajustarlo si usas categorías reales
  subcategoria_id: '65d4fec732e2426a8c0aaf33', // Este ID deberás ajustarlo si usas subcategorías reales
  estado_fisico: 'Líquido viscoso',
  precio: 150,
  precio_compra: 100,
  stock: 10,
  imagenes: ['assets/images/miel-pura.jpg'], // Ruta a una imagen de ejemplo
  activo: true
};

// Función para crear el producto de prueba
async function createTestProduct() {
  console.log('🚀 Iniciando script createTestProduct...');
  try {
    console.log('📦 Datos del producto a crear:', JSON.stringify(testProduct, null, 2));
    console.log('📡 Intentando conectar a: http://localhost:3001/api/products');
    
    const response = await axios.post('http://localhost:3001/api/products', testProduct, {
      headers: {
        'Content-Type': 'application/json',
        // Si tu API requiere autenticación, descomentar y agregar un token válido:
        // 'Authorization': 'Bearer TU_TOKEN_AQUI'
      },
      timeout: 10000 // Añadir un timeout de 10 segundos
    });
    
    console.log('✅ Producto creado exitosamente:');
    console.log('📄 Respuesta completa del servidor:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error detallado al crear producto:');
    if (error.isAxiosError) {
        console.error('   Tipo de error: AxiosError');
        if (error.response) {
            // El servidor respondió con un código de estado fuera del rango 2xx
            console.error(`   Status: ${error.response.status}`);
            console.error('   Headers de respuesta:', JSON.stringify(error.response.headers, null, 2));
            console.error('   Cuerpo de respuesta:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // La solicitud fue hecha pero no se recibió respuesta
            console.error('   No se recibió respuesta del servidor.');
            console.error('   Detalles de la solicitud:', JSON.stringify(error.request, null, 2));
        } else {
            // Algo sucedió al configurar la solicitud que provocó un error
            console.error('   Error al configurar la solicitud:', error.message);
        }
        console.error('   Configuración de Axios:', JSON.stringify(error.config, null, 2));
    } else {
        // Error no relacionado con Axios
        console.error('   Error genérico:', error.message);
        console.error('   Stack:', error.stack);
    }
  }
  console.log('🏁 Script createTestProduct finalizado.');
}

// Ejecutar la función
createTestProduct();
