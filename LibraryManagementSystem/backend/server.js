const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(cors({
    origin: 'http://localhost:5173'
}));
const path = require('path');
app.use(express.json());
console.log(__dirname)
app.use(express.static(path.join(__dirname, "..", "test")));

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/; //1 upper case, 1 lower case, minimum 8 characters
const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
async function hash(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const db = new sqlite3.Database("LibraryManagementSystem.db");
db.serialize(() => {
    // Enable foreign key restraints
    db.run("PRAGMA foreign_keys = ON;");

    //Users
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            userID INTEGER PRIMARY KEY,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            passwordHash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member', 'admin')),
            membershipStatus TEXT NOT NULL DEFAULT 'active' CHECK(membershipStatus IN ('active', 'frozen'))
        )
    `, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Users Table Created")
    })

    //Books
    db.run(`
        CREATE TABLE IF NOT EXISTS books (
            bookID INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            genre TEXT,
            description TEXT,
            author TEXT
        )
    `, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Books Table Created")
    })

    //Book Copies
    db.run(`
        CREATE TABLE IF NOT EXISTS bookCopies (
            copyID INTEGER PRIMARY KEY,
            bookID INTEGER NOT NULL,
            FOREIGN KEY (bookID) REFERENCES books(bookID) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Book Copies Table Created")
    })

    //Loans
    db.run(`
        CREATE TABLE IF NOT EXISTS loans (
            loanID INTEGER PRIMARY KEY,
            userID INTEGER,
            copyID INTEGER,
            startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            dueDate DATETIME NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'lost', 'returned')),
            FOREIGN KEY (userID) REFERENCES users(userID),
            FOREIGN KEY (copyID) REFERENCES bookCopies(copyID)
        )
    `, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Loans Table Created")
    })

    //Reservations
    db.run(`
        CREATE TABLE IF NOT EXISTS reservations (
            userID INTEGER NOT NULL,
            bookID INTEGER NOT NULL,
            startDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiryDate DATETIME,
            PRIMARY KEY (userID, bookID),
            FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE,
            FOREIGN KEY (bookID) REFERENCES books(bookID) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Reservations Table Created")
    })

    //Fines
    db.run(`
        CREATE TABLE IF NOT EXISTS fines (
            loanID INTEGER,
            date DATETIME,
            type TEXT NOT NULL DEFAULT 'other' CHECK(type IN ('late', 'lost', 'damaged', 'other')),
            amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'outstanding' CHECK(status IN ('outstanding', 'paid', 'cancelled')),
            PRIMARY KEY (loanID, date),
            FOREIGN KEY (loanID) REFERENCES loans(loanID) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Fines Table Created")
    })

    //Sessions
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            sessionID TEXT PRIMARY KEY,
            userID INTEGER UNIQUE,
            expiry TIMESTAMP,
            FOREIGN KEY (userID) REFERENCES users(userID) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log("Sessions Table Created")
    })
})

app.post('/search-for-books', (req, res) => {
    const { title, genre, author } = req.body;
    let { limit, page } = req.body;
    limit = parseInt(limit, 10);
    if (isNaN(limit) || limit <= 0) {
        limit = 5;
    } else if (limit > 10) {
        limit = 10;
    }
    let conditions = [];
    let params = [];

    if (title && title.trim() !== '') {
        conditions.push('title LIKE ?');
        params.push(`%${title.trim()}%`);
    }
    if (genre && genre.trim() !== '') {
        conditions.push('genre LIKE ?');
        params.push(`%${genre.trim()}%`);
    }
    if (author && author.trim() !== '') {
        conditions.push('author LIKE ?');
        params.push(`%${author.trim()}%`);
    }

    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    db.get(`SELECT COUNT(*) as total FROM books ${whereClause}`, params, (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }
        const maxPage = Math.floor(row.total / limit) + 1;
        page = parseInt(page, 10);
        if (isNaN(page) || page <= 0) {
            page = 1;
        }
        page = Math.min(page, maxPage);
        const offset = (page - 1) * limit;
        params.push(limit, offset)
        db.all(`SELECT * FROM books ${whereClause} LIMIT ? OFFSET ?`, params, (err, rows) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }
            return res.status(200).json({ books: rows, limit: limit, page: page })
        });
    });
})

