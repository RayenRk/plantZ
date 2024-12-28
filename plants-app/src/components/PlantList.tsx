import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { FiTrash } from "react-icons/fi";
import ConfirmationModal from "../components/ConfirmationModal";
import { Spin } from "antd"; // Import Spin component

interface Plant {
  id_plant: number;
  plant_name: string;
  health_status: string;
  description: string;
  date_creation: string;
  userId: number;
  plant_image: string | null;
}

const PlantList: React.FC = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [plantToDelete, setPlantToDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlants = async () => {
      setIsLoading(true); // Start loading
      try {
        const response = await axiosInstance.get<Plant[]>("/plants");
        setPlants(response.data);
      } catch (error: any) {
        setError("Failed to fetch plants.");
        console.error(
          "Error:",
          error.response ? error.response.data : error.message
        );
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchPlants();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleCardClick = (plantId: number) => {
    navigate(`/plants/${plantId}`);
  };

  const handleDelete = async () => {
    if (plantToDelete === null) return;

    setIsLoading(true);
    try {
      await axiosInstance.delete(`/plants/${plantToDelete}`);
      setPlants(plants.filter((plant) => plant.id_plant !== plantToDelete));
    } catch (error: any) {
      setError("Failed to delete the plant.");
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
      setPlantToDelete(null);
    }
  };

  const openModal = (plantId: number) => {
    setPlantToDelete(plantId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setPlantToDelete(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      {error && <p className="text-red-500">{error}</p>}

      {/* Show spinner if loading */}
      {isLoading ? (
        <div className="flex justify-center">
          <Spin
            size="large"
            tip="Loading plants..."
            className="text-green-700"
          />
        </div>
      ) : plants.length === 0 ? (
        <p className="text-gray-500">No plants available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {plants.map((plant) => (
            <div
              key={plant.id_plant}
              className="bg-white shadow rounded-lg hover:shadow-xl hover:scale-[102%] transition-transform duration-300 cursor-pointer relative"
              onClick={() => handleCardClick(plant.id_plant)}
            >
              {plant.plant_image ? (
                <img
                  src={plant.plant_image}
                  alt={plant.plant_name}
                  className="w-full h-56 object-cover mb-4 rounded-t-lg"
                />
              ) : (
                <div className="w-full h-56 bg-gray-200 rounded-t-lg mb-4 flex items-center justify-center">
                  No Image Available
                </div>
              )}
              <div className="px-6 pb-4">
                <p className="text-xl text-green-700 font-semibold mb-2">
                  {plant.plant_name}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Health Status:</strong> {plant.health_status}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Date Created:</strong>{" "}
                  {formatDate(plant.date_creation)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {plant.description}
                </p>
              </div>
              {/* Delete Icon */}
              <button
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card click
                  openModal(plant.id_plant);
                }}
              >
                <FiTrash size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this plant?"
      />
    </div>
  );
};

export default PlantList;
