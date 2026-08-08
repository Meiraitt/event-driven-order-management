import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { idParamsSchema } from "../schemas/params.schema.js";
import { createProductBodySchema } from "../schemas/product.schema.js";

export const productRoutes = Router();

productRoutes.post("/", async (req, res) => {
  const body = createProductBodySchema.parse(req.body);

  const product = await prisma.product.create({
    data: {
      name: body.name,
      price: body.price,
      stock: body.stock,
    },
  });

  return res.status(201).json(product);
});

productRoutes.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(products);
});

productRoutes.get("/:id", async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);

  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  return res.json(product);
});
