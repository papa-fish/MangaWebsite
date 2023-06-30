const express = require("express");
const router = express.Router();
const db = require("../database/index.js");
const ensureLoggedIn = require("../middlewares/ensure_logged_in.js");

router.get("/new", ensureLoggedIn, (req, res) => {
    res.render("new")
});

router.post("/new", ensureLoggedIn, (req, res) => {
    const { title, author, image_url, synopsis } = req.body;
    db.query(`INSERT INTO authors (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [author])
      .then(() => {
        return db.query(`SELECT id FROM authors WHERE name = $1`, [author]);
      })
      .then((dbRes) => {
        const authorId = dbRes.rows[0].id;
        return db.query(`INSERT INTO mangas (title, author_id, image_url, synopsis) VALUES ($1, $2, $3, $4)`, [title, authorId, image_url, synopsis]);
      })
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.error("Error inserting data:", err);
        res.status(500).send("An error occurred while inserting data");
      });
  });

router.get("/all", (req, res) => {
    const sql = `SELECT * FROM mangas ORDER BY title`
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
    const sql = `SELECT m.*, a.name AS author_name FROM mangas m JOIN authors a ON m.author_id = a.id WHERE m.title ILIKE '%' || $1 || '%' LIMIT 1;`
    db.query(sql, [search], (err, dbRes) => {
        if (err) {
            console.log(err)
        }
        if (dbRes.rows.length === 0) {
            return res.render("home", {
                mangas: []
            })
        }
        let manga = dbRes.rows[0]
        console.log(manga)
        const bookmarksSql = `SELECT user_id, manga_id FROM bookmarks WHERE user_id = $1 AND manga_id = $2;`
        db.query(bookmarksSql, [req.session.userId, manga.id], (err, dbRes) => {
            if (err) {
                console.log(err)
            }
            let isBookmarked = false
            if (dbRes.rows.length > 0) {
                isBookmarked = true
            }
            res.render("show", {
                manga,
                isBookmarked         
            })
        })
    })
});

router.get("/mylist", ensureLoggedIn, (req, res) => {
    let userId = req.session.userId
    const sql = `SELECT m.*, a.name AS author_name, b.* FROM mangas m JOIN authors a ON m.author_id = a.id JOIN bookmarks b ON m.id = b.manga_id WHERE b.user_id = $1;`
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
    const mangasSql = `SELECT m.*, a.name AS author_name FROM mangas m JOIN authors a ON m.author_id = a.id WHERE m.id = $1`;
    db.query(mangasSql, [req.params.id], (err, dbRes) => {
        if (err) {
            return console.log(err)
        }
        let manga = dbRes.rows[0]
        const bookmarksSql = `SELECT b.user_id, b.manga_id, $1 AS author_name FROM bookmarks b WHERE b.user_id = $2 AND b.manga_id = $3`
        db.query(bookmarksSql, [manga.author, req.session.userId, manga.id], (err, dbRes) => {
            if (err) {
               return console.log(err)
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
    const mangaId = req.params.id
    const sql = `SELECT m.*, a.name AS author_name FROM mangas m JOIN authors a ON m.author_id = a.id WHERE m.id = $1;`
    db.query(sql, [mangaId], (err, dbRes) => {
        if (err) {
            return console.log(err)
        }
        let manga = dbRes.rows[0]
        const authorId = manga.author_id;
        res.render("edit", {
            manga
        })
    })
});

router.put("/:id", ensureLoggedIn, (req, res) => {
    const mangaId = req.params.id;
    const { title, author, image_url, synopsis } = req.body;
    const updateAuthorQuery = `UPDATE authors SET name = $1 WHERE id = (SELECT author_id FROM mangas WHERE id = $2);`
    db.query(updateAuthorQuery, [author, mangaId], (err, result) => {
      if (err) {
        return console.log(err);
        return;
      }
      const updateMangaQuery = `UPDATE mangas SET title = $1, image_url = $2, synopsis = $3 WHERE id = $4;`
      db.query(updateMangaQuery, [title, image_url, synopsis, mangaId], (err, dbRes) => {
        if (err) {
        return console.log(err);
        }
        res.redirect(`/manga/${mangaId}`);
      });
    });
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

