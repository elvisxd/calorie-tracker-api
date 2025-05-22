import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import {
  LoginCredentials,
  RefreshTokenRequest,
  PasswordResetRequest,
  PasswordResetConfirmation,
} from "../types/auth.types";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Variables de entorno (deberían estar en un archivo .env)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const ACCESS_TOKEN_EXPIRY = "1h"; // 1 hora
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 días

// Login de usuario
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginCredentials;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email y contraseña son requeridos",
      });
    }

    // Buscar usuario por email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, password_hash, full_name, created_at, updated_at")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas",
      });
    }

    // Generar tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    // Guardar refresh token en la base de datos
    await supabase.from("tokens").insert([
      {
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    ]);

    // Calcular tiempo de expiración en segundos
    const decodedToken = jwt.decode(accessToken) as any;
    const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000);

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
        },
        expiresIn,
      },
      message: "Inicio de sesión exitoso",
    });
  } catch (error: any) {
    console.error("Error en login:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
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

    // Encriptar contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

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

    // Generar tokens para inicio de sesión automático
    const accessToken = jwt.sign(
      { userId: data[0].id, email: data[0].email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign({ userId: data[0].id }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    // Guardar refresh token
    await supabase.from("tokens").insert([
      {
        user_id: data[0].id,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    ]);

    // Calcular tiempo de expiración en segundos
    const decodedToken = jwt.decode(accessToken) as any;
    const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000);

    return res.status(201).json({
      success: true,
      data: {
        user: data[0],
        accessToken,
        refreshToken,
        expiresIn,
      },
      message: "Usuario registrado exitosamente",
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Refrescar token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Token de actualización requerido",
      });
    }

    // Verificar validez del refresh token
    let decodedToken;
    try {
      decodedToken = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Token de actualización inválido o expirado",
      });
    }

    const userId = decodedToken.userId;

    // Verificar si el token existe en la base de datos
    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("refresh_token", refreshToken)
      .single();

    if (tokenError || !tokenData) {
      return res.status(401).json({
        success: false,
        error: "Token de actualización inválido",
      });
    }

    // Verificar si el token ha expirado en la base de datos
    const tokenExpiry = new Date(tokenData.expires_at);
    if (tokenExpiry < new Date()) {
      // Eliminar token expirado
      await supabase.from("tokens").delete().eq("refresh_token", refreshToken);

      return res.status(401).json({
        success: false,
        error: "Token de actualización expirado",
      });
    }

    // Obtener información del usuario
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Generar nuevo access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generar nuevo refresh token (rotación de tokens)
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    // Actualizar token en la base de datos
    await supabase
      .from("tokens")
      .update({
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      })
      .eq("refresh_token", refreshToken);

    // Calcular tiempo de expiración en segundos
    const decodedAccessToken = jwt.decode(newAccessToken) as any;
    const expiresIn = decodedAccessToken.exp - Math.floor(Date.now() / 1000);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
        },
        expiresIn,
      },
      message: "Token actualizado exitosamente",
    });
  } catch (error: any) {
    console.error("Error al refrescar token:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Cerrar sesión
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Token de actualización requerido",
      });
    }

    // Eliminar el refresh token de la base de datos
    const { error } = await supabase
      .from("tokens")
      .delete()
      .eq("refresh_token", refreshToken);

    if (error) {
      console.error("Error al eliminar token:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  } catch (error: any) {
    console.error("Error en logout:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as PasswordResetRequest;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "El email es requerido",
      });
    }

    // Verificar si el usuario existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (userError || !user) {
      // Por seguridad, no indicamos si el email existe o no
      return res.status(200).json({
        success: true,
        message:
          "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña",
      });
    }

    // Generar token de recuperación
    const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Guardar token en la base de datos
    await supabase.from("password_resets").insert([
      {
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    ]);

    // Aquí se enviaría un email con el enlace de recuperación
    // Ejemplo: await sendPasswordResetEmail(email, resetToken);

    return res.status(200).json({
      success: true,
      message:
        "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña",
      // En entorno de desarrollo podemos devolver el token
      ...(process.env.NODE_ENV === "development" && { resetToken }),
    });
  } catch (error: any) {
    console.error("Error en recuperación de contraseña:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Restablecer contraseña
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body as PasswordResetConfirmation;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Token y nueva contraseña son requeridos",
      });
    }

    // Verificar validez del token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }

    const userId = decodedToken.userId;

    // Verificar si el token existe en la base de datos
    const { data: resetData, error: resetError } = await supabase
      .from("password_resets")
      .select("*")
      .eq("user_id", userId)
      .eq("token", token)
      .single();

    if (resetError || !resetData) {
      return res.status(401).json({
        success: false,
        error: "Token inválido",
      });
    }

    // Verificar si el token ha expirado
    const tokenExpiry = new Date(resetData.expires_at);
    if (tokenExpiry < new Date()) {
      return res.status(401).json({
        success: false,
        error: "Token expirado",
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña del usuario
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("Error al actualizar contraseña:", updateError);
      return res.status(500).json({
        success: false,
        error: updateError.message,
      });
    }

    // Eliminar token de recuperación
    await supabase.from("password_resets").delete().eq("token", token);

    // Invalidar sesiones existentes (opcional)
    await supabase.from("tokens").delete().eq("user_id", userId);

    return res.status(200).json({
      success: true,
      message: "Contraseña restablecida exitosamente",
    });
  } catch (error: any) {
    console.error("Error al restablecer contraseña:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
