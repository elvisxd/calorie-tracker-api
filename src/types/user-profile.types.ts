/**
 * Interfaz que representa un perfil de usuario en la base de datos
 */
export interface UserProfile {
  id: string; // Mismo ID que el usuario
  height_cm: number | null;
  weight_kg: number | null;
  age: number | null;
  gender: string | null;
  activity_level: number | null;
  daily_calorie_goal: number | null;
  daily_protein_goal: number | null;
  daily_carbs_goal: number | null;
  daily_fat_goal: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interfaz para crear o actualizar un perfil de usuario
 */
export interface UpsertUserProfileDTO {
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: string;
  activity_level?: number;
  daily_calorie_goal?: number;
  daily_protein_goal?: number;
  daily_carbs_goal?: number;
  daily_fat_goal?: number;
}

/**
 * Niveles de actividad física
 */
export enum ActivityLevel {
  SEDENTARY = 1.2, // Poco o ningún ejercicio
  LIGHTLY_ACTIVE = 1.375, // Ejercicio ligero 1-3 días/semana
  MODERATELY_ACTIVE = 1.55, // Ejercicio moderado 3-5 días/semana
  VERY_ACTIVE = 1.725, // Ejercicio intenso 6-7 días/semana
  EXTRA_ACTIVE = 1.9, // Ejercicio muy intenso, trabajo físico o entrenamiento 2x/día
}

/**
 * Géneros para cálculos metabólicos
 */
export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

/**
 * Interfaz para el resumen del perfil con estadísticas
 */
export interface UserProfileSummary extends UserProfile {
  bmr: number; // Tasa metabólica basal
  tdee: number; // Gasto energético total diario
  bmi: number; // Índice de masa corporal
  bmi_category: string; // Categoría de IMC
  macros_distribution: {
    protein_percentage: number;
    carbs_percentage: number;
    fat_percentage: number;
  };
}
