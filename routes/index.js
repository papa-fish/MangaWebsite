const express = require("express");
const router = express.Router();
const db = require("../database/index.js");

router.get("/", (req, res) => {

    db.query(`SELECT * FROM mangas ORDER BY id;`, (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        let mangas = dbRes.rows
        res.render("home", {
            mangas
        })
    })
});

module.exports = router;