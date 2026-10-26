import { useState } from "react";
import "./ReservationCard.css";
import PopUp from "./PopUp";
function ReservationCard({ reservation }) {
  const [popUp, setPopUp] = useState(null);
  return (
    <div className="reservation-card">
      <h3>{reservation.title}</h3>
      <h3>
        Start:{" "}
        {new Date(parseInt(reservation.startDate)).toLocaleDateString("en-GB")}
      </h3>
      <div>
        {reservation.expiryDate && (
          <h3>
            Due:{" "}
            {new Date(parseInt(reservation.expiryDate)).toLocaleDateString(
              "en-GB",
            )}
          </h3>
        )}
      </div>
      <button
        onClick={() => {
          setPopUp(
            <PopUp
              title={"Delete Reservation"}
              apiRoute={"delete-reservation"}
              inputs={[]}
              defaultData={{ bookID: reservation.bookID }}
            ></PopUp>,
          );
        }}
      >
        Delete Reservation
      </button>
      {popUp}
    </div>
  );
}
export default ReservationCard;
