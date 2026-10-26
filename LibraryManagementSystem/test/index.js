var sessionID = "";
document.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    console.log(data);
    if (event.target.id === 'search-for-books') {
        searchForBooks(data.title, data.genre, data.author, data.limit, data.page);
    }
    if (event.target.id === 'search-for-loans') {
        searchForLoans(data.userID, data.limit, data.page);
    }
    if (event.target.id === 'log-in') {
        logIn(data.email, data.password);
    }
    if (event.target.id === 'add-member') {
        addMember(data.firstName, data.lastName, data.email, data.password);
    }
    if (event.target.id === 'delete-member') {
        deleteMember(data.userID, data.password);
    }
    if (event.target.id === 'freeze-member') {
        freezeMember(data.userID, data.password);
    }
    if (event.target.id === 'unfreeze-member') {
        unfreezeMember(data.userID, data.password);
    }
    if (event.target.id === 'change-password') {
        changePassword(data.userID, data.currentPassword, data.newPassword);
    }
    if (event.target.id === 'change-name') {
        changeName(data.userID, data.firstName, data.lastName);
    }
    if (event.target.id === 'promote-member') {
        promoteMember(data.userID, data.email, data.password);
    }
    if (event.target.id === 'add-book') {
        addBook(data.title, data.genre, data.description, data.author);
    }
    if (event.target.id === 'delete-book') {
        deleteBook(data.bookID);
    }
    if (event.target.id === 'update-book') {
        updateBook(data.bookID, data.title, data.genre, data.description, data.author);
    }
    if (event.target.id === 'add-book-copy') {
        addBookCopy(data.bookID);
    }
    if (event.target.id === 'delete-book-copy') {
        deleteBookCopy(data.copyID);
    }
    if (event.target.id === 'borrow-loan') {
        borrowLoan(data.userID, data.bookID);
    }
    if (event.target.id === 'renew-loan') {
        renewLoan(data.loanID, data.dueDate);
    }
    if (event.target.id === 'return-loan') {
        returnLoan(data.loanID);
    }
    if (event.target.id === 'lose-loan') {
        loseLoan(data.loanID);
    }
    if (event.target.id === 'add-reservation') {
        addReservation(data.userID, data.bookID, data.expiryDate);
    }
    if (event.target.id === 'delete-reservation') {
        deleteReservation(data.userID, data.bookID);
    }
    if (event.target.id === 'issue-fine') {
        issueFine(data.loanID, data.type, data.amount, data.status);
    }
    if (event.target.id === 'pay-fine') {
        payFine(data.loanID, data.date, data.paymentToken);
    }
    if (event.target.id === 'cancel-fine') {
        cancelFine(data.loanID, data.date);
    }
});

async function searchForBooks(title, genre, author, limit, page) {
    const response = await fetch('http://localhost:3000/search-for-books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            genre: genre,
            author: author,
            limit: limit,
            page: page
        })
    });
    const result = await response.json();
    console.log(result);
}

async function searchForLoans(userID, limit, page) {
    const response = await fetch('http://localhost:3000/search-for-loans', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            limit: limit,
            page: page
        })
    });
    const result = await response.json();
    console.log(result);
}

async function logIn(email, password) {
    const response = await fetch('http://localhost:3000/log-in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });
    const result = await response.json();
    console.log(result);
    if (response.ok) {
        sessionID = result.sessionID;
    }
}

async function addMember(firstName, lastName, email, password) {
    const response = await fetch('http://localhost:3000/add-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password
        })
    });
    const result = await response.json();
    console.log(result);
}

async function deleteMember(userID, password) {
    const response = await fetch('http://localhost:3000/delete-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            password, password
        })
    });
    const result = await response.json();
    console.log(result);
}

async function freezeMember(userID, password) {
    const response = await fetch('http://localhost:3000/freeze-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            password, password
        })
    });
    const result = await response.json();
    console.log(result);
}

