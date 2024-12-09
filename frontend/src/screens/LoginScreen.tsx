import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const LoginScreen = () => {
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const backend_url = import.meta.env.VITE_BE_URL ?? "http://localhost:3000";

  async function signIn(username: string, password: string) {
    try {
      const result = await axios.post(`${backend_url}/api/v1/signin`, {
        username,
        password,
      });

      if (result.status === 200) {
        const { token } = result.data;
        localStorage.setItem("token", token);
        navigate("/", { replace: true }); 
      } else {
        alert("Some error occurred while signing you in");
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      alert("Sign-in failed. Please try again.");
    }
  }

  const handleSubmit = async () => {
    const username = usernameInputRef.current?.value;
    const password = passwordInputRef.current?.value;

    if (username && password) {
      await signIn(username, password);
    } else {
      alert("Please fill in both fields!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              ref={usernameInputRef}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring focus:ring-indigo-500"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              ref={passwordInputRef}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring focus:ring-indigo-500"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </button>

        <div className="text-center mt-4 text-gray-400">or</div>

        <div
          onClick={() => navigate("/SignupScreen")}
          className="text-center mt-2 text-indigo-400 cursor-pointer hover:underline"
        >
          Don't have an account?
        </div>
      </div>
    </div>
  );
};
