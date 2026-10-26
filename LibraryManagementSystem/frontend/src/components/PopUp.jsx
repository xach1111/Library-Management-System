import { useState } from "react";
import { useSessionContext } from "../contexts/SessionContext";
import "./popUp.css"
function PopUp({ title, apiRoute, inputs, defaultData}) {
  if(!defaultData){
    defaultData = {}
  }
  console.log(defaultData)
  const BASE_URL = "http://localhost:3000";
  const { sessionID } = useSessionContext();
  const [inputsState, setInputState] = useState(() => {
    const initialState = {};
    inputs.forEach((input) => {
      initialState[input.name] = "";
    });
    return initialState;
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    console.log(inputsState);
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${BASE_URL}/${apiRoute}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...inputsState, ...{ sessionID: sessionID }, ...defaultData }),
      });
      const data = await response.json();
      setResult(data.message);
      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.log(err)
      setResult("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="popUp" onSubmit={handleSubmit}>
      <h3>{title}</h3>
      {inputs.map((input) => (
        <input
          key={input.name}
          name={input.name}
          type={input.type}
          placeholder={`${input.name}...`}
          value={inputsState[input.name]}
          onChange={handleChange}
        />
      ))}

      {result && <p>{result}</p>}

      <div>
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </form>
  );
}

export default PopUp;
