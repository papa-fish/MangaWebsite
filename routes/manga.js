const express = require("express");
const router = express.Router();
const db = require("../database/index.js");
const ensureLoggedIn = require("../middlewares/ensure_logged_in.js");

router.get("/new", ensureLoggedIn, (req, res) => {
    res.render("new")
});

router.post("/new", ensureLoggedIn, (req, res) => {
    let title = req.body.title
    let imageUrl = req.body.image_url
    let synopsis = req.body.synopsis
    let formattedSynopsis = synopsis.replace(" ' ", " '' ");
    // let userId = req.session.userId
    const sql = `INSERT INTO mangas (title, image_url, synopsis) VALUES ($1, $2, $3) RETURNING id;`
    db.query(sql, [title, imageUrl, formattedSynopsis], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        res.redirect("/")
    })
});

router.get("/all", (req, res) => {
    const sql = `SELECT title, id FROM mangas ORDER BY title`
    db.query(sql, (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        let mangas = dbRes.rows.map((row) => ({
            title: row.title,
            firstLetter: row.title.charAt(0).toUpperCase(),
            id: row.id
        }))
        res.render("show-all", {
            mangas
        })
    })
});

router.get("/search", ensureLoggedIn, (req, res) => {
    let search = req.query.search
    const sql = `SELECT * FROM mangas WHERE title ILIKE '%${search}%' LIMIT 1;`
    db.query(sql, (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        if (dbRes.rows.length === 0) {
            res.redirect("/")
        } else {
            let manga = dbRes.rows[0]
            res.render("show", {
                manga         
            })
        }
    })
});

router.get("/mylist", ensureLoggedIn, (req, res) => {
    let userId = req.session.userId
    const sql = `SELECT m.* FROM mangas m JOIN bookmarks b ON m.id = b.manga_id WHERE b.user_id = $1;`
    db.query(sql, [userId], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        const mangas = dbRes.rows
        if (mangas === 0) {
            res.redirect("/")
        } else {
            res.render("mylist", {
                mangas
            })
        }
    })
});

router.get("/:id", ensureLoggedIn, (req, res) => {
    const mangasSql = `SELECT * FROM mangas WHERE id = $1;`
    db.query(mangasSql, [req.params.id], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        let manga = dbRes.rows[0]
        const bookmarksSql = `SELECT user_id, manga_id FROM bookmarks WHERE user_id = $1 AND manga_id = $2;`
        db.query(bookmarksSql, [req.session.userId, manga.id], (err, dbRes) => {
            if (err) {
                console.log(err)
            }
            let isBookmarked = false
            if (dbRes.rows.length > 0) {
                isBookmarked = true;
            }
            res.render("show", {
                manga,
                isBookmarked
            })
        })
    })
});

router.get("/:id/edit", ensureLoggedIn, (req, res) => {
    const sql = `SELECT * FROM mangas WHERE id = $1`
    db.query(sql, [req.params.id], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        let manga = dbRes.rows[0]
        res.render("edit", {
            manga
        })
    })
});

router.put("/:id", ensureLoggedIn, (req, res) => {
    const sql = `UPDATE mangas SET title = $1, image_url = $2, synopsis = $3 WHERE id = $4;`
    let synopsis = req.body.synopsis
    let formattedSynopsis = synopsis.replace(" ' ", " '' ")
    db.query(sql, [req.body.title, req.body.image_url, formattedSynopsis, req.params.id], (err, dbRes) => {
        res.redirect(`/manga/${req.params.id}`)
    })
});

router.post("/:id/bookmark", ensureLoggedIn, (req, res) => {
    const userId = req.session.userId
    const sql = `INSERT INTO bookmarks (user_id, manga_id) VALUES ($1, $2);`
    db.query(sql, [userId, req.params.id], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        res.redirect(`/manga/${req.params.id}`)
    })
});

router.delete("/:id/unbookmark", ensureLoggedIn, (req, res) => {
    const userId = req.session.userId
    const sql = `DELETE FROM bookmarks WHERE user_id = $1 AND manga_id = $2;`
    db.query(sql, [userId, req.params.id], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        res.redirect(`/manga/${req.params.id}`)
    })
});

module.exports = router;