async function unfreezeMember(userID, password) {
    const response = await fetch('http://localhost:3000/unfreeze-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            password, password
        })
    });
    const result = await response.json();
    console.log(result);
}

async function changePassword(userID, currentPassword, newPassword) {
    const response = await fetch('http://localhost:3000/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            currentPassword: currentPassword,
            newPassword: newPassword
        })
    });
    const result = await response.json();
    console.log(result);
}

async function changeName(userID, firstName, lastName) {
    const response = await fetch('http://localhost:3000/change-name', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            firstName: firstName,
            lastName: lastName
        })
    });
    const result = await response.json();
    console.log(result);
}

async function promoteMember(userID, email, password) {
    const response = await fetch('http://localhost:3000/promote-member', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: userID,
            email: email,
            password: password
        })
    });
    const result = await response.json();
    console.log(result);
}

async function addBook(title, genre, description, author) {
    const response = await fetch('http://localhost:3000/add-book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            title: title,
            genre: genre,
            description: description,
            author: author
        })
    });
    const result = await response.json();
    console.log(result);
}

async function deleteBook(bookID) {
    const response = await fetch('http://localhost:3000/delete-book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            bookID: bookID
        })
    });
    const result = await response.json();
    console.log(result);
}

async function updateBook(bookID, title, genre, description, author) {
    const response = await fetch('http://localhost:3000/update-book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            bookID: bookID,
            title: title,
            genre: genre,
            description: description,
            author: author
        })
    });
    const result = await response.json();
    console.log(result);
}

async function addBookCopy(bookID) {
    const response = await fetch('http://localhost:3000/add-book-copy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            bookID: bookID
        })
    });
    const result = await response.json();
    console.log(result);
}

async function deleteBookCopy(copyID) {
    const response = await fetch('http://localhost:3000/delete-book-copy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            copyID: copyID
        })
    });
    const result = await response.json();
    console.log(result);
}

async function borrowLoan(userID, bookID) {
    const response = await fetch('http://localhost:3000/borrow-loan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            bookID: bookID
        })
    });
    const result = await response.json();
    console.log(result);
}

async function renewLoan(loanID, dueDate) {
    const response = await fetch('http://localhost:3000/renew-loan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            loanID: loanID,
            dueDate: dueDate
        })
    });
    const result = await response.json();
    console.log(result);
}

async function returnLoan(loanID) {
    const response = await fetch('http://localhost:3000/return-loan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            loanID: loanID
        })
    });
    const result = await response.json();
    console.log(result);
}

async function loseLoan(loanID) {
    const response = await fetch('http://localhost:3000/lose-loan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            loanID: loanID
        })
    });
    const result = await response.json();
    console.log(result);
}

async function addReservation(userID, bookID, expiryDate) {
    const response = await fetch('http://localhost:3000/add-reservation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            bookID: bookID,
            expiryDate: expiryDate
        })
    });
    const result = await response.json();
    console.log(result);
}

async function deleteReservation(userID, bookID) {
    const response = await fetch('http://localhost:3000/delete-reservation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID,
            bookID: bookID,
        })
    });
    const result = await response.json();
    console.log(result);
}

async function issueFine(loanID, type, amount, status) {
    const response = await fetch('http://localhost:3000/issue-fine', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            loanID: loanID,
            type: type,
            amount: amount,
            status: status
        })
    });
    const result = await response.json();
    console.log(result);
}

async function payFine(loanID, date, paymentToken) {
    const response = await fetch('http://localhost:3000/pay-fine', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            loanID: loanID,
            date: date,
            paymentToken: paymentToken
        })
    });
    const result = await response.json();
    console.log(result);
}

async function cancelFine(loanID, date) {
    const response = await fetch('http://localhost:3000/cancel-fine', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            loanID: loanID,
            date: date
        })
    });
    const result = await response.json();
    console.log(result);
}