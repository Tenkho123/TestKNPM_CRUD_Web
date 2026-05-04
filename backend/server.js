// web server framework
import express from "express";
// Cross-Origin Resource Sharing
import cors from "cors";
// Environment variables
import dotenv from "dotenv";
// PostgreSQL client
import pg from "pg";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors({
    origin: "https://tenkho123.github.io/KNPM_Group11/"
}));
app.use(express.json());

// Set up the Neon Database connection
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true // Neon requires SSL connections
});

// READ - Get all posts
app.get("/posts", async (req, res) => {
    try {
        // SELECT everything from the posts table, ordered by ID
        const result = await pool.query("SELECT * FROM posts ORDER BY id ASC");
        res.json(result.rows); // result.rows contains your array of data
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// CREATE - Add a new post
app.post("/posts", async (req, res) => {
    try {
        const { title } = req.body;
        // $1 is a placeholder for the title to protect against SQL injection
        // RETURNING * sends back the newly created row (including its auto-generated ID)
        const result = await pool.query(
            "INSERT INTO posts (title) VALUES ($1) RETURNING *", 
            [title]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create post" });
    }
});

// UPDATE - Change a post's title
app.put("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        
        const result = await pool.query(
            "UPDATE posts SET title = $1 WHERE id = $2 RETURNING *",
            [title, id]
        );

        // If rowCount is 0, it means no post matched that ID
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update post" });
    }
});

// DELETE - Remove a post
app.delete("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM posts WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete post" });
    }
});

app.listen(PORT, () => {
    console.log("🚀 Server running on port", PORT);
});