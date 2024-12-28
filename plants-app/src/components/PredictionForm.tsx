import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { getCurrentUser } from "../api/authService";
import { Spin } from "antd"; // Import Spin component from Ant Design

interface PredictionResponse {
  plant_name: string;
  health_status: string;
  confidence: number;
  message: string;
}

interface PredictionFormProps {
  onPrediction: (data: PredictionResponse) => void;
  isMobile: boolean;
}

const PredictionForm: React.FC<PredictionFormProps> = ({
  onPrediction,
  isMobile,
}) => {
  const [plantImage, setPlantImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [heatmapImage, setHeatmapImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictionData, setPredictionData] =
    useState<PredictionResponse | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");

  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);
  const [loadingAddPlant, setLoadingAddPlant] = useState<boolean>(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserId(user.userId);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPlantImage(file);
      setError(null);
    } else {
      setPlantImage(null);
      setImagePreview(null);
      setHeatmapImage(null);
      setPredictionData(null);
    }
  };

  const fileInputLabel = plantImage ? plantImage.name : "☘️ Upload Plant Image";

  const handlePrediction = async () => {
    if (!plantImage) {
      setError("Please upload an image before predicting.");
      return;
    }

    setLoadingPrediction(true);
    setError(null);

    setImagePreview(URL.createObjectURL(plantImage));

    const formData = new FormData();
    formData.append("file", plantImage);

    try {
      const predictionResponse = await axiosInstance.post(
        "/plants/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setPredictionData(predictionResponse.data);
      onPrediction(predictionResponse.data);

      setLoadingHeatmap(true);

      const heatmapResponse = await axiosInstance.post(
        "/plants/heatmap",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      );

      const heatmapUrl = URL.createObjectURL(heatmapResponse.data);
      setHeatmapImage(heatmapUrl);
    } catch (error: any) {
      setError(
        "Failed to complete prediction or generate heatmap. Please try again."
      );
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setLoadingPrediction(false);
      setLoadingHeatmap(false);
    }
  };

  const handleAddPlant = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!plantImage || !userId || !predictionData || !description) {
      setError("Please complete all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("file", plantImage);
    formData.append("user_id", userId);
    formData.append("description", description);

    setLoadingAddPlant(true);
    try {
      const response = await axiosInstance.post("/plants", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Plant added:", response.data);

      setPlantImage(null);
      setImagePreview(null);
      setDescription("");
      setPredictionData(null);
      setUserId(null);
      setError(null);
    } catch (error: any) {
      setError("Plant addition failed. Please try again.");
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setLoadingAddPlant(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-6">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        id="file-input"
      />
      <label
        htmlFor="file-input"
        className="mb-4 px-4 py-2 border border-green-700 rounded cursor-pointer w-full text-center"
      >
        {fileInputLabel}
      </label>

      {isMobile && (
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="camera-input"
          capture="environment"
        />
      )}

      {isMobile && (
        <label
          htmlFor="camera-input"
          className="mb-4 px-4 py-2 border rounded cursor-pointer w-max text-center"
        >
          📷 Take a Photo
        </label>
      )}

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={handlePrediction}
        className="px-4 py-2 bg-green-600 text-white text-lg mb-4 mt-2 rounded-lg w-max"
        disabled={loadingPrediction}
      >
        {loadingPrediction ? "🪄 Predicting..." : "🪄 Prediction"}
      </button>

      {predictionData && (
        <div className="m-6 p-6 bg-white shadow rounded w-full flex flex-col items-center text-left">
          <div className="flex w-full justify-between"></div>
          <div className="flex w-full justify-between">
            <div>
              <p className="text-lg font-bold">Image Preview</p>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Selected plant"
                  className="my-4 w-56 h-56 object-cover border rounded"
                />
              )}
            </div>
            <div>
              <p className="text-lg font-bold">Heatmap Scan</p>
              {loadingHeatmap ? (
                <p>Generating heatmap...</p>
              ) : (
                heatmapImage && (
                  <img
                    src={heatmapImage}
                    alt="Heatmap"
                    className="my-4 w-56 h-56 object-cover border rounded"
                  />
                )
              )}
            </div>
          </div>

          <div className="text-left w-full mt-4">
            <p>
              <strong>Plant Name:</strong> {predictionData.plant_name}
            </p>
            <p>
              <strong>Health Status:</strong> {predictionData.health_status}
            </p>
            <p>
              <strong>Confidence:</strong> {predictionData.confidence}%
            </p>
            <p>
              <strong>Message:</strong> {predictionData.message}
            </p>
          </div>

          <form onSubmit={handleAddPlant} className="mt-4 flex flex-col w-full">
            {/* Wrap the submit button with Spin component */}
            <Spin spinning={loadingAddPlant}>
              <textarea
                placeholder="Add your description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mb-2 p-2 border rounded w-full"
                required
              />
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded w-full"
                disabled={loadingAddPlant}
              >
                {loadingAddPlant ? "Adding..." : "Add Plant"}
              </button>
            </Spin>
          </form>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
