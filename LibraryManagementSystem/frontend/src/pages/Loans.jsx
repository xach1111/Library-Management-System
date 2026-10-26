import { useEffect, useState } from "react";
import { searchForLoans } from "../api/api";
import { useSessionContext } from "../contexts/SessionContext";
import LoanCard from "../components/LoanCard";
import "./loans.css";

function Loans() {
  const { sessionID } = useSessionContext();
  //get all loans
  const [loans, setloans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const executeSearch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await searchForLoans(sessionID, null, null, page);
      if (result.loans) {
        setloans(result.loans);
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

  //for each loan add a loan card
  return (
    <div className="loans">
      {loans.map((loan) => (
        <LoanCard key={loan.loanID} loan={loan}></LoanCard>
      ))}
      {loans.length === 0 ? (
        <h3>No Loans</h3>
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

export default Loans;
