import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import {
  CreateFoodItemDTO,
  FoodItem,
  FoodItemSearchParams,
  NutritionalInfo,
  UpdateFoodItemDTO,
} from "../types/food-item.type";

/**
 * Obtener todos los alimentos con filtros, ordenamiento y paginación
 */
export const getFoodItems = async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      brand,
      minCalories,
      maxCalories,
      verified,
      limit = 20,
      offset = 0,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query as unknown as FoodItemSearchParams;

    // Iniciar la consulta
    let query = supabase.from("food_items").select("*", { count: "exact" });

    // Aplicar filtros si se proporcionan
    if (name) {
      query = query.ilike("name", `%${name}%`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (brand) {
      query = query.eq("brand", brand);
    }

    if (minCalories !== undefined) {
      query = query.gte("calories", minCalories);
    }

    if (maxCalories !== undefined) {
      query = query.lte("calories", maxCalories);
    }

    if (verified !== undefined) {
      query = query.eq("is_verified", verified);
    }

    // Aplicar ordenamiento
    if (sortBy && ["name", "calories", "created_at"].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    // Ejecutar la consulta
    const { data, error, count } = await query;

    if (error) {
      console.error("Error al obtener alimentos:", error);
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
 * Buscar alimentos por nombre (para autocompletado)
 */
export const searchFoodItems = async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.query as unknown as {
      query: string;
      limit: number;
    };

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: "La consulta de búsqueda debe tener al menos 2 caracteres",
      });
    }

    const { data, error } = await supabase
      .from("food_items")
      .select("id, name, brand, category, calories, serving_size, serving_unit")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(limit);

    if (error) {
      console.error("Error al buscar alimentos:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
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
 * Obtener un alimento por ID
 */
export const getFoodItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("food_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error al obtener alimento con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Alimento no encontrado",
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
 * Crear un nuevo alimento
 */
export const createFoodItem = async (req: Request, res: Response) => {
  try {
    const {
      name,
      calories,
      serving_size,
      serving_unit,
      protein = 0,
      carbs = 0,
      fat = 0,
      fiber = 0,
      sugar = 0,
      category,
      brand,
      is_verified = false,
    } = req.body as CreateFoodItemDTO;

    // Validación básica
    if (
      !name ||
      calories === undefined ||
      serving_size === undefined ||
      !serving_unit
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Nombre, calorías, tamaño de porción y unidad de porción son obligatorios",
      });
    }

    // Validar que los valores numéricos sean positivos
    if (
      calories < 0 ||
      serving_size <= 0 ||
      protein < 0 ||
      carbs < 0 ||
      fat < 0 ||
      fiber < 0 ||
      sugar < 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Los valores numéricos deben ser positivos",
      });
    }

    // Crear el alimento
    const { data, error } = await supabase
      .from("food_items")
      .insert([
        {
          name,
          calories,
          serving_size,
          serving_unit,
          protein,
          carbs,
          fat,
          fiber,
          sugar,
          category,
          brand,
          is_verified,
        },
      ])
      .select();

    if (error) {
      console.error("Error al crear alimento:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data: data[0],
      message: "Alimento creado exitosamente",
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
 * Actualizar un alimento existente
 */
export const updateFoodItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateFoodItemDTO;

    // Verificar si hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionaron datos para actualizar",
      });
    }

    // Validar que los valores numéricos sean positivos si están presentes
    if (
      (updateData.calories !== undefined && updateData.calories < 0) ||
      (updateData.serving_size !== undefined && updateData.serving_size <= 0) ||
      (updateData.protein !== undefined && updateData.protein < 0) ||
      (updateData.carbs !== undefined && updateData.carbs < 0) ||
      (updateData.fat !== undefined && updateData.fat < 0) ||
      (updateData.fiber !== undefined && updateData.fiber < 0) ||
      (updateData.sugar !== undefined && updateData.sugar < 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "Los valores numéricos deben ser positivos",
      });
    }

    // Verificar si el alimento existe
    const { data: existingItem, error: checkError } = await supabase
      .from("food_items")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      console.error(`Error al verificar alimento con ID ${id}:`, checkError);
      return res.status(500).json({
        success: false,
        error: checkError.message,
      });
    }

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: "Alimento no encontrado",
      });
    }

    // Actualizar el alimento
    const updatedData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("food_items")
      .update(updatedData)
      .eq("id", id)
      .select();

    if (error) {
      console.error(`Error al actualizar alimento con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data[0],
      message: "Alimento actualizado exitosamente",
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
 * Eliminar un alimento
 */
export const deleteFoodItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si el alimento existe
    const { data: existingItem, error: checkError } = await supabase
      .from("food_items")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      console.error(`Error al verificar alimento con ID ${id}:`, checkError);
      return res.status(500).json({
        success: false,
        error: checkError.message,
      });
    }

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: "Alimento no encontrado",
      });
    }

    // Eliminar el alimento
    const { error } = await supabase.from("food_items").delete().eq("id", id);

    if (error) {
      console.error(`Error al eliminar alimento con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alimento eliminado exitosamente",
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
 * Obtener todas las categorías únicas de alimentos
 */
export const getFoodCategories = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("food_items")
      .select("category")
      .not("category", "is", null)
      .order("category");

    if (error) {
      console.error("Error al obtener categorías:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Extraer categorías únicas
    const categories = [...new Set(data.map((item) => item.category))];

    return res.status(200).json({
      success: true,
      data: categories,
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
 * Obtener todas las marcas únicas de alimentos
 */
export const getFoodBrands = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("food_items")
      .select("brand")
      .not("brand", "is", null)
      .order("brand");

    if (error) {
      console.error("Error al obtener marcas:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Extraer marcas únicas
    const brands = [...new Set(data.map((item) => item.brand))];

    return res.status(200).json({
      success: true,
      data: brands,
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
 * Calcular información nutricional para una cantidad específica de un alimento
 */
export const calculateNutrition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.query as { amount: string };

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Se requiere una cantidad válida y positiva",
      });
    }

    const amountValue = Number(amount);

    // Obtener el alimento
    const { data: foodItem, error } = await supabase
      .from("food_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error al obtener alimento con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        error: "Alimento no encontrado",
      });
    }

    // Calcular la información nutricional basada en la cantidad
    const ratio = amountValue / foodItem.serving_size;
    const nutritionalInfo: NutritionalInfo = {
      calories: Math.round(foodItem.calories * ratio),
      protein: Number((foodItem.protein * ratio).toFixed(1)),
      carbs: Number((foodItem.carbs * ratio).toFixed(1)),
      fat: Number((foodItem.fat * ratio).toFixed(1)),
      fiber: Number((foodItem.fiber * ratio).toFixed(1)),
      sugar: Number((foodItem.sugar * ratio).toFixed(1)),
    };

    return res.status(200).json({
      success: true,
      data: {
        foodItem,
        amount: amountValue,
        unit: foodItem.serving_unit,
        nutritionalInfo,
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
 * Importar alimentos en lote
 */
export const bulkImportFoodItems = async (req: Request, res: Response) => {
  try {
    const foodItems = req.body as CreateFoodItemDTO[];

    if (!Array.isArray(foodItems) || foodItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un array de alimentos para importar",
      });
    }

    // Validar cada alimento
    for (const item of foodItems) {
      if (
        !item.name ||
        item.calories === undefined ||
        item.serving_size === undefined ||
        !item.serving_unit
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Todos los alimentos deben tener nombre, calorías, tamaño de porción y unidad de porción",
        });
      }
    }

    // Insertar los alimentos en lote
    const { data, error } = await supabase
      .from("food_items")
      .insert(foodItems)
      .select();

    if (error) {
      console.error("Error al importar alimentos en lote:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data,
      count: data.length,
      message: `${data.length} alimentos importados exitosamente`,
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
