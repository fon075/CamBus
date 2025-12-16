import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const PORT = 3030;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cambus",
});

// Static routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// User registration
app.post("/signup", async (req, res) => {
  const { name, phone, email, password} = req.body;
  const insert = "INSERT INTO users (name, phone, email, password) VALUES (?,?,?,?)";
  db.query(insert, [name, phone, email, password], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error inserting into database");
    }
    res.json({ redirect: "/", name, email });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error, try again later");
    }
    if (result.length > 0) {
      if (password === result[0].password) {
        return res.json({
          redirect: "/",
          name: result[0].name,
          email: result[0].email,
        });
      } else {
        res.status(401).send("Invalid email or password");
      }
    } else {
      res.status(401).send("Invalid email or password");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server has started on http://localhost:${PORT}`);
});