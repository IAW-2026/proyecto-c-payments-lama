-- Datos de prueba para LAMA Payments.
-- Pegar y ejecutar en el SQL Editor de Supabase.
-- Si tu Clerk user id es distinto, cambia el valor de mi_usuario_id.

alter table public.pago
add column if not exists comprador_nombre text,
add column if not exists comprador_email text;

with config as (
  select
    'user_3DRaFo6JeyL5La245RLPa5SjHP5'::text as mi_usuario_id
),
pagos_prueba as (
  select *
  from (
    values
      -- Compras hechas por tu usuario: aparecen en Panel comprador.
      (
        'ORD-COMP-001',
        (select mi_usuario_id from config),
        'Ana Paz',
        'ana.paz@test.lama',
        'vend_1',
        18500::numeric,
        2500::numeric,
        'aprobado',
        'MERCADO_PAGO',
        now() - interval '1 day'
      ),
      (
        'ORD-COMP-002',
        (select mi_usuario_id from config),
        'Ana Paz',
        'ana.paz@test.lama',
        'vend_2',
        9200::numeric,
        1800::numeric,
        'pendiente',
        'MERCADO_PAGO',
        now() - interval '3 days'
      ),
      (
        'ORD-COMP-003',
        (select mi_usuario_id from config),
        'Ana Paz',
        'ana.paz@test.lama',
        'vend_3',
        32400::numeric,
        0::numeric,
        'rechazado',
        'MERCADO_PAGO',
        now() - interval '11 days'
      ),
      (
        'ORD-COMP-004',
        (select mi_usuario_id from config),
        'Ana Paz',
        'ana.paz@test.lama',
        'vend_1',
        14800::numeric,
        2200::numeric,
        'aprobado',
        'MERCADO_PAGO',
        now() - interval '34 days'
      ),

      -- Ventas de tu usuario: aparecen en Panel vendedor.
      (
        'ORD-VEND-001',
        'user_comprador_101',
        'Lucia Gomez',
        'lucia.gomez@test.lama',
        (select mi_usuario_id from config),
        27000::numeric,
        3000::numeric,
        'aprobado',
        'MERCADO_PAGO',
        now() - interval '2 days'
      ),
      (
        'ORD-VEND-002',
        'user_comprador_102',
        'Mateo Ruiz',
        'mateo.ruiz@test.lama',
        (select mi_usuario_id from config),
        12500::numeric,
        1900::numeric,
        'pendiente',
        'MERCADO_PAGO',
        now() - interval '6 days'
      ),
      (
        'ORD-VEND-003',
        'user_comprador_103',
        'Sofia Benitez',
        'sofia.benitez@test.lama',
        (select mi_usuario_id from config),
        41000::numeric,
        3500::numeric,
        'aprobado',
        'MERCADO_PAGO',
        now() - interval '19 days'
      ),
      (
        'ORD-VEND-004',
        'user_comprador_104',
        'Nicolas Silva',
        'nicolas.silva@test.lama',
        (select mi_usuario_id from config),
        7600::numeric,
        1600::numeric,
        'cancelado',
        'MERCADO_PAGO',
        now() - interval '42 days'
      ),

      -- Movimientos random: solo aparecen en Superadmin.
      (
        'ORD-GLOB-001',
        'user_random_201',
        'Camila Torres',
        'camila.torres@test.lama',
        'vend_random_301',
        23100::numeric,
        2400::numeric,
        'aprobado',
        'MERCADO_PAGO',
        now() - interval '4 days'
      ),
      (
        'ORD-GLOB-002',
        'user_random_202',
        'Joaquin Perez',
        'joaquin.perez@test.lama',
        'vend_random_302',
        15800::numeric,
        2100::numeric,
        'pendiente',
        'MERCADO_PAGO',
        now() - interval '8 days'
      ),
      (
        'ORD-GLOB-003',
        'user_random_203',
        'Valentina Rios',
        'valentina.rios@test.lama',
        'vend_random_303',
        53800::numeric,
        4200::numeric,
        'aprobado',
        'MERCADO_PAGO',
        now() - interval '27 days'
      ),
      (
        'ORD-GLOB-004',
        'user_random_204',
        'Bruno Castro',
        'bruno.castro@test.lama',
        'vend_random_304',
        6900::numeric,
        1500::numeric,
        'rechazado',
        'MERCADO_PAGO',
        now() - interval '58 days'
      )
  ) as t(
    orden_id,
    comprador_id,
    comprador_nombre,
    comprador_email,
    vendedor_id,
    monto_producto,
    monto_envio,
    estado,
    proveedor,
    fecha_creacion
  )
)
insert into public.pago (
  orden_id,
  comprador_id,
  comprador_nombre,
  comprador_email,
  vendedor_id,
  monto_producto,
  monto_envio,
  comision,
  monto_neto,
  monto_total,
  moneda,
  estado,
  proveedor,
  fecha_creacion
)
select
  orden_id,
  comprador_id,
  comprador_nombre,
  comprador_email,
  vendedor_id,
  monto_producto,
  monto_envio,
  monto_producto * 0.10 as comision,
  monto_producto * 0.90 as monto_neto,
  monto_producto + monto_envio as monto_total,
  'ARS' as moneda,
  estado,
  proveedor,
  fecha_creacion
from pagos_prueba
where not exists (
  select 1
  from public.pago existente
  where existente.orden_id = pagos_prueba.orden_id
);
