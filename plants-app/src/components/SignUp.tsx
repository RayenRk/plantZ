import { useState } from "react";
import { register } from "../api/authService"; // Import the register function
import greenLeaf from '../assets/green-leaf.svg';

interface RegisterProps {
  onRegister: (isAuthenticated: boolean) => void; // Callback function to handle registration success
  onBackToLogin: () => void; // Function to toggle login view
}

const Register: React.FC<RegisterProps> = ({ onRegister, onBackToLogin }) => {
  const [nom, setNom] = useState<string>(""); // Use 'nom' instead of 'name'
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Add loading state

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent the default form submission
    setLoading(true); // Set loading to true when registration starts

    try {
      await register(nom, email, password); // Register the user
      onRegister(true); // Call the provided callback function to handle registration success
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <img src={greenLeaf} alt="Plant" className="w-16 h-16" />
      <h2 className="text-2xl font-semibold my-8">Register</h2>
      <form onSubmit={handleRegister} className="flex flex-col w-72">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Name" // Update placeholder
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="mb-2 border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2 border p-2 rounded"
          required
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white font-semibold rounded mb-2"
          disabled={loading} // Disable button when loading
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <button onClick={onBackToLogin} className="mt-2 text-green-600">
        Back to Login
      </button>
    </div>
  );
};

export default Register;
