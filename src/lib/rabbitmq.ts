import "dotenv/config";
import amqp, { type Channel, type ChannelModel } from "amqplib";
import {
  RabbitMQExchange,
  type RabbitMQRoutingKey,
} from "../events/rabbitmq.events.js";
import type { OrderCreatedEvent } from "../types/order.types.js";

type RabbitMQEventPayloadMap = {
  [RabbitMQRoutingKey.OrderCreated]: OrderCreatedEvent;
};

type PublishEventParams<TKey extends RabbitMQRoutingKey> = {
  routingKey: TKey;
  payload: RabbitMQEventPayloadMap[TKey];
};

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

function getRabbitMQUrl() {
  const RABBITMQ_URL = process.env["RABBITMQ_URL"];

  if (!RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL is not defined");
  }

  return RABBITMQ_URL;
}

export async function getRabbitMQChannel() {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect(getRabbitMQUrl());
  channel = await connection.createChannel();

  await channel.assertExchange(RabbitMQExchange.Orders, "topic", {
    durable: true,
  });

  return channel;
}

export async function publishEvent<TKey extends RabbitMQRoutingKey>({
  routingKey,
  payload,
}: PublishEventParams<TKey>) {
  const channel = await getRabbitMQChannel();

  channel.publish(
    RabbitMQExchange.Orders,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
      contentType: "application/json",
    },
  );
}
