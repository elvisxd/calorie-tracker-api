import { Router } from "express";
import {
  getMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  addFoodItemToMeal,
  updateFoodItemInMeal,
  removeFoodItemFromMeal,
  getDailyMealsSummary,
} from "../controllers/meal.controller";

const router = Router();

/**
 * @route   GET /api/meals
 * @desc    Obtener todas las comidas de un usuario con filtros
 * @access  Public
 *
 * Query params:
 * - user_id: ID del usuario (requerido)
 * - start_date: Fecha de inicio (YYYY-MM-DD)
 * - end_date: Fecha de fin (YYYY-MM-DD)
 * - meal_type: Tipo de comida (breakfast, lunch, dinner, snack)
 * - limit: Límite de resultados (default: 20)
 * - offset: Desplazamiento para paginación (default: 0)
 */
router.get("/", getMeals);

/**
 * @route   GET /api/meals/daily-summary
 * @desc    Obtener el resumen diario de comidas de un usuario
 * @access  Public
 *
 * Query params:
 * - user_id: ID del usuario (requerido)
 * - date: Fecha (YYYY-MM-DD) (requerido)
 */
router.get("/daily-summary", getDailyMealsSummary);

/**
 * @route   GET /api/meals/:id
 * @desc    Obtener una comida específica con sus alimentos
 * @access  Public
 */
router.get("/:id", getMealById);

/**
 * @route   POST /api/meals
 * @desc    Crear una nueva comida
 * @access  Public
 */
router.post("/", createMeal);

/**
 * @route   PUT /api/meals/:id
 * @desc    Actualizar una comida existente
 * @access  Public
 */
router.put("/:id", updateMeal);

/**
 * @route   DELETE /api/meals/:id
 * @desc    Eliminar una comida
 * @access  Public
 */
router.delete("/:id", deleteMeal);

/**
 * @route   POST /api/meals/:id/food-items
 * @desc    Agregar un alimento a una comida
 * @access  Public
 */
router.post("/:id/food-items", addFoodItemToMeal);

/**
 * @route   PUT /api/meals/:mealId/food-items/:foodItemId
 * @desc    Actualizar un alimento en una comida
 * @access  Public
 */
router.put("/:mealId/food-items/:foodItemId", updateFoodItemInMeal);

/**
 * @route   DELETE /api/meals/:mealId/food-items/:foodItemId
 * @desc    Eliminar un alimento de una comida
 * @access  Public
 */
router.delete("/:mealId/food-items/:foodItemId", removeFoodItemFromMeal);

export default router;
