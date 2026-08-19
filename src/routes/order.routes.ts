import { Router } from "express";
import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { createOrderBodySchema } from "../schemas/order.schema.js";
import { idParamsSchema } from "../schemas/params.schema.js";
import { AppError } from "../errors/app-error.js";
import { RabbitMQRoutingKey } from "../events/rabbitmq.events.js";
import { publishEvent } from "../lib/rabbitmq.js";
import { randomUUID } from "node:crypto";

export const orderRoutes = Router();

orderRoutes.post("/", async (req, res) => {
  const body = createOrderBodySchema.parse(req.body);

  const id = body.items.map((item) => item.productId);

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        id: {
          in: id,
        },
      },
    });

    const validateStock = products.every((product) => {
      const item = body.items.find((item) => item.productId === product.id);

      return item && item.quantity <= product.stock;
    });

    if (products.length !== body.items.length) {
      throw new AppError("Product not found", 404);
    }

    if (!validateStock) {
      throw new AppError("Invalid order", 400);
    }

    const total = body.items.reduce((acc, item) => {
      const product = products.find((product) => product.id === item.productId);

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      return acc.add(product.price.mul(item.quantity));
    }, new Prisma.Decimal(0));

    const order = await tx.order.create({
      data: {
        email: body.email,
        items: {
          create: body.items.map((item) => {
            const findProducts = products.find(
              (product) => product.id === item.productId,
            );

            if (!findProducts) {
              throw new AppError("Product not found", 404);
            }

            return {
              product: {
                connect: { id: item.productId },
              },
              quantity: item.quantity,
              unitPrice: findProducts.price,
              subtotal: findProducts.price.mul(item.quantity),
            };
          }),
        },
        total,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    for (const item of body.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  });

  await publishEvent({
    routingKey: RabbitMQRoutingKey.OrderCreated,
    payload: {
      eventId: randomUUID(),
      eventType: RabbitMQRoutingKey.OrderCreated,
      eventCreatedAt: new Date().toISOString(),
      data: {
        orderId: order.id,
        orderCreatedAt: order.createdAt,
        total: order.total.toString(),
        email: order.email,
        items: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
        })),
      },
    },
  });

  return res.status(201).json(order);
});

orderRoutes.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      items: {
        omit: {
          orderId: true,
          productId: true,
        },

        include: {
          product: {
            omit: {
              stock: true,
              createdAt: true,
              updatedAt: true,
              price: true,
            },
          },
        },
      },
    },
  });

  return res.json(orders);
});

orderRoutes.get("/:id", async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);

  const order = await prisma.order.findUnique({
    where: {
      id,
    },

    include: {
      items: {
        omit: {
          orderId: true,
          productId: true,
        },

        include: {
          product: {
            omit: {
              stock: true,
              createdAt: true,
              updatedAt: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  return res.json(order);
});
