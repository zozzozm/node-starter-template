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
import * as winston from "winston";
import { appSettings} from "./config/appSettings";
import appRouter = require("./routes/appRouter");
import restRouter = require("./routes/restRouter");

dotenv.config();

/**
 * @exports ScooterApp
 * @class
 */
export default class ScooterApp {

    public port: any;
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
        winston.add(winston.createLogger( config ));
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

        // and start!
        http.createServer(this.app).listen(this.port);
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
}
