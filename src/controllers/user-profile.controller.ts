import type { Request, Response } from "express";
import { supabase } from "../config/supabase";
import type { UpsertUserProfileDTO } from "../types/user-profile.types";
import { ActivityLevel, Gender } from "../types/user-profile.types";

/**
 * Obtener el perfil de un usuario
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Verificar si el usuario existe
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

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error(
        `Error al obtener perfil de usuario con ID ${userId}:`,
        profileError
      );
      return res.status(500).json({
        success: false,
        error: profileError.message,
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Perfil de usuario no encontrado",
      });
    }

    // Calcular estadísticas adicionales si hay suficiente información
    let stats = {};
    if (
      profile.height_cm &&
      profile.weight_kg &&
      profile.age &&
      profile.gender &&
      profile.activity_level
    ) {
      // Calcular BMI (Índice de Masa Corporal)
      const heightM = profile.height_cm / 100;
      const bmi = profile.weight_kg / (heightM * heightM);

      // Determinar categoría de BMI
      let bmiCategory = "";
      if (bmi < 18.5) bmiCategory = "Bajo peso";
      else if (bmi < 25) bmiCategory = "Peso normal";
      else if (bmi < 30) bmiCategory = "Sobrepeso";
      else bmiCategory = "Obesidad";

      // Calcular BMR (Tasa Metabólica Basal) usando la ecuación de Mifflin-St Jeor
      let bmr = 0;
      if (profile.gender.toLowerCase() === Gender.MALE) {
        bmr =
          10 * profile.weight_kg +
          6.25 * profile.height_cm -
          5 * profile.age +
          5;
      } else {
        bmr =
          10 * profile.weight_kg +
          6.25 * profile.height_cm -
          5 * profile.age -
          161;
      }

      // Calcular TDEE (Gasto Energético Total Diario)
      const tdee = bmr * profile.activity_level;

      // Calcular distribución de macronutrientes
      const macrosDistribution = {
        protein_percentage: profile.daily_protein_goal
          ? ((profile.daily_protein_goal * 4) / profile.daily_calorie_goal) *
            100
          : 0,
        carbs_percentage: profile.daily_carbs_goal
          ? ((profile.daily_carbs_goal * 4) / profile.daily_calorie_goal) * 100
          : 0,
        fat_percentage: profile.daily_fat_goal
          ? ((profile.daily_fat_goal * 9) / profile.daily_calorie_goal) * 100
          : 0,
      };

      stats = {
        bmi: Math.round(bmi * 10) / 10,
        bmi_category: bmiCategory,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        macros_distribution: {
          protein_percentage: Math.round(macrosDistribution.protein_percentage),
          carbs_percentage: Math.round(macrosDistribution.carbs_percentage),
          fat_percentage: Math.round(macrosDistribution.fat_percentage),
        },
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        ...profile,
        ...stats,
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
 * Crear o actualizar el perfil de un usuario
 */
