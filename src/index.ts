import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import foodItemsRoutes from "./routes/food-items.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";
import mealRoutes from "./routes/meal.routes";
import userProfileRoutes from "./routes/user-profile.routes";
import weightLogRoutes from "./routes/weight-log.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    message: "API de Conteo de Calorías",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      foodItems: "/api/food-items",
    },
  });
});

// Rutas
app.use("/api/users", userRoutes);
app.use("/api/food-items", foodItemsRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/user-profiles", userProfileRoutes);
app.use("/api/weight-logs", weightLogRoutes);

// Ruta de verificación de salud
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

// Para desarrollo local
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Servidor ejecutándose en el puerto ${port}`);
  });
}

export default app;
