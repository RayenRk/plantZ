import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Spin } from "antd";
import axiosInstance from "../api/axiosInstance";
interface Users {
  id: number;
  nom: string;
  email: string;
  role: string;
}
const Users = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state for Spin
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const fetchUsers = async () => {
    setIsLoading(true); // Start loading
    try {
      const response = await axiosInstance.get<Users[]>("/users/all");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false); // End loading
    }
  };
  const handleOpenModal = (user = null) => {
    setIsModalOpen(true);
    setIsEditMode(!!user);
    setSelectedUser(user);
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    form.resetFields();
  };
  const handleCreateOrUpdateUser = async () => {
    setIsLoading(true); // Start loading
    try {
      const values = await form.validateFields();
      if (isEditMode) {
        await axiosInstance.put(`/users/${selectedUser.id}`, values);
        setUsers(
          users.map((user) =>
            user.id === selectedUser.id ? { ...user, ...values } : user
          )
        );
        message.success("User updated successfully!");
      } else {
        const response = await axiosInstance.post("/users", values);
        setUsers([...users, response.data]);
        message.success("User created successfully!");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving user:", error);
      message.error("Failed to save user!");
    } finally {
      setIsLoading(false); // End loading
    }
  };
  const confirmDeleteUser = (id: number) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteUser = async () => {
    setIsLoading(true); // Start loading
    try {
      await axiosInstance.delete(`/users/${userToDelete}`);
      setUsers(users.filter((user) => user.id !== userToDelete));
      message.success("User deleted successfully!");
    } catch (error: any) {
      console.error(
        "Error deleting user:",
        error.response ? error.response.data : error.message
      );
      message.error("Failed to delete user!");
    } finally {
      setIsLoading(false); // End loading
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const columns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button type="link" onClick={() => handleOpenModal(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => confirmDeleteUser(record.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div>
      <h1>Users</h1>
      <Spin spinning={isLoading}>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          style={{ marginTop: 16 }}
          pagination={{ pageSize: 5 }}
        />
      </Spin>
      <Modal
        title={isEditMode ? "Edit User" : "Add User"}
        visible={isModalOpen}
        onOk={handleCreateOrUpdateUser}
        onCancel={handleCloseModal}
        okText={isEditMode ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nom"
            name="nom"
            rules={[{ required: true, message: "Please enter the user name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter the user email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Mot de Passe"
            name="motDePasse"
            rules={[{ required: true, message: "Please enter the password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="Role" name="role" initialValue="Client">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Confirm Delete"
        visible={isDeleteModalOpen}
        onOk={handleDeleteUser}
        onCancel={handleCancelDelete}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete this user?</p>
      </Modal>
    </div>
  );
};
export default Users;
