// controllers/itemController.ts
import type { Request, Response } from 'express';
import { pool } from '../config/db.ts';
import path from 'path';
import fs from 'fs';

export const createItem = async (req: Request, res: Response) => {
  console.log("createItem Handshake!");
  try {
    // ✅ Extract all fields from request body including description
    const { name, size, material, producer, price, category, status, description } = req.body;
    const imageFiles = req.files as Express.Multer.File[]; // now supports multiple files

    // ✅ Validate required fields - description is optional so not included here
    if (!name || !size || !price || !category)
      return res.status(400).json({ message: 'Missing required fields' });

    // ✅ Convert all uploaded files to an array of relative paths
    const imagePaths = imageFiles && imageFiles.length > 0
      ? imageFiles.map(file => `/uploads/${path.basename(file.path)}`)
      : [];

    // ✅ Update query to include description field (as optional parameter)
    const query = `
      INSERT INTO items (name, size, material, producer, price, category, status, image, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING *;
    `;

    const values = [
      name,
      size,
      material,
      producer,
      price,
      category,
      status || 'available',
      JSON.stringify(imagePaths),
      description || null  // ✅ Store description, default to null if not provided
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: 'Item created successfully',
      item: result.rows[0],
    });

  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Error creating item' });
  }
};

export const getAllItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query("SELECT * FROM items ORDER BY created_at ASC");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Error fetching items" });
  }
};

/**
 * Update an existing item
 */
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // ✅ Extract description from request body along with other fields
    const { name, size, material, producer, price, category, status, deletedImages, description } = req.body;
    const imageFiles = req.files as Express.Multer.File[];

    // Check if item exists
    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    console.log(deletedImages);
    
    // Handle image update: add new ones to JSON array
    let imageArray = existing.rows[0].image || [];

    // 3️⃣ Remove deleted images if provided
    if (deletedImages) {
      const toDelete: string[] = JSON.parse(deletedImages);

      // Ensure imageArray is treated as string[]
      const existingImages: string[] = Array.isArray(imageArray) ? imageArray : [];

      // Filter out deleted images
      imageArray = existingImages.filter((img: string) => !toDelete.includes(img));

      // Delete files from uploads folder
      for (const imgPath of toDelete) {
        const fullPath = path.join(process.cwd(), 'src', imgPath);
        fs.unlink(fullPath, (err) => {
          if (err) console.warn(`Failed to delete image file: ${fullPath}`, err.message);
        });
      }
    }

    // ✅ Add new images to the array
    if (imageFiles && imageFiles.length > 0) {
      const newImagePaths = imageFiles.map(file => `/uploads/${path.basename(file.path)}`);
      imageArray = [...imageArray, ...newImagePaths];
    }

    // ✅ Dynamically update only provided fields - including description
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (size) { fields.push(`size = $${idx++}`); values.push(size); }
    if (material) { fields.push(`material = $${idx++}`); values.push(material); }
    if (producer) { fields.push(`producer = $${idx++}`); values.push(producer); }
    if (price) { fields.push(`price = $${idx++}`); values.push(price); }
    if (category) { fields.push(`category = $${idx++}`); values.push(category); }
    if (status) { fields.push(`status = $${idx++}`); values.push(status); }
    
    // ✅ Handle description update (can be empty string to clear description)
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description || null); // Store null if empty string
    }
    
    // ✅ Always update image array
    fields.push(`image = $${idx++}::jsonb`); 
    values.push(JSON.stringify(imageArray)); 
    

    values.push(id);
    const query = `UPDATE items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    const result = await pool.query(query, values);

    res.status(200).json({
      message: 'Item updated successfully',
      item: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Error updating item' });
  }
};

/**
 * Delete an item
 */
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if item exists
    const existing = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'Item not found' });
      return;
    }

    // Delete all associated image files
    const imageArray = existing.rows[0].image || [];
    if (Array.isArray(imageArray)) {
      for (const relPath of imageArray) {
        const fullPath = path.join(process.cwd(), 'src', relPath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    }

    await pool.query('DELETE FROM items WHERE id = $1', [id]);

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Error deleting item' });
  }
};