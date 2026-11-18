# Pago en línea

Se incorpora en el detalle de Mis solicitudes, junto a la consignación existente.
La exención y el valor cotizado vienen del servidor: no se ofrece checkout para
exentas, total cero o total desconocido. Al obtener la orden se valida también su
valor y estado antes de solicitar checkout; un 409 se muestra y bloquea otro intento.

## Contrato y retorno

- `POST /pagos/ordenes/:id/pasarela`: devuelve `urlCheckout` y opcionalmente `transaccionExternaId`.
- `GET /pagos/ordenes/:id/estado`: devuelve `estado`, `referencia` y `valor` en pesos COP enteros.
- Nueva ruta autenticada: `/pagos/retorno?orden=ID`.
- El backend debe configurar Wompi sandbox para retornar a esa URL incluyendo el
  identificador de la orden SIRA. El frontend no configura credenciales ni firma transacciones.
- La página ignora los parámetros de resultado de Wompi y consulta exclusivamente
  el backend. Consulta inmediatamente y luego 5 segundos después de cada respuesta
  pendiente/error de conexión, sin solicitudes solapadas y hasta 120 segundos.
- `APROBADA`/`PAGADA`, `RECHAZADA`, `ANULADA` y `ERROR` detienen las consultas.
  Los errores 401/403/404 también las detienen. El desmontaje y el límite de tiempo
  cancelan la petición activa y los temporizadores.
- Si PSE sigue pendiente se informa que se notificará el resultado y se permite
  consultar de nuevo. Las notificaciones dependen del backend.
- Si la sesión caducó se conserva `?orden=ID` al pasar por ingreso.

## Pruebas para el orquestador

El repositorio solo tenía ejemplos de Vitest en los anexos, sin runner instalado ni
script de pruebas. Se añadió Vitest 3 compatible con `@types/node` 20, Testing Library
y jsdom, con un único proceso de pruebas (`npm test`).

Se incluyeron pruebas de componentes para exención, monto cero/desconocido, orden
no pagable, conflicto 409, conservación de consignación, polling hasta cada estado
terminal, límite PSE, reintento, parámetros manipulados, cancelación al desmontar
y conservación de la orden al ingresar.

Build, pruebas, lint, integración real con backend/Wompi sandbox y auditoría visual
AA: **no verificado**, por instrucción de no ejecutarlos como constructor.
Se reutilizan foco visible, botones, alertas y formato COP/fecha del proyecto;
el retorno tiene foco inicial y estado con `role="status"` y `aria-live="polite"`.

La instalación de dependencias informó 12 vulnerabilidades (9 moderadas y 3
críticas) en el árbol completo; origen y alcance: **no verificado**. No se ejecutó
`npm audit fix` ni se actualizaron dependencias de producción deliberadamente.
