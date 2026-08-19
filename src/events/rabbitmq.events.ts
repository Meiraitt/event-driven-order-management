export const RabbitMQExchange = {
  Orders: "orders.exchange",
} as const;

export const RabbitMQQueue = {
  OrdersCreated: "orders.created.queue",
} as const;

export const RabbitMQRoutingKey = {
  OrderCreated: "order.created",
} as const;

export type RabbitMQRoutingKey =
  (typeof RabbitMQRoutingKey)[keyof typeof RabbitMQRoutingKey];
