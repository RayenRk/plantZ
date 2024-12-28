import { CustomRequest } from "../middleware/authMiddleware";
import { Request, Response } from "express";
import prisma from "../utils/db";
import { convertImageToBase64 } from "../middleware/imageProcess";

class PostController {
  getAllPosts = async (req: Request, res: Response): Promise<void> => {
    try {
      const posts = await prisma.post.findMany({
        include: {
          plant: true, // Include related plant details if needed
          user: true, // Include user details if needed
        },
        orderBy: { date_creation: "desc" }, // Order by the most recent posts
      });
      // Convert images to Base64 for easier frontend display
      const postsWithBase64Photo = posts.map((post) => ({
        ...post,
        photo: post.photo
          ? convertImageToBase64(Buffer.from(post.photo))
          : null,
      }));
      res.json(postsWithBase64Photo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  };

  getPostById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const post = await prisma.post.findUnique({
        where: { id_post: Number(id) },
        include: {
          plant: true, // Include related plant details if needed
          user: true, // Include user details if needed
        },
      });
      if (post) {
        res.json(post);
      } else {
        res.status(404).json({ error: "Post not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  };

  createPost = async (req: CustomRequest, res: Response): Promise<void> => {
    const { titre, description, plantId } = req.body;
    const userId = req.user?.userId; // Access userId from the authenticated user

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }

    try {
      // Fetch plant details including its image
      const plant = await prisma.plant.findUnique({
        where: { id_plant: Number(plantId) },
        include: {
          versions: {
            orderBy: { date_created: "desc" }, // Get latest version if needed
            take: 1, // Limit to the most recent version
          },
        },
      });

      if (!plant) {
        res.status(404).json({ error: "Plant not found" });
        return;
      }

      // Retrieve the main plant image or the latest version image
      const plantImage =
        plant.plant_image ||
        (plant.versions.length > 0 ? plant.versions[0].updated_image : null);

      if (!plantImage) {
        res
          .status(400)
          .json({ error: "No image available for the plant or its versions" });
        return;
      }

      // Create a new post
      const newPost = await prisma.post.create({
        data: {
          titre,
          photo: plantImage,
          description,
          userId: Number(userId), // Use the userId from the authenticated user
          plantId: Number(plantId),
        },
      });

      res.status(201).json(newPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create post" });
    }
  };

  updatePost = async (req: CustomRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { titre, description, liked } = req.body;
    const userId = req.user?.userId; // Access userId from the authenticated user

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }

    try {
      const post = await prisma.post.findUnique({
        where: { id_post: Number(id) },
      });

      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      if (post.userId !== Number(userId)) {
        res
          .status(401)
          .json({ error: "Unauthorized: User cannot update post" });
        return;
      }

      const updatedPost = await prisma.post.update({
        where: { id_post: Number(id) },
        data: {
          titre,
          description,
          liked,
        },
      });

      res.json(updatedPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update post" });
    }
  };

  patchPost = async (req: CustomRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { liked } = req.body;
    const userId = req.user?.userId; // Access userId from the authenticated user

    if (!userId) {
      res.status(401).json({ error: "Unauthorized: User ID is required" });
      return;
    }

    try {
      const post = await prisma.post.findUnique({
        where: { id_post: Number(id) },
      });

      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      if (liked === undefined) {
        res.status(400).json({ error: "Liked status is required" });
        return;
      }

      const updatedPost = await prisma.post.update({
        where: { id_post: Number(id) },
        data: {
          liked,
        },
      });

      res.json(updatedPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update post" });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await prisma.post.delete({
        where: { id_post: Number(id) },
      });

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  };
}

export default new PostController();
