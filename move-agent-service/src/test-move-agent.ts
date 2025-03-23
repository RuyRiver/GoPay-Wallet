/**
 * Prueba de importación de Move Agent Kit
 */
import * as MoveAgentKit from 'move-agent-kit';

// Imprimir las exportaciones disponibles
console.log('MoveAgentKit exports:', Object.keys(MoveAgentKit));

// Intentar probar una importación básica
async function testMoveAgentKit() {
  try {
    console.log('Testing Move Agent Kit...');
    
    // Mostrar la versión u otra información si está disponible
    console.log('Move Agent Kit structure:', MoveAgentKit);
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing Move Agent Kit:', error);
  }
}

// Ejecutar la prueba
testMoveAgentKit(); 