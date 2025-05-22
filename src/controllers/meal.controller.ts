import type { Request, Response } from "express"
import { supabase } from "../config/supabase"
import type {
  CreateMealDTO,
  CreateMealFoodItemDTO,
  MealFilterParams,
  MealNutritionSummary,
  UpdateMealDTO,
  UpdateMealFoodItemDTO,
} from "../types/meal.types"

/**
 * Obtener todas las comidas de un usuario con filtros
 */
export const getMeals = async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      start_date,
      end_date,
      meal_type,
      limit = 20,
      offset = 0,
    } = req.query as unknown as MealFilterParams

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "Se requiere el ID del usuario",
      })
    }

    // Iniciar la consulta
    let query = supabase.from("meals").select("*", { count: "exact" }).eq("user_id", user_id)

    // Aplicar filtros si se proporcionan
    if (start_date) {
      query = query.gte("meal_date", start_date)
    }

    if (end_date) {
      query = query.lte("meal_date", end_date)
    }

    if (meal_type) {
      query = query.eq("meal_type", meal_type)
    }

    // Ordenar por fecha y hora
    query = query.order("meal_date", { ascending: false }).order("meal_time", { ascending: false })

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    // Ejecutar la consulta
    const { data, error, count } = await query

    if (error) {
      console.error("Error al obtener comidas:", error)
      return res.status(500).json({
        success: false,
        error: error.message,
      })
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
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Obtener una comida específica con sus alimentos
 */
export const getMealById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Obtener la comida
    const { data: meal, error: mealError } = await supabase.from("meals").select("*").eq("id", id).single()

    if (mealError) {
      console.error(`Error al obtener comida con ID ${id}:`, mealError)
      return res.status(500).json({
        success: false,
        error: mealError.message,
      })
    }

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: "Comida no encontrada",
      })
    }

    // Obtener los alimentos de la comida con sus detalles
    const { data: mealFoodItems, error: foodItemsError } = await supabase
      .from("meal_food_items")
      .select(`
        id,
        meal_id,
        food_item_id,
        amount,
        created_at,
        food_items:food_item_id (*)
      `)
      .eq("meal_id", id)

    if (foodItemsError) {
      console.error(`Error al obtener alimentos de la comida con ID ${id}:`, foodItemsError)
      return res.status(500).json({
        success: false,
        error: foodItemsError.message,
      })
    }

    // Calcular la información nutricional para cada alimento
    const foodItemsWithNutrition = mealFoodItems.map((item) => {
      const foodItem = Array.isArray(item.food_items) ? item.food_items[0] : item.food_items
      const amount = item.amount
      const ratio = amount / foodItem.serving_size

      return {
        ...item,
        nutrition: {
          calories: Math.round(foodItem.calories * ratio),
          protein: Number((foodItem.protein * ratio).toFixed(1)),
          carbs: Number((foodItem.carbs * ratio).toFixed(1)),
          fat: Number((foodItem.fat * ratio).toFixed(1)),
          fiber: Number((foodItem.fiber * ratio).toFixed(1)),
          sugar: Number((foodItem.sugar * ratio).toFixed(1)),
        },
      }
    })

    // Calcular el resumen nutricional de la comida
    const nutritionSummary: MealNutritionSummary = foodItemsWithNutrition.reduce(
      (summary, item) => {
        return {
          total_calories: summary.total_calories + item.nutrition.calories,
          total_protein: Number((summary.total_protein + item.nutrition.protein).toFixed(1)),
          total_carbs: Number((summary.total_carbs + item.nutrition.carbs).toFixed(1)),
          total_fat: Number((summary.total_fat + item.nutrition.fat).toFixed(1)),
          total_fiber: Number((summary.total_fiber + item.nutrition.fiber).toFixed(1)),
          total_sugar: Number((summary.total_sugar + item.nutrition.sugar).toFixed(1)),
        }
      },
      {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_fiber: 0,
        total_sugar: 0,
      },
    )

    return res.status(200).json({
      success: true,
      data: {
        ...meal,
        food_items: foodItemsWithNutrition,
        nutrition_summary: nutritionSummary,
      },
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Crear una nueva comida
 */
export const createMeal = async (req: Request, res: Response) => {
  try {
    const { user_id, name, description, meal_date, meal_time, meal_type, food_items = [] } = req.body as CreateMealDTO

    // Validación básica
    if (!user_id || !name || !meal_type) {
      return res.status(400).json({
        success: false,
        error: "ID de usuario, nombre y tipo de comida son obligatorios",
      })
    }

    // Verificar que el usuario existe
    const { data: userExists, error: userError } = await supabase.from("users").select("id").eq("id", user_id).single()

    if (userError && userError.code !== "PGRST116") {
      console.error(`Error al verificar usuario con ID ${user_id}:`, userError)
      return res.status(500).json({
        success: false,
        error: userError.message,
      })
    }

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      })
    }

    // Crear la comida
    const { data: meal, error: mealError } = await supabase
      .from("meals")
      .insert([
        {
          user_id,
          name,
          description,
          meal_date: meal_date || new Date().toISOString().split("T")[0],
          meal_time: meal_time || new Date().toTimeString().split(" ")[0],
          meal_type,
          total_calories: 0, // Se actualizará automáticamente con el trigger
        },
      ])
      .select()

    if (mealError) {
      console.error("Error al crear comida:", mealError)
      return res.status(500).json({
        success: false,
        error: mealError.message,
      })
    }

    const mealId = meal[0].id

    // Si se proporcionaron alimentos, agregarlos a la comida
    if (food_items.length > 0) {
      const mealFoodItems = food_items.map((item) => ({
        meal_id: mealId,
        food_item_id: item.food_item_id,
        amount: item.amount,
      }))

      const { error: foodItemsError } = await supabase.from("meal_food_items").insert(mealFoodItems)

      if (foodItemsError) {
        console.error("Error al agregar alimentos a la comida:", foodItemsError)
        // No devolvemos error, solo lo registramos
      }
    }

    // Obtener la comida actualizada con el total de calorías
    const { data: updatedMeal, error: updatedMealError } = await supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .single()

    if (updatedMealError) {
      console.error(`Error al obtener comida actualizada con ID ${mealId}:`, updatedMealError)
      // No devolvemos error, solo lo registramos
    }

    return res.status(201).json({
      success: true,
      data: updatedMeal || meal[0],
      message: "Comida creada exitosamente",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Actualizar una comida existente
 */
export const updateMeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body as UpdateMealDTO

    // Verificar si hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionaron datos para actualizar",
      })
    }

    // Verificar si la comida existe
    const { data: existingMeal, error: checkError } = await supabase
      .from("meals")
      .select("id, user_id")
      .eq("id", id)
      .single()

    if (checkError) {
      console.error(`Error al verificar comida con ID ${id}:`, checkError)
      return res.status(500).json({
        success: false,
        error: checkError.message,
      })
    }

    if (!existingMeal) {
      return res.status(404).json({
        success: false,
        error: "Comida no encontrada",
      })
    }

    // Actualizar la comida
    const updatedData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("meals").update(updatedData).eq("id", id).select()

    if (error) {
      console.error(`Error al actualizar comida con ID ${id}:`, error)
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    return res.status(200).json({
      success: true,
      data: data[0],
      message: "Comida actualizada exitosamente",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Eliminar una comida
 */
export const deleteMeal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Verificar si la comida existe
    const { data: existingMeal, error: checkError } = await supabase.from("meals").select("id").eq("id", id).single()

    if (checkError) {
      console.error(`Error al verificar comida con ID ${id}:`, checkError)
      return res.status(500).json({
        success: false,
        error: checkError.message,
      })
    }

    if (!existingMeal) {
      return res.status(404).json({
        success: false,
        error: "Comida no encontrada",
      })
    }

    // Eliminar la comida (los alimentos asociados se eliminarán automáticamente por la restricción ON DELETE CASCADE)
    const { error } = await supabase.from("meals").delete().eq("id", id)

    if (error) {
      console.error(`Error al eliminar comida con ID ${id}:`, error)
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    return res.status(200).json({
      success: true,
      message: "Comida eliminada exitosamente",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Agregar un alimento a una comida
 */
export const addFoodItemToMeal = async (req: Request, res: Response) => {
  try {
    const { id: mealId } = req.params
    const { food_item_id, amount } = req.body as CreateMealFoodItemDTO

    // Validación básica
    if (!food_item_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "ID del alimento y cantidad (mayor que cero) son obligatorios",
      })
    }

    // Verificar si la comida existe
    const { data: existingMeal, error: mealError } = await supabase.from("meals").select("id").eq("id", mealId).single()

    if (mealError) {
      console.error(`Error al verificar comida con ID ${mealId}:`, mealError)
      return res.status(500).json({
        success: false,
        error: mealError.message,
      })
    }

    if (!existingMeal) {
      return res.status(404).json({
        success: false,
        error: "Comida no encontrada",
      })
    }

    // Verificar si el alimento existe
    const { data: existingFoodItem, error: foodItemError } = await supabase
      .from("food_items")
      .select("id")
      .eq("id", food_item_id)
      .single()

    if (foodItemError) {
      console.error(`Error al verificar alimento con ID ${food_item_id}:`, foodItemError)
      return res.status(500).json({
        success: false,
        error: foodItemError.message,
      })
    }

    if (!existingFoodItem) {
      return res.status(404).json({
        success: false,
        error: "Alimento no encontrado",
      })
    }

    // Verificar si el alimento ya está en la comida
    const { data: existingMealFoodItem, error: checkError } = await supabase
      .from("meal_food_items")
      .select("id")
      .eq("meal_id", mealId)
      .eq("food_item_id", food_item_id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error al verificar si el alimento ya está en la comida:", checkError)
      return res.status(500).json({
        success: false,
        error: checkError.message,
      })
    }

    let result

    if (existingMealFoodItem) {
      // Si el alimento ya está en la comida, actualizar la cantidad
      const { data, error } = await supabase
        .from("meal_food_items")
        .update({ amount })
        .eq("id", existingMealFoodItem.id)
        .select()

      if (error) {
        console.error("Error al actualizar alimento en la comida:", error)
        return res.status(500).json({
          success: false,
          error: error.message,
        })
      }

      result = {
        data: data[0],
        message: "Cantidad de alimento actualizada en la comida",
      }
    } else {
      // Si el alimento no está en la comida, agregarlo
      const { data, error } = await supabase
        .from("meal_food_items")
        .insert([
          {
            meal_id: mealId,
            food_item_id,
            amount,
          },
        ])
        .select()

      if (error) {
        console.error("Error al agregar alimento a la comida:", error)
        return res.status(500).json({
          success: false,
          error: error.message,
        })
      }

      result = {
        data: data[0],
        message: "Alimento agregado a la comida exitosamente",
      }
    }

    // Obtener la comida actualizada con el total de calorías
    const { data: updatedMeal, error: updatedMealError } = await supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .single()

    if (updatedMealError) {
      console.error(`Error al obtener comida actualizada con ID ${mealId}:`, updatedMealError)
      // No devolvemos error, solo lo registramos
    }

    return res.status(200).json({
      success: true,
      ...result,
      meal: updatedMeal,
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Actualizar un alimento en una comida
 */
export const updateFoodItemInMeal = async (req: Request, res: Response) => {
  try {
    const { mealId, foodItemId } = req.params
    const { amount } = req.body as UpdateMealFoodItemDTO

    // Validación básica
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "La cantidad debe ser mayor que cero",
      })
    }

    // Verificar si el alimento está en la comida
    const { data: existingMealFoodItem, error: checkError } = await supabase
      .from("meal_food_items")
      .select("id")
      .eq("meal_id", mealId)
      .eq("food_item_id", foodItemId)
      .single()

    if (checkError) {
      console.error("Error al verificar si el alimento está en la comida:", checkError)
      return res.status(500).json({
        success: false,
        error: checkError.message,
      })
    }

    if (!existingMealFoodItem) {
      return res.status(404).json({
        success: false,
        error: "Alimento no encontrado en la comida",
      })
    }

    // Actualizar la cantidad del alimento
    const { data, error } = await supabase
      .from("meal_food_items")
      .update({ amount })
      .eq("id", existingMealFoodItem.id)
      .select()

    if (error) {
      console.error("Error al actualizar alimento en la comida:", error)
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    // Obtener la comida actualizada con el total de calorías
    const { data: updatedMeal, error: updatedMealError } = await supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .single()

    if (updatedMealError) {
      console.error(`Error al obtener comida actualizada con ID ${mealId}:`, updatedMealError)
      // No devolvemos error, solo lo registramos
    }

    return res.status(200).json({
      success: true,
      data: data[0],
      meal: updatedMeal,
      message: "Cantidad de alimento actualizada en la comida",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Eliminar un alimento de una comida
 */
export const removeFoodItemFromMeal = async (req: Request, res: Response) => {
  try {
    const { mealId, foodItemId } = req.params

    // Verificar si el alimento está en la comida
    const { data: existingMealFoodItem, error: checkError } = await supabase
      .from("meal_food_items")
      .select("id")
      .eq("meal_id", mealId)
      .eq("food_item_id", foodItemId)
      .single()

    if (checkError) {
      console.error("Error al verificar si el alimento está en la comida:", checkError)
      return res.status(500).json({
        success: false,
        error: checkError.message,
      })
    }

    if (!existingMealFoodItem) {
      return res.status(404).json({
        success: false,
        error: "Alimento no encontrado en la comida",
      })
    }

    // Eliminar el alimento de la comida
    const { error } = await supabase.from("meal_food_items").delete().eq("id", existingMealFoodItem.id)

    if (error) {
      console.error("Error al eliminar alimento de la comida:", error)
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    // Obtener la comida actualizada con el total de calorías
    const { data: updatedMeal, error: updatedMealError } = await supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .single()

    if (updatedMealError) {
      console.error(`Error al obtener comida actualizada con ID ${mealId}:`, updatedMealError)
      // No devolvemos error, solo lo registramos
    }

    return res.status(200).json({
      success: true,
      meal: updatedMeal,
      message: "Alimento eliminado de la comida exitosamente",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * Obtener el resumen diario de comidas de un usuario
 */
export const getDailyMealsSummary = async (req: Request, res: Response) => {
  try {
    const { user_id, date } = req.query as { user_id: string; date: string }

    if (!user_id || !date) {
      return res.status(400).json({
        success: false,
        error: "Se requiere el ID del usuario y la fecha",
      })
    }

    // Obtener todas las comidas del usuario para la fecha especificada
    const { data: meals, error } = await supabase
      .from("meals")
      .select(`
        id,
        name,
        meal_type,
        total_calories,
        meal_food_items (
          id,
          food_item_id,
          amount,
          food_items:food_item_id (*)
        )
      `)
      .eq("user_id", user_id)
      .eq("meal_date", date)

    if (error) {
      console.error("Error al obtener comidas del usuario:", error)
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    // Calcular el resumen nutricional para cada comida
    const mealsWithNutrition = meals.map((meal) => {
      const nutritionSummary = meal.meal_food_items.reduce(
        (summary: any, item: any) => {
          const foodItem = item.food_items
          const amount = item.amount
          const ratio = amount / foodItem.serving_size

          return {
            calories: summary.calories + Math.round(foodItem.calories * ratio),
            protein: summary.protein + Number((foodItem.protein * ratio).toFixed(1)),
            carbs: summary.carbs + Number((foodItem.carbs * ratio).toFixed(1)),
            fat: summary.fat + Number((foodItem.fat * ratio).toFixed(1)),
            fiber: summary.fiber + Number((foodItem.fiber * ratio).toFixed(1)),
            sugar: summary.sugar + Number((foodItem.sugar * ratio).toFixed(1)),
          }
        },
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
        },
      )

      return {
        ...meal,
        nutrition: nutritionSummary,
      }
    })

    // Calcular el resumen total del día
    const dailySummary = {
      date,
      total_calories: mealsWithNutrition.reduce((sum, meal) => sum + meal.total_calories, 0),
      meals: {
        breakfast: [] as any[],
        lunch: [] as any[],
        dinner: [] as any[],
        snack: [] as any[],
      },
      nutrition: {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_fiber: 0,
        total_sugar: 0,
      },
    }

    // Organizar las comidas por tipo
    type MealTypeKey = keyof typeof dailySummary.meals;
    mealsWithNutrition.forEach((meal) => {
      const mealType = meal.meal_type.toLowerCase() as MealTypeKey;

      if (Array.isArray(dailySummary.meals[mealType])) {
        (dailySummary.meals[mealType] as any[]).push({
          meal_id: meal.id,
          meal_name: meal.name,
          calories: meal.total_calories,
        })
      }

      // Sumar la nutrición
      dailySummary.nutrition.total_calories += meal.nutrition.calories
      dailySummary.nutrition.total_protein += meal.nutrition.protein
      dailySummary.nutrition.total_carbs += meal.nutrition.carbs
      dailySummary.nutrition.total_fat += meal.nutrition.fat
      dailySummary.nutrition.total_fiber += meal.nutrition.fiber
      dailySummary.nutrition.total_sugar += meal.nutrition.sugar
    })

    // Redondear los valores nutricionales
    dailySummary.nutrition.total_protein = Number(dailySummary.nutrition.total_protein.toFixed(1))
    dailySummary.nutrition.total_carbs = Number(dailySummary.nutrition.total_carbs.toFixed(1))
    dailySummary.nutrition.total_fat = Number(dailySummary.nutrition.total_fat.toFixed(1))
    dailySummary.nutrition.total_fiber = Number(dailySummary.nutrition.total_fiber.toFixed(1))
    dailySummary.nutrition.total_sugar = Number(dailySummary.nutrition.total_sugar.toFixed(1))

    return res.status(200).json({
      success: true,
      data: dailySummary,
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
