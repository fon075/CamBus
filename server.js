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

const dbInit = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
});

dbInit.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    process.exit(1);
  }

  dbInit.query("CREATE DATABASE IF NOT EXISTS cambus", (err) => {
    if (err) {
      console.error("Error creating database:", err.message);
      process.exit(1);
    }
    console.log("Database 'cambus' ready");
    dbInit.end();
  });
});

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cambus",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to cambus database");

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(13) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createUsersTable, (err) => {
    if (err) console.error("Error creating users table:", err.message);
  });

  const createBusesTable = `
    CREATE TABLE IF NOT EXISTS buses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      operator VARCHAR(255) NOT NULL,
      operator_short VARCHAR(10) NOT NULL,
      operator_color VARCHAR(20) NOT NULL,
      operator_text_color VARCHAR(20) NOT NULL,
      bus_type VARCHAR(100) NOT NULL,
      bus_category VARCHAR(50) NOT NULL,
      from_location VARCHAR(100) NOT NULL,
      to_location VARCHAR(100) NOT NULL,
      departure_time VARCHAR(10) NOT NULL,
      arrival_time VARCHAR(10) NOT NULL,
      duration VARCHAR(20) NOT NULL,
      duration_minutes INT NOT NULL,
      stops INT DEFAULT 0,
      stop_details VARCHAR(255),
      price INT NOT NULL,
      original_price INT,
      seats_available INT NOT NULL,
      amenities TEXT,
      departure_time_category VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createBusesTable, (err) => {
    if (err) console.error("Error creating buses table:", err.message);
  });

  const createOperatorsTable = `
    CREATE TABLE IF NOT EXISTS operators (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createOperatorsTable, (err) => {
    if (err) console.error("Error creating operators table:", err.message);
  });

  const createSupportTable = `
    CREATE TABLE IF NOT EXISTS customer_support (
      id INT AUTO_INCREMENT PRIMARY KEY,
      operator_id INT,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE
    )
  `;

  db.query(createSupportTable, (err) => {
    if (err) console.error("Error creating support table:", err.message);
  });

  const createFeedbackTable = `
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(createFeedbackTable, (err) => {
    if (err) console.error("Error creating feedback table:", err.message);
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/operator", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "operator.html"));
});

app.post("/signup", (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!phone.startsWith('+2376') || phone.length !== 13) {
    return res.status(400).json({
      error: "Phone number must start with +2376 and be exactly 13 characters"
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const checkEmail = "SELECT id FROM users WHERE email = ?";
  db.query(checkEmail, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const insert = "INSERT INTO users (name, phone, email, password) VALUES (?,?,?,?)";
    db.query(insert, [name, phone, email, password], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error creating account" });
      }
      res.json({ redirect: "/user-dashboard.html", name, email });
    });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.length > 0) {
      if (password === result[0].password) {
        return res.json({
          redirect: "/user-dashboard.html",
          name: result[0].name,
          email: result[0].email,
        });
      } else {
        return res.status(401).json({ error: "Invalid email or password" });
      }
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  });
});

app.post("/operator-signup", (req, res) => {
  const { company_name, email, phone, password } = req.body;

  if (!company_name || !email || !phone || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const checkOp = "SELECT id FROM operators WHERE email = ?";
  db.query(checkOp, [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length > 0) return res.status(400).json({ error: "Email already registered" });

    const insert = "INSERT INTO operators (company_name, email, phone, password) VALUES (?,?,?,?)";
    db.query(insert, [company_name, email, phone, password], (err, result) => {
      if (err) return res.status(500).json({ error: "Error creating operator account" });
      res.json({ success: true, name: company_name, email });
    });
  });
});

app.post("/operator-login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  db.query("SELECT * FROM operators WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0 && results[0].password === password) {
      res.json({
        success: true,
        name: results[0].company_name,
        email: results[0].email,
        id: results[0].id
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

app.post("/api/buses", (req, res) => {
  const {
    operator,
    from_location,
    to_location,
    departure_time,
    duration,
    price,
    bus_type
  } = req.body;

  if (!operator || !from_location || !to_location || !departure_time || !duration || !price) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const operator_short = operator.substring(0, 3).toUpperCase();
  const operator_color = "#" + Math.floor(Math.random() * 16777215).toString(16);
  const operator_text_color = "#ffffff";
  const bus_category = bus_type || "Classic";

  let duration_minutes = 0;
  const hoursMatch = duration.match(/(\d+)h/);
  const minsMatch = duration.match(/(\d+)m/);
  if (hoursMatch) duration_minutes += parseInt(hoursMatch[1]) * 60;
  if (minsMatch) duration_minutes += parseInt(minsMatch[1]);
  if (duration_minutes === 0) duration_minutes = 60;

  const [depHours, depMins] = departure_time.split(':').map(Number);
  const totalDepMins = depHours * 60 + depMins;
  const totalArrMins = (totalDepMins + duration_minutes) % (24 * 60);
  const arrHours = Math.floor(totalArrMins / 60);
  const arrMinutes = totalArrMins % 60;
  const arrival_time = `${arrHours.toString().padStart(2, '0')}:${arrMinutes.toString().padStart(2, '0')}`;

  let departure_time_category = 'Morning';
  if (depHours >= 0 && depHours < 6) departure_time_category = 'Night';
  else if (depHours >= 6 && depHours < 12) departure_time_category = 'Morning';
  else if (depHours >= 12 && depHours < 18) departure_time_category = 'Afternoon';
  else departure_time_category = 'Evening';

  const seats_available = 45;
  const stops = 0;
  const stop_details = "";
  const amenities = "AC, WiFi, USB";

  const insertQuery = `
    INSERT INTO buses (
      operator, operator_short, operator_color, operator_text_color,
      bus_type, bus_category, from_location, to_location,
      departure_time, arrival_time, duration, duration_minutes,
      stops, stop_details, price, original_price,
      seats_available, amenities, departure_time_category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    operator, operator_short, operator_color, operator_text_color,
    bus_type, bus_category, from_location, to_location,
    departure_time, arrival_time, duration, duration_minutes,
    stops, stop_details, price, price,
    seats_available, amenities, departure_time_category
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error("Error inserting bus:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    res.json({ success: true, id: result.insertId });
  });
});

