import { useEffect, useState } from "react";
import { searchForFines } from "../api/api";
import { useSessionContext } from "../contexts/SessionContext";
import FineCard from "../components/FineCard";
import "./fines.css"

function Fines() {
  const { sessionID } = useSessionContext();
  //get all fines
  const [fines, setfines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const executeSearch = async () => {
    if (loading) return;
    setLoading(true);

    try {
      console.log(sessionID);
      const result = await searchForFines(sessionID, null, null, page);
      console.log(result);
      if (result.fines) {
        setfines(result.fines);
        setPage(result.page);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (sessionID === "") return;
    executeSearch();
  }, [sessionID]);

  useEffect(() => {
    if (sessionID === "") return;
    executeSearch(page);
  }, [page]);

  const previousPage = (e) => {
    if (loading) return;
    setPage(Math.max(1, page - 1));
  };

  const nextPage = (e) => {
    if (loading) return;
    setPage(page + 1);
  };

  //for each fine add a fine card
  return (
    <div className="fines">
      {fines.map((fine) => (
        <FineCard key={fine.date} fine={fine}></FineCard>
      ))}
      {fines.length === 0 ? (
        <h3>No Fines</h3>
      ) : (
        <div>
          <p className="page-number">Page: {page}</p>
          <div className="page-buttons">
            <button onClick={previousPage}>prev</button>
            <button onClick={nextPage}>next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fines;
