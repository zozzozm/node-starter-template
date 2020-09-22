"use strict";
/*
  Import modules
  */
import bodyParser, { json } from "body-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import http from "http";
import https from "https";
import path from "path";
import socketio from "socket.io";
import * as winston from "winston";
import WebSocket from "ws";
import { appSettings } from "./config/appSettings";
import { Subscribe } from "./model/Binance";
import appRouter = require("./routes/appRouter");
import restRouter = require("./routes/restRouter");
import LocalSocketio from "./services/WebSocket";
const url = "wss://stream.binance.com:9443/ws";
dotenv.config();

/**
 * @exports TradeBroker
 * @class
 */
export default class TradeBroker {

    public static needUpdateSubscribtion = false;
    public static types = [
        "ticker", "aggTrade", // "depth", // "trade", // depth20@1000ms
    ];

    public static coins = [
        "btcusdt", "bchbtc", "ethbtc", "xrpbtc", "trxbtc", "ltcbtc", "bnbbtc", "linkbtc",
        "zrxbtc", "xlmbtc", "adabtc", "sandbtc", "kmdbtc", "eosbtc", "yfibtc", "lendbtc",
        "iotabtc", "zecbtc", "omgbtc", "batbtc", "algobtc", "renbtc", "paxbtc", "antbtc",
        "iostbtc", "ftmbtc", "drepbtc", "xzcbtc", "databtc", "beambtc", "chrbtc", "zilbtc",
        "aionbtc", "wtcbtc", "bntbtc", "cvcbtc", "umabtc", "sushibtc", "bandbtc", "wnxmbtc",
        "oceanbtc", "yfiibtc", "troybtc", "stmxbtc", "ctxcbtc", "runebtc", "fetbtc", "celrbtc",
        "rvnbtc", "hbarbtc", "crvbtc", "mthbtc", "sxpbtc", "enjbtc", "balbtc", "srmbtc", "atombtc",
        "qtumbtc", "iotxbtc", "rlcbtc", "hotbtc", "storjbtc", "nmrbtc", "rsrbtc", "bcptbtc", "perlbtc",
        "trbbtc", "compbtc", "chzbtc", "mcobtc", "dockbtc", "pntbtc", "tctbtc", "ognbtc", "ankrbtc",
        "maticbtc", "thetabtc", "tomobtc", "kavabtc", "solbtc", "nulsbtc", "mithbtc", "nknbtc", "vitebtc",
        "stptbtc", "duskbtc", "cosbtc", "ctsibtc", "nanobtc", "ambbtc", "sntbtc", "qspbtc", "agibtc", "appcbtc",
        "unibtc", "vibebtc", "brdbtc", "audbtc", "dotbtc", "belbtc", "bzrxbtc", "wingbtc", "btsbtc", "lskbtc",
        "mtlbtc", "gtobtc", "dltbtc", "oaxbtc", "bchusdt", "ethusdt", "xrpusdt", "trxusdt", "ltcusdt",
        "bnbusdt", "linkusdt", "zrxusdt", "xlmusdt", "adausdt", "sandusdt", "kmdusdt", "eosusdt", "yfiusdt",
        "lendusdt", "zecusdt", "omgusdt", "batusdt", "algousdt", "renusdt", "paxusdt", "antusdt", "iostusdt",
        "ftmusdt", "drepusdt", "xzcusdt", "datausdt", "beamusdt", "chrusdt", "funusdt", "zilusdt", "aionusdt",
        "wtcusdt", "bntusdt", "cvcusdt", "umausdt", "bttusdt", "sushiusdt", "bandusdt", "wnxmusdt", "oceanusdt",
        "yfiiusdt", "troyusdt", "keyusdt", "dentusdt", "stmxusdt", "ctxcusdt", "runeusdt", "fetusdt", "celrusdt",
        "rvnusdt", "enjusdt", "balusdt", "srmusdt", "atomusdt", "sxpusdt", "crvusdt", "mftusdt", "hbarusdt",
        "qtumusdt", "iotxusdt", "rlcusdt", "hotusdt", "storjusdt", "nmrusdt", "rsrusdt", "perlusdt", "trbusdt",
        "compusdt", "chzusdt", "mcousdt", "dockusdt", "pntusdt", "tctusdt", "ognusdt", "iotausdt", "ankrusdt",
        "maticusdt", "thetausdt", "tomousdt", "kavausdt", "solusdt", "npxsusdt", "nulsusdt", "mithusdt",
        "nknusdt", "viteusdt", "stptusdt", "duskusdt", "cosusdt", "ctsiusdt", "nanousdt", "uniusdt",
        "audusdt", "dotusdt", "bzrxusdt", "wingusdt", "lskusdt", "gtousdt",
    ];

    public static extra = [
        "!miniTicker@arr@3000ms",
    ];