app.post('/search-for-loans', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [thisUserID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            let targetUserID = thisUserID;
            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }
            let { limit, page } = req.body;
            limit = parseInt(limit, 10);
            if (isNaN(limit) || limit <= 0) {
                limit = 5;
            } else if (limit > 10) {
                limit = 10;
            }

            db.get(`SELECT COUNT(*) as total FROM loans WHERE userID = ?`, [targetUserID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }

                const maxPage = Math.floor(row.total / limit) + 1;
                page = parseInt(page, 10);
                if (isNaN(page) || page <= 0) {
                    page = 1;
                }
                page = Math.min(page, maxPage);
                const offset = (page - 1) * limit;
                db.all(`SELECT loans.loanID, loans.userID, loans.copyID, loans.startDate, loans.dueDate, loans.status, books.title 
                    FROM 
                    loans LEFT JOIN 
                    bookCopies ON loans.copyID = bookCopies.copyID LEFT JOIN 
                    books ON bookCopies.bookID = books.bookID 
                    WHERE loans.userID = ? LIMIT ? OFFSET ?`,
                    [targetUserID, limit, offset], (err, rows) => {
                        if (err) {
                            console.log(err);
                            return res.status(400).json({ message: "Internal server error" });
                        }
                        return res.status(200).json({ loans: rows, limit: limit, page: page })
                    });
            });
        })
    })
})

app.post('/search-for-reservations', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [thisUserID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            let targetUserID = thisUserID;
            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }
            let { limit, page } = req.body;
            limit = parseInt(limit, 10);
            if (isNaN(limit) || limit <= 0) {
                limit = 5;
            } else if (limit > 10) {
                limit = 10;
            }

            db.get(`SELECT COUNT(*) as total FROM reservations WHERE userID = ?`, [targetUserID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }

                const maxPage = Math.floor(row.total / limit) + 1;
                page = parseInt(page, 10);
                if (isNaN(page) || page <= 0) {
                    page = 1;
                }
                page = Math.min(page, maxPage);
                const offset = (page - 1) * limit;
                db.all(`SELECT reservations.bookID, title, startDate, expiryDate from reservations, books WHERE reservations.bookID = books.bookID AND userID = ? LIMIT ? OFFSET ?`,
                    [targetUserID, limit, offset], (err, rows) => {
                        if (err) {
                            console.log(err);
                            return res.status(400).json({ message: "Internal server error" });
                        }
                        return res.status(200).json({ reservations: rows, limit: limit, page: page })
                    });
            });
        })
    })
})

app.post('/search-for-fines', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [thisUserID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            let targetUserID = thisUserID;
            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }
            let { limit, page } = req.body;
            limit = parseInt(limit, 10);
            if (isNaN(limit) || limit <= 0) {
                limit = 5;
            } else if (limit > 10) {
                limit = 10;
            }

            db.get(`SELECT COUNT(*) as total FROM fines LEFT JOIN loans ON fines.loanID = loans.loanID WHERE loans.userID = ?`, [targetUserID], (err, row) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json({ message: "Internal server error" });
                }

                const maxPage = Math.floor(row.total / limit) + 1;
                page = parseInt(page, 10);
                if (isNaN(page) || page <= 0) {
                    page = 1;
                }
                page = Math.min(page, maxPage);
                const offset = (page - 1) * limit;
                db.all(`SELECT fines.loanID, date, type, amount, fines.status, books.title 
                    FROM fines LEFT JOIN 
                    loans ON fines.loanID = loans.loanID LEFT JOIN 
                    bookCopies ON loans.copyID = bookCopies.copyID LEFT JOIN
                    books ON bookCopies.bookID = books.bookID 
                    WHERE userID = ? LIMIT ? OFFSET ?`,
                    [targetUserID, limit, offset], (err, rows) => {
                        if (err) {
                            console.log(err);
                            return res.status(400).json({ message: "Internal server error" });
                        }
                        return res.status(200).json({ fines: rows, limit: limit, page: page })
                    });
            });
        })
    })
})

app.post('/get-user-data', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        let targetUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }

            db.get("SELECT firstName, lastName, email, role, membershipStatus FROM users WHERE userID = ?", [targetUserID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                if (!row) {
                    return res.status(400).json({ message: "User not found" });
                }
                return res.status(200).json({ user: row })
            })
        })
    })
})

app.post('/validate-sessionID', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }
        return res.status(200).json({ valid: true })
    })
})

