require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Error: ", err);
    process.exit(1);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// Sample Route
app.get("/", (req, res) => {
  res.send("E-commerce API is running...");
});

// Sign-up Route (register a new user)
app.post("/api/signup", async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }
  // Hash the password before saving it
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const query = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;

  db.query(query, [username, email, hashedPassword, role], (err, result) => {
    if (err) {
      console.error("❌ Error inserting user: ", err);
      return res.status(500).json({ error: "Failed to register user" });
    }
    res.status(201).json({ message: "User registered successfully" });
  });
});

// Login Route (authenticate user and return JWT token)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("❌ Error fetching user: ", err);
      return res.status(500).json({ error: "Failed to login" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = results[0];

    // Compare provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", token });
  });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied, token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(400).json({ error: "Invalid token" });
  }
};

// Protect product creation route with JWT verification
app.post("/api/products", verifyToken, (req, res) => {
  const { name, description, category, price, start_date, expiry_date, free_delivery, image_url, old_price, new_price, vendor_id } = req.body;

  const query = `
    INSERT INTO products (name, description, category, price, start_date, expiry_date, free_delivery, image_url, old_price, new_price, vendor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [name, description, category, price, start_date, expiry_date, free_delivery, image_url, old_price, new_price, vendor_id], (err, result) => {
    if (err) {
      console.error("❌ Error inserting product: ", err);
      return res.status(500).json({ error: "Failed to add product" });
    }
    res.status(201).json({ message: "Product created successfully", productId: result.insertId });
  });
});

// Update product route
app.put('/api/products/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, start_date, expiry_date, free_delivery, image_url, old_price, new_price, vendor_id } = req.body;

  const query = `
    UPDATE products 
    SET name=?, description=?, category=?, price=?, start_date=?, expiry_date=?, free_delivery=?, image_url=?, old_price=?, new_price=?, vendor_id=? 
    WHERE id=?
  `;

  db.query(query, [name, description, category, price, start_date, expiry_date, free_delivery, image_url, old_price, new_price, vendor_id, id], 
  (err, result) => {
    if (err) {
      console.error("Error updating product:", err);
      return res.status(500).json({ error: "Failed to update product" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully" });
  });
});

// Get Products by Search Criteria
app.get("/api/products/search", (req, res) => {
  const { name, category, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;
  let query = "SELECT * FROM products WHERE 1=1";

  const params = [];

  if (name) {
    query += " AND name LIKE ?";
    params.push(`%${name}%`);
  }

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching products: ", err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
    res.status(200).json(results);
  });
});

// Get All Products
app.get("/api/products", (req, res) => {
    const query = "SELECT * FROM products";
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("❌ Error fetching products: ", err);
        return res.status(500).json({ error: "Failed to fetch products" });
      }
      res.status(200).json(results);
    });
  });
  
  // Get Product by ID
  app.get("/api/products/:id", (req, res) => {
    const { id } = req.params;
  
    const query = "SELECT * FROM products WHERE id = ?";
  
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("❌ Error fetching product: ", err);
        return res.status(500).json({ error: "Failed to fetch product" });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      res.status(200).json(results[0]);
    });
  });
  
  // Delete Product
  app.delete('/api/products/:id', verifyToken, (req, res) => {
    const { id } = req.params;
  
    const query = "DELETE FROM products WHERE id = ?";
  
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("❌ Error deleting product: ", err);
        return res.status(500).json({ error: "Failed to delete product" });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      res.status(200).json({ message: "Product deleted successfully" });
    });
  });
  
//node server.js
//npx nodemon server.js
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

