import { useEffect, useState } from "react";
import { useSessionContext } from "../contexts/SessionContext";
import { getUserData } from "../api/api";
import { useNavigate } from "react-router-dom";
import PopUp from "../components/PopUp";

function Profile() {
  const navigate = useNavigate();

  const { sessionID, setSessionID } = useSessionContext();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  const [popUp, setPopUp] = useState(null);

  const getUser = async () => {
    if (userLoading) return;
    setUserLoading(true);
    try {
      const userResult = await getUserData(sessionID);
      if (userResult.user) {
        setUser(userResult.user);
      } else {
        navigate(`/login/profile`, { replace: true });
      }
    } catch (err) {
      navigate(`/login/profile`, { replace: true });
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => getUser, [sessionID]);

  if (user) {
    return (
      <div className="profile">
        <h2>
          {user.firstName} {user.lastName}
        </h2>
        <h2>{user.email}</h2>
        <h2>Role: {user.role.toUpperCase()}</h2>
        <h2>Membership Status: {user.membershipStatus.toUpperCase()}</h2>
        <button
          onClick={() => {
            setPopUp(
              <PopUp
                title={"Delete Account"}
                apiRoute={"delete-member"}
                inputs={[{ name: "password", type: "password" }]}
              ></PopUp>,
            );
          }}
        >
          Delete Account
        </button>
        <button
          onClick={() => {
            setPopUp(
              <PopUp
                title={"Freeze Account"}
                apiRoute={"freeze-member"}
                inputs={[{ name: "password", type: "password" }]}
              ></PopUp>,
            );
          }}
        >
          Freeze Account
        </button>
        <button
          onClick={() => {
            setPopUp(
              <PopUp
                title={"Unfreeze Account"}
                apiRoute={"unfreeze-member"}
                inputs={[{ name: "password", type: "password" }]}
              ></PopUp>,
            );
          }}
        >
          Unfreeze Account
        </button>
        <button
          onClick={() => {
            setPopUp(
              <PopUp
                title={"Change Password"}
                apiRoute={"change-password"}
                inputs={[
                  { name: "currentPassword", type: "password" },
                  { name: "newPassword", type: "password" },
                ]}
              ></PopUp>,
            );
          }}
        >
          Change Password
        </button>
        <button
          onClick={() => {
            setPopUp(
              <PopUp
                title={"Change Name"}
                apiRoute={"change-name"}
                inputs={[
                  { name: "firstName", type: "text" },
                  { name: "lastName", type: "text" },
                ]}
              ></PopUp>,
            );
          }}
        >
          Change Name
        </button>
        <button
          onClick={() => {
            setSessionID("");
            navigate(`/login/profile`, { replace: true });
          }}
        >
          Sign out
        </button>

        {popUp}
      </div>
    );
  }
}

export default Profile;
