import { useEffect, useState } from "react";
import { searchForReservations } from "../api/api";
import { useSessionContext } from "../contexts/SessionContext";
import ReservationCard from "../components/ReservationCard";
import "./reservations.css"

function Reservations() {
  const { sessionID } = useSessionContext();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const executeSearch = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await searchForReservations(sessionID, null, null, page);
      console.log(result);
      if (result.reservations) {
        setReservations(result.reservations);
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

  return (
    <div className="reservations">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.startDate}
          reservation={reservation}
        ></ReservationCard>
      ))}
      {reservations.length === 0 ? (
        <h3>No reservations</h3>
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

export default Reservations;
