# 🛡️ Guía de Tests E2E para Refactoring Seguro

## 🎯 Propósito

Los tests End-to-End (E2E) que acabamos de crear te permitirán hacer refactoring con confianza, sabiendo que el flujo completo de información sigue funcionando correctamente.

## 📋 ¿Qué Validan Estos Tests?

### ✅ Flujo Completo de Información
Los tests validan que este flujo funcione de extremo a extremo:

```
1. API → appointment λ → DynamoDB (pending)
2. appointment λ → PE/CL SNS → Country SQS → PE/CL λ → MySQL(RDS) (scheduled)
3. PE/CL λ → EventBridge → Completion SQS → appointment λ → DynamoDB UPDATE (completed)
```

### ✅ Estructura de Datos
- **POST /appointments**: Valida que retorne el formato correcto con status "pending"
- **GET /appointments/{insuredId}**: Valida la estructura completa con paginación

### ✅ Casos de Error
- Países inválidos (ej: countryISO: "US")
- JSON malformado
- IDs de asegurado inexistentes

## 🚀 Cómo Usar Durante Refactoring

### 1. Antes de Empezar el Refactor
```bash
# Ejecuta los tests para confirmar que todo funciona
npm run test:e2e

# Si tienes la API desplegada, también ejecuta:
API_GATEWAY_URL=https://tu-api-id.execute-api.region.amazonaws.com/dev npm run test:e2e:http:dev
```

### 2. Durante el Refactor
```bash
# Ejecuta frecuentemente durante los cambios
npm run test:e2e

# Los tests te dirán inmediatamente si rompiste algo
```

### 3. Después del Refactor
```bash
# Confirma que todo sigue funcionando
npm run test:e2e

# Ejecuta contra la API desplegada para validación completa
API_GATEWAY_URL=https://tu-api-id.execute-api.region.amazonaws.com/dev npm run test:e2e:http:dev
```

## 📂 Archivos Creados

### Tests E2E
- **`test/e2e/appointment-flow.e2e.spec.ts`**: Test principal que valida el flujo completo
- **`test/e2e/real-http.e2e.spec.ts`**: Tests que hacen HTTP requests reales a la API desplegada

### Documentación y Scripts
- **`test/e2e/README.md`**: Documentación detallada de los tests
- **`scripts/run-e2e-tests.sh`**: Script auxiliar para ejecutar tests en diferentes ambientes
- **`test/e2e/jest.config.js`**: Configuración específica para tests E2E

## 🎮 Comandos Disponibles

### Tests Locales (Simulados)
```bash
# Tests básicos con respuestas mockeadas
npm run test:e2e

# Using the helper script
./scripts/run-e2e-tests.sh local
```

### Tests Contra API Desplegada
```bash
# Ambiente de desarrollo
API_GATEWAY_URL=https://tu-api-id.execute-api.us-east-1.amazonaws.com/dev npm run test:e2e:http:dev

# Usando el script auxiliar (detecta automáticamente la URL)
./scripts/run-e2e-tests.sh auto-dev

# Tests de smoke en producción
API_GATEWAY_URL=https://tu-api-id.execute-api.us-east-1.amazonaws.com/prod npm run test:smoke:prod
```

## 🔍 Interpretando los Resultados

### ✅ Tests Exitosos
```
✅ Step 1 completed: Appointment created with ID: appt_test_1234567890
✅ Step 3 completed: Appointment retrieved successfully
🎉 PE E2E test completed successfully!
```

### ❌ Tests Fallidos
Si un test falla, verás claramente en qué etapa:

```
❌ Attempt 1/3 failed for POST /appointments: Request failed with status code 500
```

Esto te dice exactamente dónde buscar el problema.

## 📊 Ejemplo de Respuesta Esperada

### POST /appointments
```json
{
  "data": {
    "appointmentId": "397ce242-d456-4a54-b2c1-5fcabb3c9471",
    "countryISO": "PE",
    "insuredId": "10134",
    "scheduleId": 1,
    "status": "pending",
    "createdAt": "2025-09-13T23:50:45.680Z"
  },
  "timestamp": "2025-09-13T23:50:45.680Z"
}
```

### GET /appointments/{insuredId}
```json
{
  "data": {
    "appointments": [
      {
        "appointmentId": "397ce242-d456-4a54-b2c1-5fcabb3c9471",
        "countryISO": "PE",
        "createdAt": "2025-09-13T23:50:45.680Z",
        "insuredId": "10134",
        "processedAt": null,
        "schedule": {
          "centerId": 1,
          "date": "2025-09-14T23:29:13.000Z",
          "medicId": 1,
          "specialtyId": 1
        },
        "scheduleId": 1,
        "status": "completed",
        "updatedAt": "2025-09-13T23:50:46.268Z"
      }
    ],
    "pagination": {
      "count": 1
    }
  },
  "timestamp": "2025-09-13T23:51:21.528Z"
}
```

## 🚨 Qué Hacer Si Los Tests Fallan

### 1. Identifica la Etapa
- **Etapa 1 (API → Lambda → DynamoDB)**: Problema en la creación inicial
- **Etapa 2 (SNS → SQS → Country Lambda → RDS)**: Problema en el procesamiento por país
- **Etapa 3 (EventBridge → Completion)**: Problema en la finalización

### 2. Revisa los Logs
```bash
# Logs de las funciones Lambda
npm run logs:appointment
npm run logs:appointment-pe
npm run logs:appointment-cl
```

### 3. Verifica Configuración
- Variables de entorno
- ARNs de recursos AWS
- Permisos IAM

## 🔄 Integración con CI/CD

Los tests están listos para integrarse en tu pipeline:

```yaml
# En tu workflow de GitHub Actions
- name: Run E2E Tests
  run: npm run test:e2e

- name: Run HTTP E2E Tests (if deployed)
  run: npm run test:e2e:http:dev
  env:
    API_GATEWAY_URL: ${{ steps.deploy.outputs.api_url }}
```

## 💡 Tips para Refactoring Seguro

1. **Ejecuta frecuentemente**: No esperes a terminar todo el refactor
2. **Tests pequeños**: Haz cambios pequeños y valida constantemente
3. **Mantén la estructura**: Los tests validan la estructura de datos específica
4. **Documenta cambios**: Si cambias el formato de respuesta, actualiza los tests

## 🎉 ¡Listo para Refactorizar!

Ahora puedes hacer refactoring con confianza sabiendo que:

- ✅ El flujo completo de información está protegido
- ✅ La estructura de datos está validada
- ✅ Los casos de error están cubiertos
- ✅ Tienes feedback inmediato si algo se rompe

**¡A refactorizar sin miedo!** 🚀
