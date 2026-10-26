import { useState } from "react";
import "./LoanCard.css";
import PopUp from "./PopUp";
function LoanCard({ loan }) {
  const [popUp, setPopUp] = useState(null);
  return (
    <div className="loan-card">
      <h3>{loan.title}</h3>
      <h3>
        Due: {new Date(parseInt(loan.dueDate)).toLocaleDateString("en-GB")}
      </h3>
      <h3>{loan.status}</h3>

      {loan.status === "active" && (
        <>
          <button
            onClick={() => {
              setPopUp(
                <PopUp
                  title={"Renew Loan"}
                  apiRoute={"renew-loan"}
                  inputs={[]}
                  defaultData={{ loanID: loan.loanID }}
                ></PopUp>,
              );
            }}
          >
            Renew
          </button>
          <button
            onClick={() => {
              setPopUp(
                <PopUp
                  title={"Lose Loan"}
                  apiRoute={"lose-loan"}
                  inputs={[]}
                  defaultData={{ loanID: loan.loanID }}
                ></PopUp>,
              );
            }}
          >
            Lose
          </button>
          <button
            onClick={() => {
              setPopUp(
                <PopUp
                  title={"Return Loan"}
                  apiRoute={"return-loan"}
                  inputs={[]}
                  defaultData={{ loanID: loan.loanID }}
                ></PopUp>,
              );
            }}
          >
            Return
          </button>
        </>
      )}
      {popUp}
    </div>
  );
}
export default LoanCard;
