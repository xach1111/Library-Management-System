import { useEffect, useState } from "react";
import { searchForBooks } from "../api/api";
import "./home.css";
import BookCard from "../components/BookCard";
import { useSessionContext } from "../contexts/SessionContext";

function Home() {
  const {sessionID} = useSessionContext
  const [searchTitle, setSearchTitle] = useState("");
  const [searchGenre, setSearchGenre] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  const [page, setPage] = useState(1);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const executeSearch = async (targetPage) => {
    if (loading) return;
    setLoading(true);
    try {
      const searchResults = await searchForBooks(
        searchTitle,
        searchGenre,
        searchAuthor,
        5,
        targetPage,
      );
      setBooks(searchResults.books);
      setPage(searchResults.page);
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Failed to load books...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(page);
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();
    executeSearch(1);
    setPage(1);
  };

  const previousPage = (e) => {
    if (loading) return;
    setPage(Math.max(1, page - 1));
  };

  const nextPage = (e) => {
    if (loading) return;
    setPage(page + 1);
  };

  return (
    <div className="home">
      <h2>Search For Books</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search by Title..."
          className="search-input"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Genre..."
          className="search-input"
          value={searchGenre}
          onChange={(e) => setSearchGenre(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Author..."
          className="search-input"
          value={searchAuthor}
          onChange={(e) => setSearchAuthor(e.target.value)}
        />
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <BookCard book={book} key={book.bookID}></BookCard>
          ))}
        </div>
      )}
      <p className="page-number">Page: {page}</p>
      <div className="page-buttons">
        <button onClick={previousPage}>prev</button>
        <button onClick={nextPage}>next</button>
      </div>
    </div>
  );
}

export default Home;