//Log In
app.post('/log-in', (req, res) => {
    const { email, password } = req.body;

    //verify required fields
    if (!email || !password) {
        return res.status(400).json({ message: "Missing required fields" })
    }

    //get stored password hash
    const formattedEmail = email.toLowerCase();
    db.get("SELECT userID, passwordHash FROM users WHERE email = ?", [formattedEmail], async (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }
        if (!row) {
            return res.status(400).json({ message: "Invalid email" })
        }
        //compare hashes
        const storedPasswordHash = row.passwordHash;
        const passwordHash = await hash(password);
        if (storedPasswordHash !== passwordHash) {
            return res.status(400).json({ message: "Incorrect password" })
        }

        //get session code
        const userID = row.userID;
        db.get("SELECT sessionID, userID, expiry FROM sessions WHERE userID = ?", [userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }
            const now = Date.now();
            if (row && row.expiry > now) {
                return res.status(200).json({ sessionID: row.sessionID });
            }

            // either no or expired session code, so generate a new one 
            const sessionID = crypto.randomUUID();
            const expiry = now + (1 * 60 * 60 * 1000);
            db.run("INSERT INTO sessions (sessionID, userID, expiry) VALUES (?, ?, ?) ON CONFLICT (userID) DO UPDATE SET sessionID = EXCLUDED.sessionID, expiry = EXCLUDED.expiry;", [sessionID, userID, expiry], (err) => {
                if (err) {
                    console.log(err);
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ sessionID: sessionID });
            })
        })
    })
})

//Add Member
app.post('/add-member', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    //verify required fields
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    //check password meets requirements
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Invalid password" });
    }

    //check email meets requirements
    const formattedEmail = email.toLowerCase();
    if (!emailRegex.test(formattedEmail)) {
        return res.status(400).json({ message: "Invalid email" });
    }

    const passwordHash = await hash(password);
    db.run("INSERT INTO users (firstName, lastName, email, passwordHash) VALUES (?, ?, ?, ?)", [firstName, lastName, formattedEmail, passwordHash], (err) => {
        if (err) {
            return res.status(400).json({ message: "Email in use" })
        }
        return res.status(200).json({ message: "Account created" });
    })
})

//Delete Member
app.post('/delete-member', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT passwordHash, role FROM users WHERE userID = ?", [thisUserID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            const passwordhash = await hash(password);
            if (passwordhash !== row.passwordHash) {
                return res.status(400).json({ message: "Incorrect password" });
            }

            let targetUserID = thisUserID;
            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }

            db.get("SELECT 1 FROM loans WHERE userID = ? AND status = 'active'", [targetUserID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                if (row) {
                    return res.status(400).json({ message: "User has active loans" });
                }
                db.get("SELECT 1 FROM fines, loans WHERE fines.status = 'outstanding' AND fines.loanID = loans.loanID and loans.userID = ?", [targetUserID], (err, row) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    if (row) {
                        return res.status(400).json({ message: "User has oustanding fines" });
                    }
                    db.run("UPDATE loans set userID = ? WHERE userID = ?", [null, targetUserID], (err) => {
                        if (err) {
                            return res.status(400).json({ message: "Internal server error" });
                        }
                        db.run("DELETE FROM reservations WHERE userID = ?", [targetUserID], (err) => {
                            if (err) {
                                return res.status(400).json({ message: "Internal server error" });
                            }
                            db.run("DELETE FROM users WHERE userID = ?", [targetUserID], (err) => {
                                if (err) {
                                    return res.status(400).json({ message: "Internal server error" });
                                }
                                return res.status(200).json({ message: "User deleted" })
                            })
                        })
                    })
                })
            })
        })
    })
})

//Freeze Member
app.post('/freeze-member', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT passwordHash, role FROM users WHERE userID = ?", [thisUserID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            const passwordhash = await hash(password);
            if (passwordhash !== row.passwordHash) {
                return res.status(400).json({ message: "Incorrect password" });
            }

            let targetUserID = thisUserID;
            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }

            db.get("SELECT 1 FROM loans WHERE userID = ? AND status = 'active'", [targetUserID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                if (row) {
                    return res.status(400).json({ message: "User has active loans" });
                }
                db.get("SELECT 1 FROM fines, loans WHERE fines.status = 'outstanding' AND fines.loanID = loans.loanID and loans.userID = ?", [targetUserID], (err, row) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    if (row) {
                        return res.status(400).json({ message: "User has oustanding fines" });
                    }
                    db.run("DELETE FROM reservations WHERE userID = ?", [targetUserID], (err) => {
                        if (err) {
                            return res.status(400).json({ message: "Internal server error" });
                        }
                        db.run("UPDATE users SET membershipStatus = 'frozen' WHERE userID = ?", [targetUserID], (err) => {
                            if (err) {
                                return res.status(400).json({ message: "Internal server error" });
                            }
                            return res.status(200).json({ message: "User frozen" })
                        })
                    })
                })
            })
        })
    })
})

