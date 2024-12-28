import { Link, useLocation } from "react-router-dom";

interface AuthLinksProps {
  handleLogout: () => void;
  userRole: "Client" | "Admin";
}

const AuthLinks: React.FC<AuthLinksProps> = ({ handleLogout, userRole }) => {
  const location = useLocation();

  const ClientLinks = () => (
    <>
      {location.pathname !== "/predict" && (
        <Link
          to="/predict"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Prediction
        </Link>
      )}
      {location.pathname !== "/plants" && (
        <Link
          to="/plants"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          View Your Plants
        </Link>
      )}
      {location.pathname !== "/feed" && (
        <Link to="/feed" className="bg-green-600 text-white px-4 py-2 rounded">
          Posts
        </Link>
      )}
    </>
  );
  const AdminLinks = () => (
    <>
      {location.pathname !== "/users" && (
        <Link to="/users" className="bg-green-600 text-white px-4 py-2 rounded">
          Manage Users
        </Link>
      )}
      {location.pathname !== "/all-posts" && (
        <Link
          to="/all-posts"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Manage Posts
        </Link>
      )}
    </>
  );
  return (
    <div className="absolute top-4 right-4 flex space-x-2">
      {userRole === "Client" ? <ClientLinks /> : <AdminLinks />}
      <button
        onClick={handleLogout}
        className="border-2 border-orange-600 text-orange-600 px-4 py-2 rounded font-semibold"
      >
        Logout
      </button>
    </div>
  );
};

export default AuthLinks;
