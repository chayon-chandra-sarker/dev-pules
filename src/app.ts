import express from "express";
import type { Application, Request, Response } from "express";
import { usersRouter } from "./modules/users/users.router";
import { authRoute } from "./modules/auth/auth.route";
import cookieParser from "cookie-parser";
const app:Application = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({extended:true}));

app.get('/', (req:Request, res:Response) => {
//   res.send('Hello World!')
res.status(200).json({
    "message": "Dev Pules",
    "author": "Dev pules",
    });
});


app.use('/api/auth/signup', usersRouter);
app.use("/api/auth", authRoute);


export default app;

