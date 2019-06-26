import * as dotenv from "dotenv";
import { format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

dotenv.config();

const logPath = process.env.LOG_PATH || "./logs";

export const appSettings = {

    winston: {
        dev: {
            format: format.combine(
                format.colorize({all: true}),
                format.timestamp({format: new Date().toLocaleString("fa-IR", { hour12: false })}),
                format.align(),
                format.printf((x) => `${x.timestamp} | ${x.level} | ${x.message}`)),
                humanReadableUnhandledException: true,
                transports: [
                  new transports.Console({
                        handleExceptions: true,
                        level: "debug",
                }),
                ],
        },
        prod: {
            exceptionHandlers: [
                    new  DailyRotateFile({
                        datePattern: "YYYY-MM-DD",
                        filename: `${logPath}/%DATE%-exceptions.log`,
                        handleExceptions: true,
                        level: "error" }),
                  ],

            format: format.combine(
                format.timestamp({format: new Date().toLocaleString("fa-IR", { hour12: false })}),
                format.align(),
                format.prettyPrint(),
                format.printf((x) => `${x.timestamp} | ${x.level} | ${x.message}`)),

                humanReadableUnhandledException: true,
                transports: [
                  new DailyRotateFile({
                        datePattern: "YYYY-MM-DD",
                        filename: `${logPath}/%DATE%-error.log`,
                        level: "error" }),
                  new DailyRotateFile({
                        filename: `${logPath}/%DATE%-silly.log`,
                        level: "silly",
                    }),
                  new transports.Console({
                        handleExceptions: true,
                        level: "debug",
                }),
                ],

        },
    },
};
