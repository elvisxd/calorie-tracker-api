import { Router } from "express";
import {
  getWeightLogs,
  getWeightLogById,
  createWeightLog,
  updateWeightLog,
  deleteWeightLog,
  getWeightProgressSummary,
} from "../controllers/weight-log.controller";

const router = Router();

/**
 * @route   GET /api/weight-logs
 * @desc    Obtener todos los registros de peso de un usuario con filtros
 * @access  Public
 *
 * Query params:
 * - user_id: ID del usuario (requerido)
 * - start_date: Fecha de inicio (YYYY-MM-DD)
 * - end_date: Fecha de fin (YYYY-MM-DD)
 * - limit: Límite de resultados (default: 20)
 * - offset: Desplazamiento para paginación (default: 0)
 */
router.get("/", getWeightLogs);

/**
 * @route   GET /api/weight-logs/:id
 * @desc    Obtener un registro de peso específico
 * @access  Public
 */
router.get("/:id", getWeightLogById);

/**
 * @route   GET /api/weight-logs/progress/:userId
 * @desc    Obtener el resumen de progreso de peso de un usuario
 * @access  Public
 */
router.get("/progress/:userId", getWeightProgressSummary);

/**
 * @route   POST /api/weight-logs
 * @desc    Crear un nuevo registro de peso
 * @access  Public
 */
router.post("/", createWeightLog);

/**
 * @route   PUT /api/weight-logs/:id
 * @desc    Actualizar un registro de peso existente
 * @access  Public
 */
router.put("/:id", updateWeightLog);

/**
 * @route   DELETE /api/weight-logs/:id
 * @desc    Eliminar un registro de peso
 * @access  Public
 */
router.delete("/:id", deleteWeightLog);

export default router;
