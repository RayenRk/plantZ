import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

interface PredictionResponse {
  plant_name: string;
  health_status: string;
  confidence: number;
  message: string;
}

interface VersionPredictionFormProps {
  plantId: string;
  onSuccess: () => void; // Callback to refresh the dashboard
}

const VersionPredictionForm: React.FC<VersionPredictionFormProps> = ({
  plantId,
  onSuccess,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionData, setPredictionData] =
    useState<PredictionResponse | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Create a preview URL for the image
      setPredictionData(null); // Reset prediction data when a new file is selected
    }
  };

  const handlePrediction = async () => {
    if (!imageFile) {
      setError("Please upload an image before predicting.");
      return;
    }

    setLoadingPrediction(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      // Call the backend to get prediction results
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
    } catch (error: any) {
      setError("Failed to complete prediction. Please try again.");
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      setError("Please upload an image.");
      return;
    }

    if (!predictionData) {
      setError("Please make a prediction before submitting.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      // Make API call to create a new version
      await axiosInstance.post(`/plants/${plantId}/versions`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Reset the form after successful submission
      setImageFile(null);
      setImagePreview(null);
      setPredictionData(null);
      setLoading(false);
      onSuccess(); // Callback to trigger a version refetch in the dashboard
    } catch (err: any) {
      setError("Failed to create version. Please try again.");
      setLoading(false);
    }
  };

  const fileInputLabel = imageFile ? imageFile.name : "☘️ Upload Plant Image";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="mb-4 px-4 py-2 border border-green-700 rounded cursor-pointer w-full text-center"
        >
          {fileInputLabel}
        </label>
      </div>

      {imagePreview && (
        <div className="mt-4">
          <h4 className="font-bold">Image Preview</h4>
          <img
            src={imagePreview}
            alt="Uploaded Plant"
            className="my-4 w-56 h-56 object-cover border rounded"
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {imageFile && !loadingPrediction && (
        <div>
          <button
            type="button"
            onClick={handlePrediction}
            className="px-6 py-3 bg-green-600 text-white rounded-lg"
            disabled={loadingPrediction}
          >
            {loadingPrediction ? "🪄 Predicting..." : "🪄 Predict"}
          </button>
        </div>
      )}

      {predictionData && (
        <div className="mt-4 p-4 bg-white border rounded shadow-md">
          <h3 className="text-lg font-bold">Prediction Result</h3>
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
      )}

      <div className="flex justify-between items-center">
        <button
          type="submit"
          disabled={loading || loadingPrediction || !predictionData}
          className="px-6 py-3 bg-green-600 text-white rounded-lg"
        >
          {loading ? "Submitting..." : "Add Version"}
        </button>
      </div>
    </form>
  );
};

export default VersionPredictionForm;
