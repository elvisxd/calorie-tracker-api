import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";

const router = Router();

// Rutas de autenticación
router.post("/login", login);
router.post("/register", register);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
