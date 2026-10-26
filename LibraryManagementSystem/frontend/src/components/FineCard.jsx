import { useState } from "react";
import "./FineCard.css";
import PopUp from "./PopUp";
function FineCard({ fine }) {
  const [popUp, setPopUp] = useState(null);
  return (
    <div className="fine-card">
      <h3>Loan ID: {fine.loanID}</h3>
      <h3>{fine.title}</h3>
      <h3>
        Issued: {new Date(parseInt(fine.date)).toLocaleDateString("en-GB")}
      </h3>
      <h3>Reason: {fine.type}</h3>
      <h3>Amount: £{fine.amount}</h3>
      <h3>Status: {fine.status}</h3>

      {fine.status === "outstanding" && (
        <>
          <button
            onClick={() => {
              setPopUp(
                <PopUp
                  title={"Pay Fine"}
                  apiRoute={"pay-fine"}
                  inputs={[]}
                  defaultData={{ loanID: fine.loanID, paymentToken: "example", date: fine.date}}
                ></PopUp>,
              );
            }}
          >
            Pay
          </button>
          {popUp}
        </>
      )}
    </div>
  );
}
export default FineCard;
