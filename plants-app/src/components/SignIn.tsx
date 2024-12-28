import { useState } from "react";
import { login } from "../api/authService";
import greenLeaf from "../assets/green-leaf.svg";
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface SignInProps {
  onLogin: (role: string) => void; // Callback function to handle successful login
  setIsRegistering: (isRegistering: boolean) => void; // Function to toggle registration view
}

const SignIn: React.FC<SignInProps> = ({ onLogin, setIsRegistering }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state

  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); // Set loading to true when login starts
    try {
      const { role } = await login(email, password); // Get role from login response
      onLogin(role);
      // Redirect based on role
      if (role === "Admin") {
        navigate("/users"); // Redirect to /users for Admins
      } else {
        navigate("/predict"); // Redirect to /predict for Clients
      }
    } catch {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false); // Set loading to false when login ends
    }
  };

  return (
    <div className="flex flex-col items-center">
      <img src={greenLeaf} alt="Plant" className="w-16 h-16" />
      <h2 className="text-2xl font-semibold my-8">Sign In</h2>
      <form onSubmit={handleLogin} className="flex flex-col w-72">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 p-2 border rounded"
          required
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white font-semibold rounded"
          disabled={loading} // Disable button when loading
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
        <button
          onClick={() => setIsRegistering(true)}
          className="mt-2 text-green-600"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default SignIn;
