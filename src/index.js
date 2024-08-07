
const userRoute = require("./routes/user.router.js");
const categoryRoute = require("./routes/category.route.js");
const requestRoute = require("./routes/request.router.js");
const botRoute = require("./routes/bot.router.js");
const reportRoute = require("./routes/report.router.js");
const requestMattermostRoute = require("./routes/request.mattermost.route.js");
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

require('dotenv').config();
mongoose.set('strictQuery', false);


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

//cor allow all origin
app.use(cors({ origin: true, credentials: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use("/api/users", userRoute);
app.use("/api/category", categoryRoute);
app.use("/api/request", requestRoute);
app.use("/api/bot", botRoute);
app.use("/api/request-mattermost", requestMattermostRoute);
app.use("/api/report", reportRoute);


mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to database!");
        app.listen(process.env.PORT, () => {
            console.log("Server is running on port " + process.env.PORT);
        });
    })
    .catch(() => {
        console.log("Connection failed!");
    });


