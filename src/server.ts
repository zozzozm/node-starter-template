"use strict";
/*
  Import modules
  */
import bodyParser from "body-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import http from "http";
import https from "https";
import path from "path";

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
    constructor(private portGiven: any) {
        this.port = portGiven;
    }

    /**
     * This starts express server
     * @method startServer @public
     */
    public startServer() {
        // start the express server(s)
        this.initExpress();
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

        // and start!
        if (process.env.NODE_ENV === "dev") {
            http.createServer(this.app).listen(3000);
            console.info("Express started on (http://localhost:" + this.port + "/)");
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
}
