"use strict";
import ScooterApp from "./server";
const server: ScooterApp = new ScooterApp(process.env.API_PORT || 3000);
// starting the server
server.startServer();
