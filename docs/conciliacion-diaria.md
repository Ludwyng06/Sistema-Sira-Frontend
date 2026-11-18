# Conciliación diaria (RF-PAG-12)

Ruta: `/panel/conciliacion`, protegida con `GuardiaSesion` y visible en el menú
solo para `TESORERIA` y `ADMINISTRADOR`, nombres reales de los roles del proyecto.
La API sigue siendo responsable de autorizar cada operación.

El día inicial es ayer calendario en `America/Bogota`, independiente de la zona
del navegador. Se introduce una fecha real en formato dd/mm/aaaa; las peticiones
usan YYYY-MM-DD. Los valores del contrato son pesos enteros y se presentan con
la utilidad `pesos`, sin decimales.

El cliente único `api` añade `/api` y gestiona sesión, errores y timeout:

- GET `/pagos/conciliacion?fecha=YYYY-MM-DD`: informe con totales, proveedores,
  órdenes y diferencias.
- POST `/pagos/conciliacion/extracto?fecha=YYYY-MM-DD`: FormData, campo `archivo`;
  el navegador fija Content-Type. Se rechaza extensión/MIME incompatible con CSV,
  archivo vacío o mayor de 2 MB antes del envío. El servidor valida contenido y
  columnas `referencia,valor,fecha`, y devuelve el informe recalculado.
- GET `/pagos/conciliacion/pdf?fecha=YYYY-MM-DD`: Blob PDF; descarga a través de
  `BotonDescarga` y `guardarArchivo` existentes.

La comparación del extracto solo vive en la pantalla y se descarta al cambiar
de día. El GET del PDF no recibe el archivo; descarga el informe del sistema,
no la comparación temporal. Esta distinción aparece tras comparar un CSV.
El backend debe generar el PDF tamaño carta y no almacenar el extracto salvo
su bitácora, tal como establece el contrato.

Se incluyen estados de carga, error con reintento, vacío, filtros combinados de
estado y medio, tablas con caption y scope, controles con etiquetas y ayudas,
resultado anunciado mediante aria-live, foco y colores institucionales.

Pruebas para el orquestador: render de totales y diferencias, filtros, CSV inválido,
informe recalculado, fechas inválidas, descarga PDF, permisos de pantalla y menú,
carga/error/vacío y contrato HTTP/multipart con fechas en límites de Bogotá.

Build, pruebas, lint, integración con el backend, revisión visual y auditoría AA:
**no verificado**; no se ejecutaron por instrucción del coordinador.
