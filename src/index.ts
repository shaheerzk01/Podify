import express from 'express'
import "dotenv/config"
import './DB'

import authRouter from "#/routers/auth";
import audioRouter from "#/routers/audio"

const app = express()

//Register the middleware
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//this is to use html in node.js and add public routes
app.use(express.static('src/public'));

app.use("/auth", authRouter);
app.use("/audio", audioRouter);

const PORT = process.env.PORT || 9000 //use the env port for live server otherwise use 9000

app.listen(PORT, ()=>{
    console.log("Port is listening on port "+PORT)
})

