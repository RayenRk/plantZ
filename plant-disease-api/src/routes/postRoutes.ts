import { Router } from "express";
import PostController from "../controllers/PostController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", PostController.getAllPosts);
router.get("/:id", PostController.getPostById);
router.post("/", PostController.createPost);
router.patch("/:id", PostController.patchPost);
router.put("/:id", PostController.updatePost);
router.delete("/:id", PostController.deletePost);
//router.post('/upload', uploadFile, PostController.uploadPicture);

export default router;