//unfreeze member
app.post('/unfreeze-member', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT passwordHash, role FROM users WHERE userID = ?", [thisUserID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            const passwordhash = await hash(password);
            if (passwordhash !== row.passwordHash) {
                return res.status(400).json({ message: "Incorrect password" });
            }

            let targetUserID = thisUserID;
            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }

            db.run("UPDATE users SET membershipStatus = 'active' WHERE userID = ?", [targetUserID], (err) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: "User unfrozen" })
            })
        })
    })
})

//Change Password
app.post('/change-password', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        let targetUserID = row.userID;
        db.get("SELECT passwordHash, role FROM users WHERE userID = ?", [targetUserID], async (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }
            const { currentPassword } = req.body;
            if (!currentPassword) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            const currentPasswordHash = await hash(currentPassword);
            if (currentPasswordHash !== row.passwordHash) {
                return res.status(400).json({ message: "Incorrect password" });
            }
            const { newPassword } = req.body;
            if (!newPassword) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({ message: "Invalid password" });
            }
            const newPasswordHash = await hash(newPassword);

            db.run("UPDATE users SET passwordHash = ? WHERE userID = ?", [newPasswordHash, targetUserID], (err) => {
                if (err) {
                    return res.status(400).json({ message: "User not found" });
                }
                return res.status(200).json({ message: "Password Changed" });
            })
        })
    })
})

//Change Name
app.post('/change-name', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        let targetUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [targetUserID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }

            const { firstName, lastName } = req.body;
            if (!firstName || !lastName) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            db.run("UPDATE users SET firstName = ?, lastName = ? WHERE userID = ?", [firstName, lastName, targetUserID], (err) => {
                if (err) {
                    return res.status(400).json({ message: "User not found" });
                }
                return res.status(200).json({ message: "Name Changed" });
            })
        })
    })
})

//Promote Member
app.post('/promote-member', (req, res) => {
    const { userID, email, password } = req.body;
    if (!userID || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    //verify admin
    db.get("SELECT role, passwordHash FROM users WHERE email = ?", [email], async (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row) {
            return res.status(400).json({ message: "User not found" });
        }
        if (row.role !== "admin") {
            return res.status(400).json({ message: "Admin privileges required" })
        }

        const passwordHash = await hash(password);
        if (passwordHash !== row.passwordHash) {
            return res.status(400).json({ message: "Incorrect Password" });
        }

        //promote member
        db.run("UPDATE users SET role = ? WHERE userID = ?", ["admin", userID], (err) => {
            if (err) {
                return res.status(400).json({ message: "User not found" });
            }
            return res.status(200).json({ message: "Member Promoted" });
        })
    })
})

//Add Book
app.post('/add-book', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role !== "admin") {
                return res.status(400).json({ message: "Admin privileges required" })
            }

            const { title, genre, description, author } = req.body;
            if (!title) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            let atttributes = [];
            let queryParameters = [];
            let queryValues = [];

            atttributes.push("title");
            queryParameters.push("?");
            queryValues.push(title);

            if (genre) {
                atttributes.push("genre");
                queryParameters.push("?");
                queryValues.push(genre);
            }
            if (description) {
                atttributes.push("description");
                queryParameters.push("?");
                queryValues.push(description);
            }
            if (author) {
                atttributes.push("author");
                queryParameters.push("?");
                queryValues.push(author);
            }

            let query = "INSERT INTO books (" + atttributes.join(", ") + ") VALUES (" + queryParameters.join(", ") + ")"
            db.run(query, queryValues, (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: "Book Added" });
            })
        })
    })
})

