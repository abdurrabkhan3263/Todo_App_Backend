const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: process.env.CORS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: true }));
app.use(cookieParser());

// ALL ROUTES
const userRoute = require("./routes/user.routes.js");
const listRoute = require("./routes/list.routes.js");
const todoRoute = require("./routes/todo.routes.js");
const groupRoute = require("./routes/group.routes.js");

app.use("/user", userRoute);
app.use("/list", listRoute);
app.use("/todo", todoRoute);
app.use("/group", groupRoute);

module.exports = app;
