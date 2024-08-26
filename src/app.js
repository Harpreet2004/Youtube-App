import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))

app.use(express.json({limit:"16kb"}));
app.use(urlencoded({extended:true,limit:"20kb"}));
app.use(express.static("public"))
app.use(cookieParser());

//importing routes
import userRouter from "./routes/user.routes.js"


//routes declaration
app.use("/api/v1/users", userRouter);
//http://localhost:8000/api/v1/users/register


export { app };