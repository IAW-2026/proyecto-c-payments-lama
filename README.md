# LAMA Payments

## Deploy de producción

https://proyecto-c-payments-lama.vercel.app

### Cuenta de Mercado Pago para pruebas

- Usuario Mercado Pago: `TESTUSER503484223242855649`
- Contraseña Mercado Pago: `oXnvzNyMNY`

Importante: para probar Mercado Pago, la cuenta compradora debe ser distinta de la cuenta vendedora dueña del access token. Estas credenciales son de compra; las credenciales de vendedor ya están en las variables de entorno de Vercel.

Además, la plata en cuenta es aproximadamente $800, así que dejamos los productos con precio bajo y el envío bajo para que se puedan hacer múltiples compras sin quedarse sin dinero.

## Instrucciones para utilizar o evaluar la aplicación

1. Iniciar sesión con un usuario habilitado en Clerk.
2. Elegir un rol desde la pantalla de selección: comprador, vendedor o superadmin.
3. Como comprador, ingresar a una orden desde Buyer App o abrir `/pago/{orden_id}`.
4. Payments consulta a Buyer App los datos de checkout de la orden.
5. Payments valida que el usuario logueado sea el comprador de esa orden.
6. Al tocar **Pagar con Mercado Pago**, Payments crea la preferencia de pago y registra el pago interno.
7. Mercado Pago llama al webhook de Payments.
8. Payments consulta el pago en Mercado Pago y refleja exclusivamente el estado informado por el proveedor.
9. Desde el panel comprador se pueden ver compras, estados, reintentar pagos pendientes/rechazados y descargar comprobantes aprobados.
10. Desde el panel vendedor se pueden ver ventas, estados de pago, comisiones, neto a cobrar y estado de liquidación.
11. Desde el panel superadmin se pueden revisar movimientos generales, pagos por estado, compradores, vendedores, comisiones y pagos demorados.
12. Cuando Shipping App informa que una orden fue entregada, Payments libera internamente los fondos y notifica a Seller App y Shipping App.

Para facilitar la corrección, se dejaron cargadas una orden con pago pendiente y otra orden con pago rechazado. La idea es que se pueda ver desde el panel del comprador que ambas permiten iniciar o reintentar el pago directamente desde la aplicación, sin tener que entrar manualmente a la página `/pago/{orden_id}`.

## Descripción del proyecto

La aplicación se integra con Buyer App para obtener los datos de una orden antes del checkout. Buyer App no inserta pagos directamente en la base de Payments: deriva al comprador a Payments con la `orden_id`, y Payments valida la identidad del comprador antes de crear la preferencia y el pago. Para crear el pago, Payments se comunica con la API de Buyer App y le pide los datos de la orden.

Payments también se integra con Seller App para informar cambios de estado de pago y liquidaciones al vendedor. Además, se integra con Shipping App para recibir la confirmación de entrega y registrar la liberación de fondos.

El sistema contempla tres vistas principales: comprador, vendedor y superadmin. Cada una muestra información adaptada al rol del usuario autenticado.

## Funcionalidades disponibles

### Comprador

- Consultar compras registradas.
- Ver el estado de cada pago: `pendiente`, `aprobado`, `rechazado` o `cancelado`.
- Reintentar pagos `pendiente` o `rechazado`.
- Pagar una orden con Mercado Pago.
- Descargar comprobante cuando el pago está `aprobado`.
- Filtrar compras por período, semana o mes.

### Vendedor

- Consultar ventas asociadas al vendedor logueado.
- Ver comprador, fecha, total, comisión y neto a cobrar.
- Ver si el pago está pendiente de liquidación o ya fue liquidado.
- Recibir actualización cuando Payments informa a Seller App que el pago fue aprobado.
- Recibir actualización cuando Payments informa la liquidación al vendedor.

### Superadmin

- Ver todos los movimientos de pagos.
- Filtrar por estado, período, comprador y vendedor.
- Revisar pagos pendientes demorados.
- Consultar comisiones y montos netos.
- Descargar comprobantes de pagos aprobados.
- Tener una vista general para control operativo.

## Notas para la corrección

- La autenticación se maneja con Clerk.
- La base de datos se maneja con Supabase.
- Mercado Pago se usa para crear preferencias y recibir webhooks.
- El webhook refleja exclusivamente los estados reales informados por Mercado Pago.
- Si una notificación `merchant_order` llega con `payments: []`, Payments no modifica el estado interno hasta poder resolver un `payment_id` real.
- También se dejaron datos de prueba con un pago pendiente y un pago rechazado para mostrar que el comprador puede pagar o reintentar el pago desde su panel dentro de Payments.
- La liquidación no cambia el estado principal del pago; el pago queda `aprobado` y la liquidación se registra mediante transacciones internas.
- Para evitar errores con el constraint de la tabla `transaccion_de_pago`, las liquidaciones se registran como `tipo_transaccion = "captura"` y se distinguen por `transaccion_proveedor_id`.
