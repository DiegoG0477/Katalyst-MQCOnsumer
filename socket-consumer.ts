import * as amqp from "amqplib/callback_api";
const socketIoClient = require("socket.io-client");
import { Socket } from "socket.io-client";

const USERNAME = "katalyst"
const PASSWORD = encodeURIComponent("guest12345");
const HOSTNAME = "44.217.29.217"
const PORT = 5672
const RABBITMQ_DATA = "Medical";
const WEBSOCKET_SERVER_URL = "http://184.72.246.90/";

let socketIO: Socket;

async function sendDatatoAPI(data: any) {
  const apiUrl = 'http://44.221.150.52/medical/data';

  const requestData = {
    body: JSON.stringify(data),
  };

  console.log(requestData.body)

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestData.body,
  });

  console.log('API DATA RESPONSE: ',response.status);
}

async function connect() {
  try {
    const url = `amqp://${USERNAME}:${PASSWORD}@${HOSTNAME}:${PORT}`;
    amqp.connect(url, (err: any, conn: amqp.Connection) => {
      console.log("Connecting to RabbitMQ", url);
      if (err) throw new Error(err);

      conn.createChannel((errChanel: any, channel: amqp.Channel) => {
        if (errChanel) throw new Error(errChanel);

        channel.assertQueue(RABBITMQ_DATA, {durable:true, arguments:{"x-queue-type":"quorum"}});

        channel.consume(RABBITMQ_DATA, async (data: amqp.Message | null) => {
          if (data?.content !== undefined) {
            const parsedContent = JSON.parse(data.content.toString());
            console.log("data:medical:", parsedContent);
            socketIO.emit("data:medical", parsedContent);
            await sendDatatoAPI(parsedContent);
            channel.ack(data);
          }
        });

        socketIO = socketIoClient(WEBSOCKET_SERVER_URL);
      });
    });
  } catch (err: any) {
    throw new Error(err);
  }
}

connect();