app.get("/api/buses", (req, res) => {
  try {
    let query = "SELECT * FROM buses WHERE 1=1";
    const params = [];

    if (req.query.from) {
      query += " AND from_location = ?";
      params.push(req.query.from);
    }

    if (req.query.to) {
      query += " AND to_location = ?";
      params.push(req.query.to);
    }

    if (req.query.departureTime) {
      const timeCats = Array.isArray(req.query.departureTime)
        ? req.query.departureTime
        : [req.query.departureTime];
      query += " AND departure_time_category IN (" + timeCats.map(() => '?').join(',') + ")";
      params.push(...timeCats);
    }

    if (req.query.busType) {
      const types = Array.isArray(req.query.busType)
        ? req.query.busType
        : [req.query.busType];
      query += " AND bus_category IN (" + types.map(() => '?').join(',') + ")";
      params.push(...types);
    }

    if (req.query.minPrice) {
      query += " AND price >= ?";
      params.push(parseInt(req.query.minPrice));
    }

    if (req.query.maxPrice) {
      query += " AND price <= ?";
      params.push(parseInt(req.query.maxPrice));
    }

    if (req.query.operators) {
      const operators = Array.isArray(req.query.operators)
        ? req.query.operators
        : [req.query.operators];
      query += " AND operator IN (" + operators.map(() => '?').join(',') + ")";
      params.push(...operators);
    }

    if (req.query.operatorSearch) {
      query += " AND operator LIKE ?";
      params.push(`%${req.query.operatorSearch}%`);
    }

    const sortBy = req.query.sortBy || "cheapest";
    switch (sortBy) {
      case "cheapest":
        query += " ORDER BY price ASC";
        break;
      case "fastest":
        query += " ORDER BY duration_minutes ASC";
        break;
      case "early":
        query += " ORDER BY departure_time ASC";
        break;
      case "late":
        query += " ORDER BY departure_time DESC";
        break;
    }

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ success: false, error: "Error searching for buses" });
      }

      const buses = results.map(bus => ({
        id: bus.id,
        operator: bus.operator,
        operatorShort: bus.operator_short,
        operatorColor: bus.operator_color,
        operatorTextColor: bus.operator_text_color,
        busType: bus.bus_type,
        busCategory: bus.bus_category,
        from: bus.from_location,
        to: bus.to_location,
        departureTime: bus.departure_time,
        arrivalTime: bus.arrival_time,
        duration: bus.duration,
        durationMinutes: bus.duration_minutes,
        stops: bus.stops,
        stopDetails: bus.stop_details,
        price: bus.price,
        originalPrice: bus.original_price,
        seatsAvailable: bus.seats_available,
        amenities: bus.amenities ? bus.amenities.split(',') : [],
        departureTimeCategory: bus.departure_time_category
      }));

      res.json({ success: true, count: buses.length, buses: buses });
    });

  } catch (error) {
    console.error("Bus search error:", error);
    res.status(500).json({ success: false, error: "Error searching for buses" });
  }
});

app.post("/api/feedback", (req, res) => {
  const { user_email, type, subject, message } = req.body;

  if (!user_email || !type || !subject || !message) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  const insertQuery = "INSERT INTO feedback (user_email, type, subject, message) VALUES (?, ?, ?, ?)";
  db.query(insertQuery, [user_email, type, subject, message], (err, result) => {
    if (err) {
      console.error("Error submitting feedback:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    res.json({ success: true, message: "Feedback submitted successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