    public port: any;
    public SocketServer = new LocalSocketio();
    public io!: SocketIO.Server;
    private app: any; // express server
    constructor(portGiven: any) {
        this.port = portGiven;
    }

    /**
     * This starts express server
     * @method startServer @public
     */
    public startServer() {
        // start the express server(s)
        this.initWinston();
        this.initExpress();
    }

    /**
     * This Initilatizes the winston
     * @method initWinston @private
     */
    private initWinston() {
        // Create the logger
        const config = process.env.NODE_ENV === "prod" ? appSettings.winston.prod : appSettings.winston.dev;
        winston.remove(winston.transports.Console);
        winston.add(winston.createLogger(config));
        process.on("uncaughtException", (err) => winston.error("uncaught exception: ", err));
        process.on("unhandledRejection", (reason, p) => winston.error("unhandled rejection: ", reason, p));

        winston.info("Winston has been init");
    }

    /**
     * This Initilatizes express server
     * @method initExpress @private
     */
    private initExpress() {
        // create express
        this.app = express();
        this.initCORS();

        // view engine setup
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");

        this.app.use(express.static(path.join(__dirname, "public")));

        // parse application/x-www-form-urlencoded
        this.app.use(bodyParser.urlencoded({ extended: false }));

        // parse application/json
        this.app.use(bodyParser.json());
        // parse text
        this.app.use(bodyParser.text());

        // add in any routes you might want
        this.initAppRoutes();

        this.app.use((err: any, req: any, res: any, next: any) => {

            const msg = `${req.ip} | ${req.method} | ${req.protocol}://${req.host}${req.path}
             | body: ${JSON.stringify(req.body)}
             | stack: ${err.stack}`;
            winston.error(msg);
            res.status(err.status || 500);
            // render the error page
            if (process.env.NODE_ENV === "prod") {
                res.render("exception", { title: "500 | Exception" });
            }
            next(err);
        });


        const wsTicker = new WebSocket(url);
        wsTicker.onopen = () => { this.subscribeToAll(wsTicker, "ticker"); };
        wsTicker.onmessage = (data: any) => {
            const obj = JSON.parse(data.data);
            this.SocketServer.emitToSubscriber(obj.s + "@24hrTicker", obj);
        };
        wsTicker.onerror = (data) => { console.error("@24hrTicker " + data.message); };


        const wsAggTrade = new WebSocket(url);
        wsAggTrade.onopen = () => { this.subscribeToAll(wsAggTrade, "aggTrade"); };
        wsAggTrade.onmessage = (data: any) => {
            const obj = JSON.parse(data.data);
            this.SocketServer.emitToSubscriber(obj.s + "@aggTrade", obj);
        };
        wsAggTrade.onerror = (data) => { console.error("@aggTrade " + data.message); };



        // and start!
        if (process.env.NODE_ENV === "dev") {
            // start websocket
            this.initWebSocket(http.createServer(this.app).listen(this.port));
            winston.info("Express started on (http://localhost:" + this.port + "/)");

        } else {
            // const sslkey = fs.readFileSync(process.env.SSL_KEY || "", "utf8");
            // const sslcert = fs.readFileSync(process.env.SSL_CERT || "", "utf8");
            // const ca = fs.readFileSync(process.env.SSL_CHAIN || "", "utf8");
            // const options = { key: sslkey, cert: sslcert, ca: ca };

            // this.initWebSocket(https.createServer(options, this.app).listen(this.port));
            // winston.info("Express started on (https://localhost:" + this.port + "/)");
        }
    }

    /**
     * This Initilatizes cors package
     * @method initCORS @private
     */
    private initCORS() {
        this.app.use(cors());
    }

    /**
     * This Initilatizes routes for server
     * @method initAppRoutes @private
     */
    private initAppRoutes() {
        this.app.use(process.env.API_BASE, restRouter);
        this.app.use("/", appRouter);
    }

    /**
     * This Initilatizes websocket
     * @method initWebSocket @private
     * @returns {void}
     */
    private initWebSocket(server: any): void {
        // whenever a user connects on port 3000 via
        // a websocket, log that a user has connected
        this.io = socketio(server, {
            path: "/ws",
            pingInterval: 10000000,
            pingTimeout: 5000,
          });
        this.SocketServer.init(this.io);
    }

    private GenerateAllStreams(type: string) {
        const all: string[] = [];

        TradeBroker.coins.forEach((i) => {
            all.push(i + "@" + type);
        });

        return all;
    }

    private subscribeToAll(ws: any, type: string) {
        // console.log(`subscibed to ${TradeBroker.coins.length} coins`);
        ws.send(JSON.stringify(new Subscribe(this.GenerateAllStreams(type))));
        // console.log(JSON.stringify(new Subscribe(this.GenerateAllStreams())));
    }

}
