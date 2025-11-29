const net = require("net");

const host = "smtp.gmail.com";
const port = 587; // test 465 or 25 too

const socket = net.createConnection(port, host, () => {
  console.log(`✅ Connected to ${host}:${port}`);
  socket.end();
});

socket.on("error", (err) => {
  console.log(`❌ Cannot connect to ${host}:${port} —`, err.message);
});
