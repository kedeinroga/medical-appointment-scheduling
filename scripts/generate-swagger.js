/**
 * Swagger Documentation Generator
 * Generates swagger.json from your OpenAPI YAML
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Función para generar la documentación
function generateSwaggerDocs() {
  try {
    // Leer el archivo OpenAPI YAML
    const yamlPath = path.join(__dirname, '../docs/openapi.yml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    // Convertir YAML a JSON
    const swaggerObject = yaml.load(yamlContent);
    
    // Agregar información dinámica
    swaggerObject.info.version = process.env.npm_package_version || '1.0.0';
    swaggerObject.info.description += `\n\n**Generated at:** ${new Date().toISOString()}`;
    
    // Agregar servidor dinámico basado en environment
    const environment = process.env.NODE_ENV || 'development';
    if (environment === 'development') {
      swaggerObject.servers = [
        {
          url: 'http://localhost:3000',
          description: 'Local development server'
        },
        ...swaggerObject.servers
      ];
    }
    
    // Escribir el archivo JSON
    const outputPath = path.join(__dirname, '../docs/swagger.json');
    fs.writeFileSync(outputPath, JSON.stringify(swaggerObject, null, 2));
    
    console.log('✅ Swagger documentation generated successfully!');
    console.log(`📄 Output: ${outputPath}`);
    
    return swaggerObject;
  } catch (error) {
    console.error('❌ Error generating swagger docs:', error.message);
    process.exit(1);
  }
}

// CLI interface simplificado
if (require.main === module) {
  generateSwaggerDocs();
}

module.exports = { generateSwaggerDocs };
