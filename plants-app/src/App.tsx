import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
} from "react-router-dom";
import { Spin } from "antd"; // Import Spin component
import PredictionForm from "./components/PredictionForm";
import PlantList from "./components/PlantList";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import PlantDashboard from "./components/PlantDashboard"; // Import PlantDashboard
import AuthLinks from "./components/AuthLinks"; // Import the AuthLinks component
import greenLeaf from "./assets/green-leaf.svg";
import Feed from "./components/Feed";
import Users from "./pages/Users";
import { logout, isAuthenticated } from "./api/authService";
import Posts from "./pages/Posts";

interface PredictionResponse {
  plant_name: string;
  health_status: string;
  confidence: number;
  message: string;
}

// PrivateRoute component for role-based redirection
const PrivateRoute = ({
  element,
  requiredRole,
}: {
  element: JSX.Element;
  requiredRole: string;
}) => {
  const authStatus = {
    isAuthenticated: isAuthenticated(),
    userRole: localStorage.getItem("userRole") || "",
  };
  if (!authStatus.isAuthenticated || authStatus.userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return element;
};

function App() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [auth, setAuth] = useState({
    isAuthenticated: isAuthenticated(),
    userRole: localStorage.getItem("userRole") || "",
  });
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsMobile(/mobile|android|iphone|ipad|ipod/.test(userAgent));
  }, []);

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setAuth({
        isAuthenticated: isAuthenticated(),
        userRole: localStorage.getItem("userRole") || "",
      });
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsMobile(
        /mobile|android|iphone|ipad|ipod/.test(userAgent) ||
          window.innerWidth < 768
      );
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handlePredictionResult = (data: PredictionResponse) => {
    setPrediction(data);
    setIsLoading(false);
  };

  const handleLogin = (role: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setAuth({ isAuthenticated: true, userRole: role });
      setIsRegistering(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoading(true);
    logout();
    setAuth({ isAuthenticated: false, userRole: "" });
    setPrediction(null);
    setIsLoading(false);
  };

  const handleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      handleLogin("Client");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <Router>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
        <Link
          to="/predict"
          className="absolute ml-2 top-4 left-4 flex items-center cursor-pointer"
        >
          <img src={greenLeaf} alt="Plant" className="w-7 h-7" />
          <h1 className="text-2xl font-bold ml-2 text-green-700">PlantZ</h1>
        </Link>

        {auth.isAuthenticated && (
          <AuthLinks
            handleLogout={handleLogout}
            userRole={auth.userRole as "Client" | "Admin"}
          />
        )}

        <div className="mt-16">
          {isLoading ? (
            <div className="flex justify-center">
              <Spin size="large" tip="Loading..." className="text-green-700" />
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  auth.isAuthenticated ? (
                    <Navigate to="/predict" replace />
                  ) : isRegistering ? (
                    <SignUp
                      onRegister={handleRegister}
                      onBackToLogin={() => setIsRegistering(false)}
                    />
                  ) : (
                    <SignIn
                      onLogin={(role: string) => handleLogin(role)}
                      setIsRegistering={() => setIsRegistering(true)}
                    />
                  )
                }
              />
              <Route
                path="/predict"
                element={
                  auth.isAuthenticated && auth.userRole === "Client" ? (
                    <PredictionForm
                      onPrediction={handlePredictionResult}
                      isMobile={isMobile}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/plants"
                element={
                  auth.isAuthenticated ? (
                    <PlantList />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/plants/:plantId"
                element={
                  auth.isAuthenticated ? (
                    <PlantDashboard />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/feed"
                element={
                  isAuthenticated ? <Feed /> : <Navigate to="/" replace />
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute element={<Users />} requiredRole="Admin" />
                }
              />
              <Route
                path="/all-posts"
                element={
                  <PrivateRoute element={<Posts />} requiredRole="Admin" />
                }
              />
            </Routes>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
