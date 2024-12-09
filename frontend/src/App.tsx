import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginScreen } from "./screens/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen";
import App2 from "./screens/App2";



function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App2 />} />
          <Route path="/LoginScreen" element={<LoginScreen />} />
          <Route path="/SignupScreen" element={<SignupScreen />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
