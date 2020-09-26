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
import LocalSocketio from "./services/LocalSocketio";
const url = "wss://stream.binance.com:9443/ws";
dotenv.config();

/**
 * @exports TradeBroker
 * @class
 */
export default class TradeBroker {

    public static ws: WebSocket[] = [];
    public static needUpdateSubscribtion = false;

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

        // // view engine setup
        // this.app.set("views", path.join(__dirname, "views"));
        // this.app.set("view engine", "pug");

        // this.app.use(express.static(path.join(__dirname, "public")));

        // // parse application/x-www-form-urlencoded
        // this.app.use(bodyParser.urlencoded({ extended: false }));

        // // parse application/json
        // this.app.use(bodyParser.json());
        // // parse text
        // this.app.use(bodyParser.text());

        // // add in any routes you might want
        // this.initAppRoutes();

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

        this.subscribeCoins("ticker", "@24hrTicker");
        this.subscribeCoins("aggTrade", "@aggTrade");
        this.depthSocket();

        // and start!
        // start websocket
        this.initWebSocket(http.createServer(this.app).listen(this.port));
        winston.info("Express started on (http://localhost:" + this.port + "/)");

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
        this.io = socketio(server, {
            path: "/ws",
            pingInterval: 20000,
            pingTimeout: 5000,
        });
        this.SocketServer.init(this.io);
    }

    private GenerateAllStreams(type: string) {
        const all: string[] = [];
        TradeBroker.coins.forEach((i) => { all.push(i + "@" + type); });
        return all;
    }

    private subscribeToAll(ws: any, type: string) {
        ws.send(JSON.stringify(new Subscribe(this.GenerateAllStreams(type))));
    }


    private subscribeCoins(topics: string, responseTopic: string, allCoin: boolean = true) {
        const ws = new WebSocket(url);
        ws.onopen = () => {
            console.error(topics + " opened");
            if (allCoin) {
                this.subscribeToAll(ws, topics);
            } else {
                ws.send(JSON.stringify(new Subscribe([topics])));
            }
        };
        ws.onmessage = (data: any) => {
            const obj = JSON.parse(data.data);
            if (allCoin) {
                this.SocketServer.emitToSubscriber(obj.s + responseTopic, obj);
            } else { 
                this.SocketServer.emitToSubscriber(responseTopic, obj); 
            }
        };
        ws.onerror = (data) => { console.error("error on: " + topics + "  " + data.message); };
        ws.onclose = () => {
            console.error(topics + " closed");
            setTimeout(() => {
                console.error(topics + " reconnecting ...");
                this.subscribeCoins(topics, responseTopic, allCoin);
            }, 2000);
        };
        TradeBroker.ws.push(ws);
    }

    private depthSocket() {
        const reqTopic = "@depth20@1000ms";
        TradeBroker.coins.forEach(async (coin) => {
            this.subscribeCoins(coin + reqTopic, coin.toUpperCase() + reqTopic, false);
            await this.delay(10);
        });
    }

    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

}
