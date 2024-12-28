import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Spin } from "antd";
import axiosInstance from "../api/axiosInstance";

interface Post {
  id: number;
  titre: string;
  description: string;
  author: string;
}

const Posts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Loading state for Spin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [form] = Form.useForm();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true); // Start loading
    try {
      const response = await axiosInstance.get<Post[]>("/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      message.error("Failed to fetch posts!");
    } finally {
      setIsLoading(false); // End loading
    }
  };

  const handleOpenModal = (post: Post | null = null) => {
    setIsModalOpen(true);
    setIsEditMode(!!post);
    setSelectedPost(post);
    if (post) {
      form.setFieldsValue(post);
    } else {
      form.resetFields();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    form.resetFields();
  };

  const handleCreateOrUpdatePost = async () => {
    setIsLoading(true); // Start loading
    try {
      const values = await form.validateFields();
      if (isEditMode && selectedPost) {
        await axiosInstance.put(`/posts/${selectedPost.id}`, values);
        setPosts(
          posts.map((post) =>
            post.id === selectedPost.id ? { ...post, ...values } : post
          )
        );
        message.success("Post updated successfully!");
      } else {
        const response = await axiosInstance.post("/posts", values);
        setPosts([...posts, response.data]);
        message.success("Post created successfully!");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving post:", error);
      message.error("Failed to save post!");
    } finally {
      setIsLoading(false); // End loading
    }
  };

  const confirmDeletePost = (id: number) => {
    setPostToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePost = async () => {
    setIsLoading(true); // Start loading
    try {
      if (postToDelete === null) return;
      await axiosInstance.delete(`/posts/${postToDelete}`);
      setPosts(posts.filter((post) => post.id !== postToDelete));
      message.success("Post deleted successfully!");
    } catch (error: any) {
      console.error(
        "Error deleting post:",
        error.response ? error.response.data : error.message
      );
      message.error("Failed to delete post!");
    } finally {
      setIsLoading(false); // End loading
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPostToDelete(null);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const columns = [
    {
      title: "Title",
      dataIndex: "titre",
      key: "titre",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Post) => (
        <div>
          <Button type="link" onClick={() => handleOpenModal(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => confirmDeletePost(record.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1>Posts</h1>
      <Spin spinning={isLoading}>
        <Table
          dataSource={posts}
          columns={columns}
          rowKey="id"
          style={{ marginTop: 16 }}
          pagination={{ pageSize: 5 }}
        />
      </Spin>
      <Modal
        title={isEditMode ? "Edit Post" : "Add Post"}
        visible={isModalOpen}
        onOk={handleCreateOrUpdatePost}
        onCancel={handleCloseModal}
        okText={isEditMode ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Title"
            name="titre"
            rules={[
              { required: true, message: "Please enter the post title!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Please enter the post description!" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            label="Author"
            name="author"
            rules={[
              { required: true, message: "Please enter the author name!" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Confirm Delete"
        visible={isDeleteModalOpen}
        onOk={handleDeletePost}
        onCancel={handleCancelDelete}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete this post?</p>
      </Modal>
    </div>
  );
};

export default Posts;
