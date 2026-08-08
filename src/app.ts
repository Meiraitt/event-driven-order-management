import cors from "cors";
import express from "express";
import { healthRoutes } from "./routes/health.routes.js";
import { orderRoutes } from "./routes/order.routes.js";
import { productRoutes } from "./routes/product.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

app.use(errorHandler);
