require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const session = require("express-session");

const setUser = require("./middlewares/set_user");

const indexRouter = require("./routes/index.js")
const sessionsRouter = require("./routes/sessions.js");
const signupRouter = require("./routes/signup.js");
const mangaRouter = require("./routes/manga.js");

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride(function(req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        const method = req.body._method
        delete req.body._method
        return method
    }
}));
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(setUser);
app.use(expressLayouts);

app.use("/", sessionsRouter);
app.use("/signup", signupRouter);
app.use("/", indexRouter);
app.use("/manga", mangaRouter);

app.listen(port, () => {
    console.log(`listening on port ${port}`)
});