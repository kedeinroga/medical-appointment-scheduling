/**
 * Generate API Gateway OpenAPI spec from your existing OpenAPI
 * This integrates with AWS API Gateway for automatic deployment
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

function generateApiGatewaySpec() {
  try {
    // Leer tu OpenAPI base
    const yamlPath = path.join(__dirname, '../docs/openapi.yml');
    const baseSpec = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    
    // Agregar integraciones de AWS API Gateway
    const apiGatewaySpec = {
      ...baseSpec,
      'x-amazon-apigateway-api-key-source': 'HEADER',
      'x-amazon-apigateway-request-validators': {
        'basic-validator': {
          'validateRequestBody': true,
          'validateRequestParameters': true
        }
      }
    };
    
    // Agregar integraciones Lambda a cada path
    for (const [path, methods] of Object.entries(apiGatewaySpec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (typeof operation === 'object' && operation.operationId) {
          
          // Determinar qué Lambda usar basado en el path
          let lambdaFunction;
          if (path.includes('/appointments')) {
            lambdaFunction = 'medical-appointment-scheduling-${self:provider.stage}-appointment';
          }
          
          // Agregar integración Lambda
          operation['x-amazon-apigateway-integration'] = {
            type: 'aws_proxy',
            httpMethod: 'POST',
            uri: {
              'Fn::Sub': `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:function:${lambdaFunction}/invocations`
            },
            passthroughBehavior: 'when_no_match',
            contentHandling: 'CONVERT_TO_TEXT'
          };
          
          // Agregar validación de requests
          operation['x-amazon-apigateway-request-validator'] = 'basic-validator';
        }
      }
    }
    
    // Escribir spec para API Gateway
    const outputPath = path.join(__dirname, '../docs/api-gateway-openapi.yml');
    fs.writeFileSync(outputPath, yaml.dump(apiGatewaySpec, { indent: 2 }));
    
    console.log('✅ API Gateway OpenAPI spec generated!');
    console.log(`📄 Output: ${outputPath}`);
    
    return apiGatewaySpec;
  } catch (error) {
    console.error('❌ Error generating API Gateway spec:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateApiGatewaySpec();
}

module.exports = { generateApiGatewaySpec };
