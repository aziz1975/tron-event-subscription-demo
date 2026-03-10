const zmq = require("zeromq");

async function watchBlocks() {
  const socket = new zmq.Subscriber();

  socket.connect("tcp://127.0.0.1:5555");
  socket.subscribe("block");

  console.log("Subscribed to block events on tcp://127.0.0.1:5555");

  for await (const [topic, message] of socket) {
    console.log("topic:", topic.toString());
    console.log("msg:", message.toString());
    console.log("----");
  }
}

watchBlocks().catch(console.error);