import { useEffect, useState } from "react";
import { message, Modal, Button, Input } from "antd";
import { FiTrash, FiHeart } from "react-icons/fi";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

interface Post {
  id_post: number;
  titre: string;
  description: string;
  photo: string | null;
  user: { username: string };
  date_creation: string;
  liked: boolean;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [comment, setComment] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get<Post[]>("/posts");
        setPosts(response.data);
        // Initialize likedPosts based on fetched data
        const likedSet = new Set(
          response.data.filter((post) => post.liked).map((post) => post.id_post)
        );
        setLikedPosts(likedSet);
      } catch (error: any) {
        setError("Failed to fetch posts.");
        console.error(
          "Error:",
          error.response ? error.response.data : error.message
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
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

  const handleDelete = async () => {
    if (postToDelete === null) return;

    setIsLoading(true);
    try {
      await axiosInstance.delete(`/posts/${postToDelete}`);
      setPosts(posts.filter((post) => post.id_post !== postToDelete));
      message.success("Post deleted successfully!");
    } catch (error: any) {
      setError("Failed to delete the post.");
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
      setPostToDelete(null);
    }
  };

  const openModal = (postId: number) => {
    setPostToDelete(postId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setPostToDelete(null);
    setIsModalOpen(false);
  };

  const handleLike = async (postId: number) => {
    try {
      // Determine the new liked status by checking if the post is already liked
      const newLikedStatus = !likedPosts.has(postId);

      // Send the updated liked status to the backend
      const response = await axiosInstance.patch(`/posts/${postId}`, {
        liked: newLikedStatus, // Sending the updated liked status
      });

      // Update the likedPosts state with the new status
      setLikedPosts((prev) => {
        const updatedSet = new Set(prev);
        if (newLikedStatus) {
          updatedSet.add(postId); // Add postId if it's now liked
        } else {
          updatedSet.delete(postId); // Remove postId if it's now unliked
        }
        return updatedSet;
      });
    } catch (error: any) {
      message.error("Failed to like the post.");
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  return (
    <div className="p-6 w-32 max-w-3xl mx-auto min-w-[50vh]">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {posts.length === 0 ? (
        <p className="text-gray-500 text-center">No posts available.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id_post}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-4">
                {/* Post Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full">
                    <img
                      src="https://ui-avatars.com/api/?name=Rayen+Rakkad&background=random"
                      alt="User Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {post.user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(post.date_creation)}
                    </p>
                  </div>
                </div>

                {/* Post Image */}
                {post.photo ? (
                  <img
                    src={post.photo}
                    alt={post.titre}
                    className="w-full h-46 object-contain rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-56 bg-gray-300 rounded-lg mb-4 flex items-center justify-center text-white font-semibold">
                    No Image Available
                  </div>
                )}

                {/* Post Content */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {post.titre}
                </h2>
                <p className="text-sm text-gray-700 mb-4">{post.description}</p>

                {/* Like Button */}
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={() => handleLike(post.id_post)}
                    className={`flex items-center space-x-2 ${
                      likedPosts.has(post.id_post)
                        ? "text-red-600"
                        : "text-gray-600"
                    } hover:text-red-800`}
                  >
                    <FiHeart size={20} />
                    <span className="text-sm">
                      {likedPosts.has(post.id_post) ? "Liked" : "Like"}
                    </span>
                  </button>

                  <span className="text-sm text-gray-500">
                    {likedPosts.has(post.id_post) ? "Liked" : "Not Liked"}
                  </span>
                </div>

                {/* Comment Section */}
                <div className="mb-4">
                  <Input
                    value={comment}
                    onChange={handleCommentChange}
                    placeholder="Add a comment..."
                    className="mb-2"
                  />
                  <Button
                    type="primary"
                    onClick={() => message.info("Comment added!")}
                  >
                    Comment
                  </Button>
                </div>

                {/* Actions (Delete Button) */}
                {/* <button
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering card hover
                    openModal(post.id_post);
                  }}
                >
                  <FiTrash size={20} />
                  <span className="text-sm">Delete</span>
                </button> */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        title="Delete Post"
        visible={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button
            key="cancel"
            onClick={closeModal}
            className="bg-gray-500 text-white"
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleDelete}
            loading={isLoading}
          >
            Delete
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this post?</p>
      </Modal>
    </div>
  );
};

export default Feed;
