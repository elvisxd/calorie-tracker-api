import { Router } from "express";
import {
  getUserProfile,
  upsertUserProfile,
  calculateNutritionGoals,
  updateNutritionGoals,
} from "../controllers/user-profile.controller";

const router = Router();

/**
 * @route   GET /api/user-profiles/:userId
 * @desc    Obtener el perfil de un usuario
 * @access  Public
 */
router.get("/:userId", getUserProfile);

/**
 * @route   PUT /api/user-profiles/:userId
 * @desc    Crear o actualizar el perfil de un usuario
 * @access  Public
 */
router.put("/:userId", upsertUserProfile);

/**
 * @route   GET /api/user-profiles/:userId/nutrition-goals
 * @desc    Calcular objetivos nutricionales basados en el perfil
 * @access  Public
 *
 * Query params:
 * - goal_type: Tipo de objetivo (maintain, lose, gain)
 */
router.get("/:userId/nutrition-goals", calculateNutritionGoals);

/**
 * @route   PUT /api/user-profiles/:userId/nutrition-goals
 * @desc    Actualizar objetivos nutricionales en el perfil
 * @access  Public
 */
router.put("/:userId/nutrition-goals", updateNutritionGoals);

export default router;
