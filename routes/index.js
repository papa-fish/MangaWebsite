const express = require("express");
const router = express.Router();
const db = require("../database/index.js");

router.get("/", (req, res) => {
    const sql = `SELECT m.*, a.name AS author_name FROM mangas m JOIN authors a ON m.author_id = a.id ORDER BY random() limit 8;`
    db.query(sql, (err, dbRes) => {
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