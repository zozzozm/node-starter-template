"use strict";
import TradeBroker from "./server";
const server: TradeBroker = new TradeBroker(process.env.SERVER_PORT || 3000);
// starting the server
server.startServer();
