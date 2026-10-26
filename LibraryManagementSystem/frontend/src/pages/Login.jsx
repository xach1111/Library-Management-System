import { useNavigate, useParams } from "react-router-dom";
import { useSessionContext } from "../contexts/SessionContext";
import { logIn, validateSessionID } from "../api/api";
import { useEffect, useState } from "react";
function Login() {
  const { path } = useParams();
  const navigate = useNavigate();

  const { sessionID, setSessionID } = useSessionContext();
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const executeLogin = async (e) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      const loginResult = await logIn(email, password);
      if (loginResult.sessionID) {
        setSessionID(loginResult.sessionID);
      } else {
        setLoginError(loginResult.message);
      }
    } catch (err) {
      setLoginError("Failed to get user data");
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    async function executeRoute() {
      const result = await validateSessionID(sessionID);
      if (result.valid) {
        navigate(`/${path}`, { replace: true });
      }
    }
    executeRoute();
  }, [sessionID]);

  return (
    <form onSubmit={executeLogin}>
      <h2>Log in</h2>
      <input
        type="text"
        placeholder="Email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log In</button>
      <button>Create an account</button>
      <h3>{loginError}</h3>
    </form>
  );
}

export default Login;
