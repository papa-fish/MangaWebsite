const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../database");

const router = express.Router();

router.get("/", (req, res) => {
    res.render("signup")
});

router.post("/", (req, res) => {

    let email = req.body.email
    let username = req.body.username
    let password = req.body.password
    let saltRounds = 10;

    const sql = `SELECT * FROM users WHERE email = $1 OR username = $2;`
    db.query(sql, [email, username], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        if (dbRes.rows.length === 1) {
            console.log("username or email already in use")
            res.redirect("/signup")
        } else {
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                    console.log (err)
                }
                bcrypt.hash(password, salt, function (err, hash) {
                    if (err) {
                        res.redirect("/signup")
                    }
                    const sqlTwo = `INSERT INTO users (email, username, password_digest) VALUES ($1, $2, $3)`
                    db.query(sqlTwo, [email, username, hash], (err, dbRes) => {
                        if (err) {
                            console.log(err)
                        } else {
                            res.redirect("/login")
                        }
                    })
                })
            })
        }
    })
});

module.exports = router;