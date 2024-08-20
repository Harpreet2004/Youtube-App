import dotenv from "dotenv";
import connectDB from "./db/database.js";
import {app} from "./app.js"
dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.on("error",(err)=>{
        console.log(`ERROR on MONGODB CONNECTION !!`,err);
        throw err;
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`SERVER IS RUNNING AT PORT ::${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MONGODB CONNECTION FAILED !! AT PORT::",err);
})




/*
import express from "express"
const app = express();

( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error",(error) => {
            console.error("ERROR on ExPRESS :: ::",error);
            throw error;
        })

        app.listen(`${process.env.PORT}`, () => {
            console.log("Listening at port:8000")
        })


    } catch (error) {
        console.error("ERROR:: ", error);
        throw error;        
    }
})()
*/