//Delete Book
app.post('/delete-book', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role !== "admin") {
                return res.status(400).json({ message: "Admin privileges required" })
            }

            const { bookID } = req.body;
            if (!bookID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            db.run("UPDATE loans SET status = 'lost', copyID = ? WHERE copyID IN (SELECT copyID FROM bookCopies WHERE bookID = ?)", [null, bookID], (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                db.run("DELETE FROM bookCopies WHERE bookID = ?", [bookID], (err) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    db.run("DELETE FROM reservations WHERE bookiD = ?", [bookID], (err) => {
                        if (err) {
                            return res.status(400).json({ message: "Internal server error" });
                        }
                        db.run("DELETE FROM books WHERE bookiD = ?", [bookID], (err) => {
                            if (err) {
                                return res.status(400).json({ message: "Internal server error" });
                            }
                            return res.status(200).json({ message: "Book deleted" });
                        })
                    })
                })
            })
        })
    })
})

//Update Book
app.post('/update-book', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role !== "admin") {
                return res.status(400).json({ message: "Admin privileges required" });
            }

            const { bookID, title, genre, description, author } = req.body;
            if (!bookID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            let atttributes = [];
            let queryValues = [];


            if (title) {
                atttributes.push("title = ?");
                queryValues.push(title);
            }
            if (genre) {
                atttributes.push("genre = ?");
                queryValues.push(genre);
            }
            if (description) {
                atttributes.push("description = ?");
                queryValues.push(description);
            }
            if (author) {
                atttributes.push("author = ?");
                queryValues.push(author);
            }
            queryValues.push(bookID);
            if (atttributes.length === 0) {
                return res.status(200).json({ message: "Book Updated" });
            }

            let query = "UPDATE books SET " + atttributes.join(", ") + " WHERE bookID = ?"
            db.run(query, queryValues, (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: "Book Updated" });
            })
        })
    })
})

//Add Book Copy
app.post('/add-book-copy', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role !== "admin") {
                return res.status(400).json({ message: "Admin privileges required" })
            }

            const { bookID } = req.body;
            if (!bookID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            db.run("INSERT INTO bookCopies (bookID) VALUES (?)", bookID, (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: "Book Copy Added" });
            })
        })
    })
})

//Delete Book Copy
app.post('/delete-book-copy', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role !== "admin") {
                return res.status(400).json({ message: "Admin privileges required" })
            }

            const { copyID } = req.body;
            if (!copyID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            db.run("UPDATE loans SET status = 'lost', copyID = ? WHERE copyID = ?", [null, copyID], (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                db.run("DELETE FROM bookCopies WHERE copyID = ?", [copyID], (err) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    return res.status(200).json({ message: "Book Copy Deleted" });
                })
            })
        })
    })
})

//Borrow Loan
app.post('/borrow-loan', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }
        let targetUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }

            const { bookID } = req.body;
            if (!bookID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            //if user has reserved the book - get all reservations for the book which are older than the users reservation
            //if the user has not reserved the book - get all the reservations for the book
            let query = `
            SELECT userID, startDate, expiryDate
            FROM reservations
            WHERE bookID = ?
                AND (
                    startDate < (
                        SELECT startDate 
                        FROM reservations 
                        WHERE userID = ? AND bookID = ?
                    )
                    OR NOT EXISTS (
                        SELECT 1
                        FROM reservations 
                        WHERE userID = ? AND bookID = ?
                    )
                )
            `
            db.all(query, [bookID, targetUserID, bookID, targetUserID, bookID], (err, rows) => {
                if (err) {
                    console.log(err)
                    return res.status(400).json({ message: "Internal server error" });
                }
                //delete expired reservations
                const activeReservations = rows.filter(row => row.expiryDate === null || row.expiryDate >= Date.now());
                //get 1 book copy not in active loan, skipping the number of reservations
                db.get("SELECT bookCopies.copyID from bookCopies WHERE bookCopies.bookID = ? AND NOT EXISTS (SELECT 1 FROM loans WHERE loans.copyID = bookCopies.copyID AND loans.status = 'active') LIMIT 1 OFFSET ?", [bookID, activeReservations.length], (err, row) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    if (!row) {
                        return res.status(200).json({ message: "No available book copy" });
                    }
                    //if book copy exists, create loan, and delete reservation if user reserved the book
                    row.copyID
                    db.run("INSERT INTO loans (userID, copyID, startDate, dueDate) VALUES (?, ?, ?, ?)", [targetUserID, row.copyID, Date.now(), Date.now() + (3 * 7 * 24 * 60 * 60 * 1000)], (err) => {
                        if (err) {
                            return res.status(400).json({ message: "Internal server error" });
                        }

                        db.run("DELETE FROM reservations WHERE userID = ? AND bookID = ?", [targetUserID, bookID], (err) => {
                            if (err) {
                                return res.status(400).json({ message: "Internal server error" });
                            }
                            return res.status(200).json({ message: "Loan borrowed" });
                        })
                    })
                })
            })
        })
    })
})