export const upsertUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profileData = req.body as UpsertUserProfileDTO;

    // Verificar si el usuario existe
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

    // Validar datos
    if (profileData.height_cm && profileData.height_cm <= 0) {
      return res.status(400).json({
        success: false,
        error: "La altura debe ser mayor que cero",
      });
    }

    if (profileData.weight_kg && profileData.weight_kg <= 0) {
      return res.status(400).json({
        success: false,
        error: "El peso debe ser mayor que cero",
      });
    }

    if (profileData.age && profileData.age <= 0) {
      return res.status(400).json({
        success: false,
        error: "La edad debe ser mayor que cero",
      });
    }

    if (
      profileData.activity_level &&
      ![
        ActivityLevel.SEDENTARY,
        ActivityLevel.LIGHTLY_ACTIVE,
        ActivityLevel.MODERATELY_ACTIVE,
        ActivityLevel.VERY_ACTIVE,
        ActivityLevel.EXTRA_ACTIVE,
      ].includes(profileData.activity_level)
    ) {
      return res.status(400).json({
        success: false,
        error: "Nivel de actividad no válido",
      });
    }

    // Verificar si el perfil ya existe
    const { data: existingProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error(
        `Error al verificar perfil existente para usuario con ID ${userId}:`,
        profileError
      );
      return res.status(500).json({
        success: false,
        error: profileError.message,
      });
    }

    let result;
    const now = new Date().toISOString();

    if (existingProfile) {
      // Actualizar perfil existente
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...profileData,
          updated_at: now,
        })
        .eq("id", userId)
        .select();

      if (error) {
        console.error(
          `Error al actualizar perfil de usuario con ID ${userId}:`,
          error
        );
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      result = {
        data: data[0],
        message: "Perfil de usuario actualizado exitosamente",
      };
    } else {
      // Crear nuevo perfil
      const { data, error } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: userId,
            ...profileData,
            created_at: now,
            updated_at: now,
          },
        ])
        .select();

      if (error) {
        console.error(
          `Error al crear perfil de usuario con ID ${userId}:`,
          error
        );
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      result = {
        data: data[0],
        message: "Perfil de usuario creado exitosamente",
      };
    }

    return res.status(200).json({
      success: true,
      ...result,
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
 * Calcular objetivos nutricionales basados en el perfil
 */
export const calculateNutritionGoals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { goal_type } = req.query as {
      goal_type: "maintain" | "lose" | "gain";
    };

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error(
        `Error al obtener perfil de usuario con ID ${userId}:`,
        profileError
      );
      return res.status(500).json({
        success: false,
        error: profileError.message,
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Perfil de usuario no encontrado",
      });
    }

    // Verificar que tenemos suficiente información para calcular
    if (
      !profile.height_cm ||
      !profile.weight_kg ||
      !profile.age ||
      !profile.gender ||
      !profile.activity_level
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Se requiere altura, peso, edad, género y nivel de actividad para calcular objetivos nutricionales",
      });
    }

    // Calcular BMR (Tasa Metabólica Basal) usando la ecuación de Mifflin-St Jeor
    let bmr = 0;
    if (profile.gender.toLowerCase() === Gender.MALE) {
      bmr =
        10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5;
    } else {
      bmr =
        10 * profile.weight_kg +
        6.25 * profile.height_cm -
        5 * profile.age -
        161;
    }

    // Calcular TDEE (Gasto Energético Total Diario)
    const tdee = bmr * profile.activity_level;

    // Ajustar calorías según el objetivo
    let calorieGoal = tdee;
    if (goal_type === "lose") {
      calorieGoal = tdee - 500; // Déficit de 500 calorías para perder peso
    } else if (goal_type === "gain") {
      calorieGoal = tdee + 500; // Superávit de 500 calorías para ganar peso
    }

    // Calcular macronutrientes (distribución estándar: 30% proteínas, 40% carbohidratos, 30% grasas)
    const proteinPercentage = 0.3;
    const carbsPercentage = 0.4;
    const fatPercentage = 0.3;

    const proteinGoal = Math.round((calorieGoal * proteinPercentage) / 4); // 4 calorías por gramo de proteína
    const carbsGoal = Math.round((calorieGoal * carbsPercentage) / 4); // 4 calorías por gramo de carbohidratos
    const fatGoal = Math.round((calorieGoal * fatPercentage) / 9); // 9 calorías por gramo de grasa

    // Crear objeto de objetivos nutricionales
    const nutritionGoals = {
      daily_calorie_goal: Math.round(calorieGoal),
      daily_protein_goal: proteinGoal,
      daily_carbs_goal: carbsGoal,
      daily_fat_goal: fatGoal,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goal_type,
    };

    return res.status(200).json({
      success: true,
      data: nutritionGoals,
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
 * Actualizar objetivos nutricionales en el perfil
 */
export const updateNutritionGoals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      daily_calorie_goal,
      daily_protein_goal,
      daily_carbs_goal,
      daily_fat_goal,
    } = req.body;

    // Validación básica
    if (
      !daily_calorie_goal ||
      !daily_protein_goal ||
      !daily_carbs_goal ||
      !daily_fat_goal
    ) {
      return res.status(400).json({
        success: false,
        error: "Se requieren todos los objetivos nutricionales",
      });
    }

    // Verificar si el perfil existe
    const { data: existingProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error(
        `Error al verificar perfil existente para usuario con ID ${userId}:`,
        profileError
      );
      return res.status(500).json({
        success: false,
        error: profileError.message,
      });
    }

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: "Perfil de usuario no encontrado",
      });
    }

    // Actualizar objetivos nutricionales
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        daily_calorie_goal,
        daily_protein_goal,
        daily_carbs_goal,
        daily_fat_goal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (error) {
      console.error(
        `Error al actualizar objetivos nutricionales para usuario con ID ${userId}:`,
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
      message: "Objetivos nutricionales actualizados exitosamente",
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
