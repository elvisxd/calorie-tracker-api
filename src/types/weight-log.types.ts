/**
 * Interfaz que representa un registro de peso en la base de datos
 */
export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  log_date: string; // formato YYYY-MM-DD
  notes: string | null;
  created_at: string;
}

/**
 * Interfaz para crear un nuevo registro de peso
 */
export interface CreateWeightLogDTO {
  user_id: string;
  weight_kg: number;
  log_date?: string; // Si no se proporciona, se usa la fecha actual
  notes?: string;
}

/**
 * Interfaz para actualizar un registro de peso existente
 */
export interface UpdateWeightLogDTO {
  weight_kg?: number;
  log_date?: string;
  notes?: string;
}

/**
 * Interfaz para filtrar registros de peso
 */
export interface WeightLogFilterParams {
  user_id: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interfaz para el resumen de progreso de peso
 */
export interface WeightProgressSummary {
  user_id: string;
  current_weight: number;
  starting_weight: number;
  weight_change: number;
  weight_change_percentage: number;
  average_weekly_change: number;
  logs_count: number;
  first_log_date: string;
  last_log_date: string;
}
