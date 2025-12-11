// src/routes/authRoutes.ts
import { Router } from 'express';
import express from "express";
import { login, logout , refreshToken } from '../controllers/authController.ts';
import { authenticate } from "../middleware/authMiddleware.ts";
import { createItem  , getAllItems , deleteItem , updateItem} from '../controllers/itemController.ts';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { stripeWebhook } from "../controllers/ordersController.ts";



const router = Router();

// Configure multer to save files to 'uploads' folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // ✅ make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });


//create order with wbhook
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

//login
router.post('/login', login);
router.post('/logout', logout,authenticate); 
router.post('/refresh', refreshToken);

//items
router.post('/items', authenticate, upload.array('image', 10), createItem);
router.put('/items/:id', authenticate, upload.array('image', 10), updateItem);
router.delete('/items/:id', authenticate, deleteItem);
router.get('/items' ,getAllItems);

export default router;
