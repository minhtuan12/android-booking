import { config as loadEnv } from "dotenv";
import { connect as connectToMongodb, set } from "mongoose";
import logger from "./Logger";

loadEnv();

export async function connect(debug = false) {
    try {
        await connectToMongodb(
            "mongodb://" +
            process.env.DB_HOST +
            (process.env.DB_PORT ? ":" + process.env.DB_PORT : ""),
            {
                dbName: process.env.DB_NAME,
                user: process.env.DB_USER,
                pass: process.env.DB_PASS,
                autoCreate: true,
                autoIndex: true,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 10000,
                authSource: "admin",
            }
        );
        console.info("Database - Connect successfully !!!");
        set("debug", debug);
    } catch (error) {
        console.error("Database - Connect failure!!!");
        logger.error(`${error}`);
    }
}
