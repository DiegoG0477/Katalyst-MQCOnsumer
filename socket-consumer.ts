import * as amqp from "amqplib/callback_api";
const socketIoClient = require("socket.io-client");
import { Socket } from "socket.io-client";

const USERNAME = "katalyst"
const PASSWORD = encodeURIComponent("guest12345");
const HOSTNAME = "44.217.29.217:"
const PORT = 5672
const RABBITMQ_DATA = "Medical";
const WEBSOCKET_SERVER_URL = "http://3.212.10.41/";

let socketIO: Socket;

async function sendDatatoAPI(data: any) {
  const apiUrl = 'https://fk5dcofqb55mxnedrc5e6p54oe0rnykq.lambda-url.us-east-1.on.aws/';

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

  console.log('API DATA RESPONSE: ',response);
}

async function connect() {
  try {
    amqp.connect(`amqp://${USERNAME}:${PASSWORD}@${HOSTNAME}:${PORT}`, (err: any, conn: amqp.Connection) => {
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
