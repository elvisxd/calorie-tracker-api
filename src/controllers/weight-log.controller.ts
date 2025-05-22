import type { Request, Response } from "express";
import { supabase } from "../config/supabase";
import type {
  CreateWeightLogDTO,
  UpdateWeightLogDTO,
  WeightLogFilterParams,
} from "../types/weight-log.types";

/**
 * Obtener todos los registros de peso de un usuario con filtros
 */
export const getWeightLogs = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      start_date,
      end_date,
      limit = 20,
      offset = 0,
    } = req.query as unknown as WeightLogFilterParams;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "Se requiere el ID del usuario",
      });
    }

    // Iniciar la consulta
    let query = supabase
      .from("weight_logs")
      .select("*", { count: "exact" })
      .eq("user_id", user_id);

    // Aplicar filtros si se proporcionan
    if (start_date) {
      query = query.gte("log_date", start_date);
    }

    if (end_date) {
      query = query.lte("log_date", end_date);
    }

    // Ordenar por fecha
    query = query.order("log_date", { ascending: false });

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    // Ejecutar la consulta
    const { data, error, count } = await query;

    if (error) {
      console.error("Error al obtener registros de peso:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        count: data.length,
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obtener un registro de peso específico
 */
export const getWeightLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error al obtener registro de peso con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Registro de peso no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Crear un nuevo registro de peso
 */
export const createWeightLog = async (req: Request, res: Response) => {
  try {
    const { user_id, weight_kg, log_date, notes } =
      req.body as CreateWeightLogDTO;

    // Validación básica
    if (!user_id || !weight_kg) {
      return res.status(400).json({
        success: false,
        error: "ID de usuario y peso son obligatorios",
      });
    }

    if (weight_kg <= 0) {
      return res.status(400).json({
        success: false,
        error: "El peso debe ser mayor que cero",
      });
    }

    // Verificar que el usuario existe
    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error(`Error al verificar usuario con ID ${user_id}:`, userError);
      return res.status(500).json({
        success: false,
        error: userError.message,
      });
    }

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Crear el registro de peso
    const { data, error } = await supabase
      .from("weight_logs")
      .insert([
        {
          user_id,
          weight_kg,
          log_date: log_date || new Date().toISOString().split("T")[0],
          notes,
        },
      ])
      .select();

    if (error) {
      console.error("Error al crear registro de peso:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data: data[0],
      message: "Registro de peso creado exitosamente",
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Actualizar un registro de peso existente
 */
export const updateWeightLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateWeightLogDTO;

    // Verificar si hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionaron datos para actualizar",
      });
    }

    if (updateData.weight_kg && updateData.weight_kg <= 0) {
      return res.status(400).json({
        success: false,
        error: "El peso debe ser mayor que cero",
      });
    }

    // Verificar si el registro existe
    const { data: existingLog, error: checkError } = await supabase
      .from("weight_logs")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      console.error(
        `Error al verificar registro de peso con ID ${id}:`,
        checkError
      );
      return res.status(500).json({
        success: false,
        error: checkError.message,
      });
    }

    if (!existingLog) {
      return res.status(404).json({
        success: false,
        error: "Registro de peso no encontrado",
      });
    }

    // Actualizar el registro
    const { data, error } = await supabase
      .from("weight_logs")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error(
        `Error al actualizar registro de peso con ID ${id}:`,
        error
      );
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data[0],
      message: "Registro de peso actualizado exitosamente",
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Eliminar un registro de peso
 */
export const deleteWeightLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si el registro existe
    const { data: existingLog, error: checkError } = await supabase
      .from("weight_logs")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      console.error(
        `Error al verificar registro de peso con ID ${id}:`,
        checkError
      );
      return res.status(500).json({
        success: false,
        error: checkError.message,
      });
    }

    if (!existingLog) {
      return res.status(404).json({
        success: false,
        error: "Registro de peso no encontrado",
      });
    }

    // Eliminar el registro
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);

    if (error) {
      console.error(`Error al eliminar registro de peso con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Registro de peso eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Obtener el resumen de progreso de peso de un usuario
 */
export const getWeightProgressSummary = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error(`Error al verificar usuario con ID ${userId}:`, userError);
      return res.status(500).json({
        success: false,
        error: userError.message,
      });
    }

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Obtener todos los registros de peso ordenados por fecha
    const { data: weightLogs, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: true });

    if (error) {
      console.error(
        `Error al obtener registros de peso para usuario con ID ${userId}:`,
        error
      );
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!weightLogs || weightLogs.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No se encontraron registros de peso para este usuario",
      });
    }

    // Calcular el resumen de progreso
    const startingWeight = weightLogs[0].weight_kg;
    const currentWeight = weightLogs[weightLogs.length - 1].weight_kg;
    const weightChange = currentWeight - startingWeight;
    const weightChangePercentage = (weightChange / startingWeight) * 100;

    const firstLogDate = new Date(weightLogs[0].log_date);
    const lastLogDate = new Date(weightLogs[weightLogs.length - 1].log_date);
    const daysDifference = Math.max(
      1,
      (lastLogDate.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeksDifference = daysDifference / 7;
    const averageWeeklyChange =
      weeksDifference > 0 ? weightChange / weeksDifference : 0;

    const progressSummary = {
      user_id: userId,
      current_weight: currentWeight,
      starting_weight: startingWeight,
      weight_change: Number(weightChange.toFixed(2)),
      weight_change_percentage: Number(weightChangePercentage.toFixed(2)),
      average_weekly_change: Number(averageWeeklyChange.toFixed(2)),
      logs_count: weightLogs.length,
      first_log_date: weightLogs[0].log_date,
      last_log_date: weightLogs[weightLogs.length - 1].log_date,
    };

    return res.status(200).json({
      success: true,
      data: progressSummary,
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
