import { useSessionContext } from "../contexts/SessionContext";
import "./BookCard.css";
import { useState } from "react";
function BookCard({ book }) {
  const BASE_URL = "http://localhost:3000";
  const { sessionID } = useSessionContext();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(null);
  const [opened, setOpened] = useState(false);
  const openBook = () => {
    setOpened(true);
  };
  const closeBook = () => {
    setOpened(false);
  };
  return (
    <>
      <button className="book-card" onClick={openBook}>
        <p className="author">{book.author}</p>
        <h3 className="title">{book.title}</h3>
        <p className="genre">{book.genre}</p>
      </button>
      {opened && (
        <div className="book-card-back">
          <button className="close-btn" onClick={closeBook}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
            </svg>
          </button>
          <p className="author">{book.author}</p>
          <h3 className="title">{book.title}</h3>
          <p className="genre">{book.genre}</p>
          <p className="description">{book.description}</p>
          <button
            className="borrow-book-btn"
            onClick={async () => {
              if (loading) return;
              setLoading(true);
              try {
                const response = await fetch(`${BASE_URL}/borrow-loan`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    sessionID: sessionID,
                    bookID: book.bookID,
                  }),
                });
                const data = await response.json();
                setMessage(data.message);
                if (data.message === "Invalid session ID") {
                  setMessage("Log in to borrow a book");
                }
              } catch (err) {
                setMessage("Something went wrong");
              } finally {
                setLoading(false);
              }
            }}
          >
            Borrow Book
          </button>
          <button
            className="reserve-book-btn"
            onClick={async () => {
              if (loading) return;
              setLoading(true);
              try {
                const response = await fetch(`${BASE_URL}/add-reservation`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    sessionID: sessionID,
                    bookID: book.bookID,
                  }),
                });
                const data = await response.json();
                setMessage(data.message);
                if (data.message === "Invalid session ID") {
                  setMessage("Log in to reserve a book");
                }
              } catch (err) {
                setMessage("Something went wrong");
              } finally {
                setLoading(false);
              }
            }}
          >
            Reserve Book
          </button>
          <p>{message}</p>
        </div>
      )}
    </>
  );
}

export default BookCard;
