const zmq = require("zeromq");
const socket = zmq.socket("sub");

socket.connect("tcp://127.0.0.1:5555");

// should match the topic name configured in config-nile.conf
socket.subscribe("block");

console.log("Subscribed to block events on tcp://127.0.0.1:5555");

socket.on("message", (topic, message) => {
  console.log("topic:", topic.toString());
  console.log("msg:", message.toString());
  console.log("----");
});
