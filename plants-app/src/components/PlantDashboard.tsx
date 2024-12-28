import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Image,
  Button,
  Modal,
  Typography,
  Form,
  Input,
  message,
} from "antd";
import { FiTrash } from "react-icons/fi";
import axiosInstance from "../api/axiosInstance";
import VersionPredictionForm from "./VersionPredictionForm";
import { getCurrentUser } from "../api/authService";

interface Version {
  id_version: number;
  updated_health_status: string;
  date_created: string;
  updated_image: string | null;
}

interface Plant {
  id_plant: number;
  plant_name: string;
  health_status: string;
  description: string;
  date_creation: string;
  plant_image: string | null;
}

const { Title, Text } = Typography;

const PlantDashboard: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);

  useEffect(() => {
    console.log("Plant ID:", plantId); // Check the plantId value
    if (!plantId) {
      setError("Plant ID is missing.");
      return;
    }

    const fetchPlantDetails = async () => {
      try {
        const plantResponse = await axiosInstance.get<Plant>(
          `/plants/${plantId}`
        );
        setPlant(plantResponse.data);
      } catch (err: any) {
        setError("Failed to fetch plant details.");
        console.error("Error:", err.response ? err.response.data : err.message);
      }
    };

    // Fetch plant details and versions when the component mounts
    const fetchVersions = async () => {
      setLoading(true);
      try {
        const versionsResponse = await axiosInstance.get<Version[]>(
          `/plants/${plantId}/versions`
        );
        setVersions(versionsResponse.data);
      } catch (err: any) {
        setError("Failed to fetch plant versions.");
        console.error("Error:", err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlantDetails();
    fetchVersions();
  }, [plantId]);

  const handleCreatePost = async (values: {
    titre: string;
    description: string;
    plantId: string;
  }) => {
    if (!values.plantId) {
      message.error("Plant ID is required.");
      return;
    }

    const userId = getCurrentUser()?.userId;
    if (!userId) {
      message.error("User ID is required.");
      return;
    }

    try {
      await axiosInstance.post("/posts", {
        titre: values.titre,
        description: values.description,
        plantId: values.plantId, // Use the plantId from the form
        userId: userId,
      });
      message.success("Post created successfully!");
      setCreatePostModalOpen(false);
      navigate("/feed");
    } catch (err: any) {
      message.error("Failed to create post.");
      console.error("Error:", err.response ? err.response.data : err.message);
    }
  };

  const confirmDeletion = (versionId: number) => {
    setVersionToDelete(versionId);
    setConfirmationOpen(true);
  };

  const handleVersionDelete = async () => {
    if (versionToDelete === null) return;

    setLoading(true);
    try {
      await axiosInstance.delete(
        `/plants/${plantId}/versions/${versionToDelete}`
      );
      setVersions(
        versions.filter((version) => version.id_version !== versionToDelete)
      );
    } catch (err: any) {
      setError("Failed to delete version.");
      console.error("Error:", err.response ? err.response.data : err.message);
    } finally {
      setConfirmationOpen(false);
      setVersionToDelete(null);
      setLoading(false);
    }
  };

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

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (!plant) {
    return (
      <p className="text-gray-500 text-center">Loading plant details...</p>
    );
  }

  const columns = [
    {
      title: "Version Image",
      dataIndex: "updated_image",
      key: "updated_image",
      render: (image: string | null) =>
        image ? (
          <Image src={image} alt="Version Image" width={100} />
        ) : (
          <div className="bg-gray-200 w-24 h-24 flex items-center justify-center text-gray-500">
            No Image
          </div>
        ),
    },
    {
      title: "Health Status",
      dataIndex: "updated_health_status",
      key: "updated_health_status",
    },
    {
      title: "Date Created",
      dataIndex: "date_created",
      key: "date_created",
      render: (date: string) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Version) => (
        <Button
          danger
          icon={<FiTrash />}
          onClick={() => confirmDeletion(record.id_version)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8">
      {/* Plant Details Section */}
      <div className="lg:w-1/3 w-full">
        <Card className="shadow-md">
          <div className="flex flex-col items-center">
            {plant.plant_image ? (
              <Image
                src={plant.plant_image}
                alt={plant.plant_name}
                width={200}
                className="rounded"
              />
            ) : (
              <div className="bg-gray-200 w-48 h-48 flex items-center justify-center text-gray-500 rounded-lg">
                No Image Available
              </div>
            )}
            <div className="mt-4 text-center">
              <Title level={4}>{plant.plant_name}</Title>
              <Text strong>Health Status:</Text> {plant.health_status} <br />
              <Text strong>Date Created:</Text>{" "}
              {formatDate(plant.date_creation)} <br />
              <Text strong>Description:</Text> {plant.description}
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button type="primary" onClick={() => setCreatePostModalOpen(true)}>
              Create Post
            </Button>
          </div>
        </Card>
      </div>

      {/* Versions Table Section */}
      <div className="lg:w-2/3 w-full">
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Plant Versions</Title>
          <Button type="primary" onClick={() => setModalOpen(true)}>
            Add New Version
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={versions.map((version) => ({
            ...version,
            key: version.id_version,
          }))}
          loading={loading}
          pagination={{ pageSize: 3 }}
        />
      </div>

      {/* Add Version Modal */}
      <Modal
        visible={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title="Add New Version"
      >
        <VersionPredictionForm
          plantId={plant.id_plant.toString()}
          onSuccess={async () => {
            setModalOpen(false);
            // set versions to add the new version to the list
            await axiosInstance
              .get<Version[]>(`/plants/${plantId}/versions`)
              .then((response) => setVersions(response.data))
              .catch((err: any) => {
                setError("Failed to fetch plant versions.");
                console.error(
                  "Error:",
                  err.response ? err.response.data : err.message
                );
              });
          }}
        />
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={createPostModalOpen}
        onCancel={() => setCreatePostModalOpen(false)}
        footer={null}
        title="Create Post"
      >
        <Form
          layout="vertical"
          onFinish={handleCreatePost}
          initialValues={{ plantId }} // Set plantId as an initial value for the form
        >
          <Form.Item
            label="Title"
            name="titre"
            rules={[
              { required: true, message: "Please input the post title!" },
            ]}
          >
            <Input placeholder="Enter the post title" />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Please input the post description!" },
            ]}
          >
            <Input.TextArea rows={4} placeholder="Enter the post description" />
          </Form.Item>
          {/* Hidden field for plantId */}
          <Form.Item name="plantId" style={{ display: "none" }}>
            <Input value={plantId} />
          </Form.Item>
          <div className="flex justify-end">
            <Button
              onClick={() => setCreatePostModalOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationOpen}
        onOk={handleVersionDelete}
        onCancel={() => setConfirmationOpen(false)}
        title="Confirm Deletion"
      >
        Are you sure you want to delete this version?
      </Modal>
    </div>
  );
};

export default PlantDashboard;
