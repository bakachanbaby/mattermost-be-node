
const userRoute = require("./routes/user.router.js");
const categoryRoute = require("./routes/category.route.js");
const requestRoute = require("./routes/request.router");
const requestMattermostRoute = require("./routes/request.mattermost.route");
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const axios = require('axios');
const bodyParser = require('body-parser');
const Category = require("./models/category.modal.js");

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
app.use("/api/request-mattermost", requestMattermostRoute);

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


