import {
  RabbitMQExchange,
  RabbitMQQueue,
  RabbitMQRoutingKey,
} from "../events/rabbitmq.events.js";
import { getRabbitMQChannel } from "../lib/rabbitmq.js";

async function main() {
  const channel = await getRabbitMQChannel();

  await channel.assertQueue(RabbitMQQueue.OrdersCreated, {
    durable: true,
  });

  await channel.bindQueue(
    RabbitMQQueue.OrdersCreated,
    RabbitMQExchange.Orders,
    RabbitMQRoutingKey.OrderCreated,
  );

  console.log("Listening to orders.created.queue");

  await channel.prefetch(1);

  await channel.consume(RabbitMQQueue.OrdersCreated, (message) => {
    if (!message) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString());

      console.log("Routing Key:", message.fields.routingKey);
      console.log(
        "Received order created event:",
        JSON.stringify(payload, null, 2),
      );

      channel.ack(message);
    } catch (error) {
      console.error(error);
      channel.nack(message, false, false);
    }
  });
}

main().catch((error) => {
  console.error("Error occurred:", error);
  process.exit(1);
});
