import dotenv from "dotenv";
import path from "path";
import express from "express";
import helmet from "helmet";
import {rateLimit} from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";
import methodOverride from "method-override";

import {db, APP_ENV} from "./configs";
import route from "./routes";
import {httpRequestHandler, errorHandler, notFoundHandler} from "@/utils/handlers";
import {PUBLIC_DIR} from "@/utils/Constants";

import commands from "./app/commands";

// Load Environment variables
dotenv.config();

// Middleware options parameter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 1000, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
    standardHeaders: "draft-7", // draft-6: RateLimit-* headers; draft-7: combined RateLimit header
    legacyHeaders: false, // X-RateLimit-* headers
    // store: ... , // Use an external store for more precise rate limiting
});
const corsOptions = {
    origin: JSON.parse(process.env.DOMAIN_CLIENT),
    credentials: true,
};
const cookieOptions = {
    secret: process.env.SECRET_KEY,
};
const nodeEnv = process.env.NODE_ENV;

// Init app
const app = express();
app.set("env", Object.values(APP_ENV).includes(nodeEnv) ? nodeEnv : APP_ENV.DEVELOPMENT);
app.use("/", express.static(PUBLIC_DIR));
app.use(helmet());
app.use(limiter);
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser(cookieOptions));
app.use(methodOverride("_method"));

// Config logger
if (app.settings.env === APP_ENV.DEVELOPMENT) {
    app.use(httpRequestHandler);

    // Connect to Database
    db.connect(true);
} else {
    db.connect();
}

// Init routes
route(app);

// Not found handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Configure EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join('src', 'views'));

// Run Server
const port = process.env.PORT || 3001;

app.listen(port, function () {
    var timeStart = new Date();
    console.log(`${timeStart} - App listening at http://localhost:${port} in ${app.settings.env} mode`);
});

// Cron job
commands();
