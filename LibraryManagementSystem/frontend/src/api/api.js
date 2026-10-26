const BASE_URL = 'http://localhost:3000';
export const searchForBooks = async (title, genre, author, limit, page) => {
    const response = await fetch(`${BASE_URL}/search-for-books`, {
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
    const data = await response.json();
    return data;
}

export const searchForLoans = async (sessionID, userID, limit, page) => {
    console.log("sending")
    const response = await fetch(`${BASE_URL}/search-for-loans`, {
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
    const data = await response.json();
    return data;
}

export const searchForReservations = async (sessionID, userID, limit, page) => {
    console.log("sending")
    const response = await fetch(`${BASE_URL}/search-for-reservations`, {
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
    const data = await response.json();
    return data;
}

export const searchForFines = async (sessionID, userID, limit, page) => {
    console.log("sending")
    const response = await fetch(`${BASE_URL}/search-for-fines`, {
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
    const data = await response.json();
    return data;
}

export const getUserData = async (sessionID, userID) => {
    const response = await fetch(`${BASE_URL}/get-user-data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID,
            userID: userID
        })
    });
    const data = await response.json();
    return data;
}

export const logIn = async (email, password) => {
    const response = await fetch(`${BASE_URL}/log-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });
    const data = await response.json();
    return data;

}

export const validateSessionID = async (sessionID) => {
    const response = await fetch(`${BASE_URL}/validate-sessionID`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionID: sessionID
        })
    });
    const data = await response.json();
    return data;

}

// async function addMember(firstName, lastName, email, password) {
//     const response = await fetch('http://localhost:3000/add-member', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             firstName: firstName,
//             lastName: lastName,
//             email: email,
//             password: password
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function deleteMember(userID, password) {
//     const response = await fetch('http://localhost:3000/delete-member', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             password, password
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function freezeMember(userID, password) {
//     const response = await fetch('http://localhost:3000/freeze-member', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             password, password
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function unfreezeMember(userID, password) {
//     const response = await fetch('http://localhost:3000/unfreeze-member', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             password, password
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function changePassword(userID, currentPassword, newPassword) {
//     const response = await fetch('http://localhost:3000/change-password', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             currentPassword: currentPassword,
//             newPassword: newPassword
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function changeName(userID, firstName, lastName) {
//     const response = await fetch('http://localhost:3000/change-name', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             firstName: firstName,
//             lastName: lastName
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function promoteMember(userID, email, password) {
//     const response = await fetch('http://localhost:3000/promote-member', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             userID: userID,
//             email: email,
//             password: password
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function addBook(title, genre, description, author) {
//     const response = await fetch('http://localhost:3000/add-book', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             title: title,
//             genre: genre,
//             description: description,
//             author: author
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function deleteBook(bookID) {
//     const response = await fetch('http://localhost:3000/delete-book', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             bookID: bookID
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function updateBook(bookID, title, genre, description, author) {
//     const response = await fetch('http://localhost:3000/update-book', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             bookID: bookID,
//             title: title,
//             genre: genre,
//             description: description,
//             author: author
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function addBookCopy(bookID) {
//     const response = await fetch('http://localhost:3000/add-book-copy', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             bookID: bookID
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function deleteBookCopy(copyID) {
//     const response = await fetch('http://localhost:3000/delete-book-copy', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             copyID: copyID
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function borrowLoan(userID, bookID) {
//     const response = await fetch('http://localhost:3000/borrow-loan', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             bookID: bookID
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function renewLoan(loanID, dueDate) {
//     const response = await fetch('http://localhost:3000/renew-loan', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             loanID: loanID,
//             dueDate: dueDate
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function returnLoan(loanID) {
//     const response = await fetch('http://localhost:3000/return-loan', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             loanID: loanID
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function loseLoan(loanID) {
//     const response = await fetch('http://localhost:3000/lose-loan', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             loanID: loanID
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function addReservation(userID, bookID, expiryDate) {
//     const response = await fetch('http://localhost:3000/add-reservation', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             bookID: bookID,
//             expiryDate: expiryDate
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function deleteReservation(userID, bookID) {
//     const response = await fetch('http://localhost:3000/delete-reservation', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             userID: userID,
//             bookID: bookID,
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function issueFine(loanID, type, amount, status) {
//     const response = await fetch('http://localhost:3000/issue-fine', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             loanID: loanID,
//             type: type,
//             amount: amount,
//             status: status
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function payFine(loanID, date, paymentToken) {
//     const response = await fetch('http://localhost:3000/pay-fine', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             loanID: loanID,
//             date: date,
//             paymentToken: paymentToken
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }

// async function cancelFine(loanID, date) {
//     const response = await fetch('http://localhost:3000/cancel-fine', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             sessionID: sessionID,
//             loanID: loanID,
//             date: date
//         })
//     });
//     const result = await response.json();
//     console.log(result);
// }