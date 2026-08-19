import type { RabbitMQRoutingKey } from "../events/rabbitmq.events.js";

export type OrderCreatedEvent = {
  eventId: string;
  eventType: typeof RabbitMQRoutingKey.OrderCreated;
  eventCreatedAt: string;
  data: {
    orderId: string;
    orderCreatedAt: Date | string;
    total: string;
    email: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: string;
      subtotal: string;
    }[];
  };
};
