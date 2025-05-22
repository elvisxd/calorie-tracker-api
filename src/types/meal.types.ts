import { FoodItem } from "./food-item.type";

/**
 * Tipos de comidas
 */
export enum MealType {
  BREAKFAST = "breakfast",
  LUNCH = "lunch",
  DINNER = "dinner",
  SNACK = "snack",
}

/**
 * Interfaz que representa una comida en la base de datos
 */
export interface Meal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  meal_date: string; // formato YYYY-MM-DD
  meal_time: string; // formato HH:MM:SS
  meal_type: MealType | string;
  total_calories: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interfaz que representa un alimento en una comida
 */
export interface MealFoodItem {
  id: string;
  meal_id: string;
  food_item_id: string;
  amount: number;
  created_at: string;
}

/**
 * Interfaz para crear una nueva comida
 */
export interface CreateMealDTO {
  user_id: string;
  name: string;
  description?: string;
  meal_date?: string; // Si no se proporciona, se usa la fecha actual
  meal_time?: string; // Si no se proporciona, se usa la hora actual
  meal_type: MealType | string;
  food_items?: CreateMealFoodItemDTO[]; // Alimentos iniciales para la comida
}

/**
 * Interfaz para actualizar una comida existente
 */
export interface UpdateMealDTO {
  name?: string;
  description?: string;
  meal_date?: string;
  meal_time?: string;
  meal_type?: MealType | string;
}

/**
 * Interfaz para crear un alimento en una comida
 */
export interface CreateMealFoodItemDTO {
  food_item_id: string;
  amount: number;
}

/**
 * Interfaz para actualizar un alimento en una comida
 */
export interface UpdateMealFoodItemDTO {
  amount: number;
}

/**
 * Interfaz para filtrar comidas
 */
export interface MealFilterParams {
  user_id: string;
  start_date?: string;
  end_date?: string;
  meal_type?: MealType | string;
  limit?: number;
  offset?: number;
}

/**
 * Interfaz para una comida con sus alimentos
 */
export interface MealWithFoodItems extends Meal {
  food_items: (MealFoodItem & {
    food_item: FoodItem;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
    };
  })[];
}

/**
 * Interfaz para el resumen nutricional de una comida
 */
export interface MealNutritionSummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
}

/**
 * Interfaz para el resumen diario de comidas
 */
export interface DailyMealsSummary {
  date: string;
  total_calories: number;
  meals: {
    [key in MealType]?: {
      meal_id: string | null;
      meal_name: string | null;
      calories: number;
    };
  };
  nutrition: MealNutritionSummary;
}
