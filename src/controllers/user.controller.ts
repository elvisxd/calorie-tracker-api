import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { CreateUserDTO, UpdateUserDTO } from "../types/user.types";

// Obtener todos los usuarios
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, created_at, updated_at");

    if (error) {
      console.error("Error al obtener usuarios:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Obtener un usuario por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
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

// Crear un nuevo usuario
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password_hash, full_name } = req.body as CreateUserDTO;

    // Validación básica
    if (!email || !password_hash) {
      return res.status(400).json({
        success: false,
        error: "El email y la contraseña son obligatorios",
      });
    }

    // Verificar si el email ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 es el código cuando no se encuentra ningún registro
      console.error("Error al verificar usuario existente:", checkError);
      return res.status(500).json({
        success: false,
        error: checkError.message,
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Ya existe un usuario con este email",
      });
    }

    // Crear el usuario
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password_hash,
          full_name: full_name || null,
        },
      ])
      .select("id, email, full_name, created_at, updated_at");

    if (error) {
      console.error("Error al crear usuario:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Crear perfil asociado
    await supabase.from("profiles").insert([
      {
        id: data[0].id,
        bio: null,
        website: null,
      },
    ]);

    return res.status(201).json({
      success: true,
      data: data[0],
      message: "Usuario creado exitosamente",
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Actualizar un usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, full_name } = req.body as UpdateUserDTO;

    // Verificar si hay datos para actualizar
    if (!email && full_name === undefined) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionaron datos para actualizar",
      });
    }

    // Verificar si el usuario existe
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      console.error(`Error al verificar usuario con ID ${id}:`, checkError);
      return res.status(500).json({
        success: false,
        error: checkError.message,
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Si se actualiza el email, verificar que no exista otro usuario con ese email
    if (email) {
      const { data: emailExists, error: emailCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", id)
        .single();

      if (emailCheckError && emailCheckError.code !== "PGRST116") {
        console.error("Error al verificar email existente:", emailCheckError);
        return res.status(500).json({
          success: false,
          error: emailCheckError.message,
        });
      }

      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: "Ya existe otro usuario con este email",
        });
      }
    }

    // Actualizar el usuario
    const updateData: any = {};
    if (email) updateData.email = email;
    if (full_name !== undefined) updateData.full_name = full_name;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select("id, email, full_name, created_at, updated_at");

    if (error) {
      console.error(`Error al actualizar usuario con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: data[0],
      message: "Usuario actualizado exitosamente",
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Eliminar un usuario
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError) {
      console.error(`Error al verificar usuario con ID ${id}:`, checkError);
      return res.status(500).json({
        success: false,
        error: checkError.message,
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Eliminar el usuario
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error(`Error al eliminar usuario con ID ${id}:`, error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
