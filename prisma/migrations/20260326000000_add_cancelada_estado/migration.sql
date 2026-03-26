-- Agrega el valor 'cancelada' al enum EstadoOrden
-- Este valor es necesario para la funcionalidad de cancelación de órdenes.
-- En PostgreSQL, los valores de enums solo se pueden agregar, no eliminar.
ALTER TYPE "EstadoOrden" ADD VALUE IF NOT EXISTS 'cancelada';
