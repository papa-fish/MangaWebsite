const db = require("../database");

function setUser(req, res, next) {
    res.locals.userId = req.session.userId
    if (!req.session.userId) {
        return next()
    }
    let sql = `SELECT * FROM users WHERE id = $1`
    db.query(sql, [req.session.userId], (err, dbRes) => {
        if (err) {
            console.log(err)
        } else {
            res.locals.user = dbRes.rows[0]
        }
        next()
    })
};

module.exports = setUser;