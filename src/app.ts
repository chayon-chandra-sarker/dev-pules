import express from "express";
import type { Application, Request, Response } from "express";
import { authRoute } from "./modules/auth/auth.route";
import cookieParser from "cookie-parser";
import logger from "./middleware/logger";
import cors from "cors";
import { issuesRouter } from "./modules/issues/issues.route";
import globalErrorHandler from "./middleware/golobal.error.handler";
import notFound from "./middleware/notFound";

const app:Application = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({extended:true}));
//middleware
app.use(logger);
app.use(cors({ origin: 'http://localhost:5000',}));

app.get('/', (req:Request, res:Response) => {
//   res.send('Hello World!')
res.status(200).json({
    "message": "Dev Pules",
    "author": "Dev pules",
    });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRouter);
app.use(notFound);
app.use(globalErrorHandler);

export default app;

