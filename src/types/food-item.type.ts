/**
 * Interfaz que representa un alimento en la base de datos
 */
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  serving_size: number;
  serving_unit: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  category: string | null;
  brand: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para crear un nuevo alimento
 */
export interface CreateFoodItemDTO {
  name: string;
  calories: number;
  serving_size: number;
  serving_unit: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  category?: string;
  brand?: string;
  is_verified?: boolean;
}

/**
 * DTO para actualizar un alimento existente
 */
export interface UpdateFoodItemDTO {
  name?: string;
  calories?: number;
  serving_size?: number;
  serving_unit?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  category?: string;
  brand?: string;
  is_verified?: boolean;
}

/**
 * Parámetros de búsqueda para filtrar alimentos
 */
export interface FoodItemSearchParams {
  name?: string;
  category?: string;
  brand?: string;
  minCalories?: number;
  maxCalories?: number;
  verified?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: "name" | "calories" | "created_at";
  sortOrder?: "asc" | "desc";
}

/**
 * Respuesta paginada para listados de alimentos
 */
export interface PaginatedFoodItemsResponse {
  data: FoodItem[];
  count: number;
  limit: number;
  offset: number;
  total: number;
}

/**
 * Información nutricional calculada para una comida
 */
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

/**
 * Elemento de comida con cantidad
 */
export interface FoodItemWithAmount {
  foodItem: FoodItem;
  amount: number; // en la unidad de medida del alimento (g, ml, etc.)
}

/**
 * Categorías de alimentos predefinidas
 */
export enum FoodCategory {
  FRUITS = "Frutas",
  VEGETABLES = "Verduras",
  PROTEINS = "Proteínas",
  DAIRY = "Lácteos",
  GRAINS = "Granos",
  SNACKS = "Snacks",
  BEVERAGES = "Bebidas",
  OTHER = "Otros",
}

/**
 * Unidades de medida comunes
 */
export enum ServingUnit {
  GRAM = "g",
  MILLILITER = "ml",
  OUNCE = "oz",
  CUP = "taza",
  TABLESPOON = "cucharada",
  TEASPOON = "cucharadita",
  PIECE = "unidad",
}