//Renew Loan
app.post('/renew-loan', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            const { loanID } = req.body;
            if (!loanID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const thisUserRole = row.role;
            db.get("SELECT userID, startDate, dueDate FROM loans WHERE loanID = ? AND status = 'active'", [loanID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                if (!row) {
                    return res.status(400).json({ message: "No loan found" });
                }

                if (thisUserRole === "member" && thisUserID !== row.userID) {
                    return res.status(400).json({ message: "No loan found" });
                }

                if (thisUserRole === "member" && row.dueDate - row.startDate >= 6 * 7 * 24 * 60 * 60 * 1000) {
                    return res.status(400).json({ message: "Loan cannot be renewed" });
                }

                let newDueDate = row.dueDate + 7 * 24 * 60 * 60 * 1000;
                if (thisUserRole === "admin") {
                    const { dueDate } = req.body;
                    if (dueDate) {
                        newDueDate = dueDate;
                    }
                }

                db.run("UPDATE loans SET dueDate = ? WHERE loanID = ?", [newDueDate, loanID], (err) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    return res.status(200).json({ message: "Loan renewed" });
                })
            })
        })
    })
})

//Return Loan
app.post('/return-loan', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            const { loanID } = req.body;
            if (!loanID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const thisUserRole = row.role;
            db.get("SELECT userID FROM loans WHERE loanID = ? and status = 'active'", [loanID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                if (!row) {
                    return res.status(400).json({ message: "No loan found" });
                }

                if (thisUserRole === "member" && thisUserID !== row.userID) {
                    return res.status(400).json({ message: "No loan found" });
                }

                db.run("UPDATE loans SET status = 'returned' WHERE loanID = ?", [loanID], (err) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    return res.status(200).json({ message: "Loan returned" });
                })
            })
        })
    })
})

//Lose Loan
app.post('/lose-loan', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const thisUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            const { loanID } = req.body;
            if (!loanID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const thisUserRole = row.role;
            db.get("SELECT userID, copyID FROM loans WHERE loanID = ? AND status = 'active'", [loanID], (err, row) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                if (!row) {
                    return res.status(400).json({ message: "No loan found" });
                }

                if (thisUserRole === "member" && thisUserID !== row.userID) {
                    return res.status(400).json({ message: "No loan found" });
                }

                db.run("UPDATE loans SET status = 'lost', copyID = ? WHERE loanID = ?", [null, loanID], (err) => {
                    if (err) {
                        return res.status(400).json({ message: "Internal server error" });
                    }
                    db.run("INSERT INTO fines (loanID, date, type, amount) VALUES (?, ?, ?, ?)", [loanID, Date.now(), 'lost', 19.99], (err) => {
                        if (err) {
                            return res.status(400).json({ message: "Internal server error" });
                        }
                        db.run("DELETE FROM bookCopies WHERE copyID = ?", [row.copyID], (err) => {
                            if (err) {
                                console.log(err)
                                return res.status(400).json({ message: "Internal server error" });
                            }
                            return res.status(200).json({ message: "Loan lost" });
                        })
                    })
                })
            })
        })
    })
})

//Add Reservation
app.post('/add-reservation', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        let targetUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            const { bookID } = req.body;
            if (!bookID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            let newExpiryDate = null
            if (row.role === "admin") {
                const { userID, expiryDate } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
                if (expiryDate) {
                    newExpiryDate = expiryDate;
                }
            }

            db.run("INSERT INTO reservations (userID, bookID, startDate, expiryDate) VALUES (?, ?, ?, ?)", [targetUserID, bookID, Date.now(), newExpiryDate], (err) => {
                if (err) {
                    return res.status(400).json({ message: "Reservation already exists" });
                }
                return res.status(200).json({ message: "Reservation added" });
            })
        })
    })
})

