const express = require("express");
const router = express.Router();
const db = require("../database/index.js");

router.get("/:id", (req, res) => {
    const sql = `SELECT * FROM mangas WHERE id = $1;`
    db.query(sql, [req.params.id], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        let manga = dbRes.rows[0]
        res.render("show", {
            manga
        })
    })
});

module.exports = router;