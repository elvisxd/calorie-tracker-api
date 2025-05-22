import { Router } from "express";
import {
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  searchFoodItems,
  getFoodCategories,
  getFoodBrands,
  calculateNutrition,
  bulkImportFoodItems,
} from "../controllers/food-items.controller";

const router = Router();

/**
 * @route   GET /api/food-items
 * @desc    Obtener todos los alimentos con filtros, ordenamiento y paginación
 * @access  Public
 *
 * Query params:
 * - name: Filtrar por nombre
 * - category: Filtrar por categoría
 * - brand: Filtrar por marca
 * - minCalories: Calorías mínimas
 * - maxCalories: Calorías máximas
 * - verified: Filtrar por verificación (true/false)
 * - limit: Límite de resultados (default: 20)
 * - offset: Desplazamiento para paginación (default: 0)
 * - sortBy: Campo para ordenar (name, calories, created_at)
 * - sortOrder: Orden (asc, desc)
 */
router.get("/", getFoodItems);

/**
 * @route   GET /api/food-items/search
 * @desc    Buscar alimentos por nombre (para autocompletado)
 * @access  Public
 *
 * Query params:
 * - query: Texto a buscar
 * - limit: Límite de resultados (default: 10)
 */
router.get("/search", searchFoodItems);

/**
 * @route   GET /api/food-items/categories
 * @desc    Obtener todas las categorías únicas de alimentos
 * @access  Public
 */
router.get("/categories", getFoodCategories);

/**
 * @route   GET /api/food-items/brands
 * @desc    Obtener todas las marcas únicas de alimentos
 * @access  Public
 */
router.get("/brands", getFoodBrands);

/**
 * @route   GET /api/food-items/:id
 * @desc    Obtener un alimento por ID
 * @access  Public
 */
router.get("/:id", getFoodItemById);

/**
 * @route   GET /api/food-items/:id/nutrition
 * @desc    Calcular información nutricional para una cantidad específica
 * @access  Public
 *
 * Query params:
 * - amount: Cantidad del alimento (requerido)
 */
router.get("/:id/nutrition", calculateNutrition);

/**
 * @route   POST /api/food-items
 * @desc    Crear un nuevo alimento
 * @access  Public
 */
router.post("/", createFoodItem);

/**
 * @route   POST /api/food-items/bulk
 * @desc    Importar alimentos en lote
 * @access  Public
 */
router.post("/bulk", bulkImportFoodItems);

/**
 * @route   PUT /api/food-items/:id
 * @desc    Actualizar un alimento existente
 * @access  Public
 */
router.put("/:id", updateFoodItem);

/**
 * @route   DELETE /api/food-items/:id
 * @desc    Eliminar un alimento
 * @access  Public
 */
router.delete("/:id", deleteFoodItem);

export default router;