//Delete Reservation
app.post('/delete-reservation', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        let targetUserID = row.userID;
        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            const { bookID } = req.body;
            if (!bookID) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            if (row.role === "admin") {
                const { userID } = req.body;
                if (userID) {
                    targetUserID = userID;
                }
            }

            db.run("DELETE FROM reservations WHERE userID = ? AND bookID = ?", [targetUserID, bookID], (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: "Reservation deleted" });
            })
        })
    })
})

//Issue Fine
app.post('/issue-fine', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role !== "admin") {
                return res.status(400).json({ message: "Admin privileges required" });
            }

            let newType = "other";
            let newStatus = "outstanding";

            const { loanID, type, amount, status } = req.body;
            if (!loanID || !amount) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            if (type) {
                newType = type
            }
            if (status) {
                newStatus = status
            }

            db.run("INSERT INTO fines (loanID, date, type, amount, status) VALUES (?, ?, ?, ?, ?)", [loanID, Date.now(), newType, amount, newStatus], (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: "Fine issued" });
            })
        })
    })
})

//Pay Fine
app.post('/pay-fine', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        const { loanID, date, paymentToken } = req.body;
        if (!loanID || !date || !paymentToken) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        //Process payment

        db.run("UPDATE fines SET status = 'paid' WHERE loanID = ? AND date = ?", [loanID, date], (err) => {
            if (err) {
                return res.status(400).json({ message: "Internal sercer error" })
            }
            return res.status(200).json({ message: "Fine payed" })
        })
    })
})

//Cancel Fine
app.post('/cancel-fine', (req, res) => {
    const { sessionID } = req.body;
    if (!sessionID) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    //validate session ID
    db.get("SELECT userID, expiry FROM sessions WHERE sessionID = ?", [sessionID], (err, row) => {
        if (err) {
            return res.status(400).json({ message: "Internal server error" });
        }

        if (!row || row.expiry < Date.now()) {
            return res.status(400).json({ message: "Invalid session ID" });
        }

        db.get("SELECT role FROM users WHERE userID = ?", [row.userID], (err, row) => {
            if (err) {
                return res.status(400).json({ message: "Internal server error" });
            }

            if (!row) {
                return res.status(400).json({ message: "User not found" });
            }

            if (row.role !== "admin") {
                return res.status(400).json({ message: "Admin privileges required" });
            }

            const { loanID, date } = req.body;
            if (!loanID || !date) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            db.run("UPDATE fines SET status = 'cancelled' WHERE loanID = ? AND date = ?", [loanID, date], (err) => {
                if (err) {
                    return res.status(400).json({ message: "Internal server error" });
                }
                return res.status(200).json({ message: "Fine cancelled" });
            })
        })
    })
})

app.listen(3000);

function checkAndAssignFines() {
    const dailyFineRate = 10; // Set your daily late fee amount here

    // Find active loans where the due date has passed
    const query = `
        SELECT loanID, dueDate 
        FROM loans 
        WHERE status = 'active' AND dueDate < ?
    `;

    db.all(query, [Date.now()], (err, overdueLoans) => {
        if (err) {
            console.error("Error fetching overdue loans:", err);
            return;
        }

        overdueLoans.forEach(loan => {
            // Check if an outstanding late fine already exists for this loan
            const checkFineQuery = `
                SELECT * FROM fines 
                WHERE loanID = ? AND type = 'late' AND status = 'outstanding'
            `;

            db.get(checkFineQuery, [loan.loanID], (err, existingFine) => {
                if (err) {
                    console.error("Error checking existing fine:", err);
                    return;
                }

                // If no outstanding late fine exists, insert a new one
                if (!existingFine) {
                    const insertFineQuery = `
                        INSERT INTO fines (loanID, date, type, amount, status)
                        VALUES (?, ?, 'late', ?, 'outstanding')
                    `;

                    db.run(insertFineQuery, [loan.loanID, Date.now(), dailyFineRate], (err) => {
                        if (err) {
                            console.error(`Error assigning fine for loan ${loan.loanID}:`, err);
                        } else {
                            console.log(`Successfully assigned late fine for loanID: ${loan.loanID}`);
                        }
                    });
                }
            });
        });
    });
}

// Run once on startup, then every 24 hours (86400000 ms)
checkAndAssignFines();
setInterval(checkAndAssignFines, 24 * 60 * 60 * 1000);