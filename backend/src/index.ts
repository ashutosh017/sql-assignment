import express from "express";
import "dotenv/config";
import pg from "pg";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import axios from "axios";

const app = express();
const port = 3000;
const { Client } = pg;
const pg_string = `postgres://postgres:postgres@localhost:5432/sql-assignment`;
const client = new Client(pg_string);
const jwt_secret = process.env.JWT_SECRET ?? "jwt_secret";
const weatherApiAccessKey = process.env.ACCESS_KEY;
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

async function createUsersTable() {
  const query = `CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(256),
        username VARCHAR(256) UNIQUE NOT NULL,
        password VARCHAR(256) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
  try {
    await client.query(query);
  } catch (error) {
    console.log("error creating table: ", error);
  }
}
async function createSearchHistoryTable() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS search_history(
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            city VARCHAR(256) NOT NULL,
            search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            weather_result JSONB NOT NULL
        )`;
    await client.query(query);
  } catch (error) {
    console.log("error creating search history table: ", error);
  }
}

async function main() {
  await client.connect();
  await createUsersTable();
  await createSearchHistoryTable();
}
main();

app.get("/", (req, res) => {
  res.json({ msg: "yup" });
});
app.post("/api/v1/signup", async (req, res) => {
  const { name, username, password } = req.body;
  if (!username || !password) {
    res.status(404).json({
      msg: "username or password is empty",
    });
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
        INSERT INTO USERS(name, username, password)
        VALUES ($1, $2, $3)
        RETURNING id, username, created_at
    `;
    const values = [name, username, hashedPassword];
    const result = await client.query(query, values);
    res.status(200).json({
      msg: "user created successfully",
      user: result.rows[0],
    });
  } catch (err) {
    res.status(404).json({
      msg: "user already exists might be",
    });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new Error("username or password cannot be empty");
    }
    const query = `SELECT id, password FROM users WHERE username = $1`;
    const result = await client.query(query, [username]);
    if (result.rows.length === 0) {
      res.status(401).json({
        msg: "Invalid username or password",
      });
      return;
    }
    const isValid = await bcrypt.compare(password, result.rows[0].password);
    if (!isValid) {
      res.status(401).json({
        msg: "Invalid username or password",
      });
      return;
    }
    const token = jwt.sign(username, jwt_secret);
    res.status(200).json({
      msg: "signin successful",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

app.get(`/api/v1/getweatherdetails`, async (req, res) => {
  try {
    const { city, username } = req.query;
    if(!city || !username){
        res.status(400).json({
            msg:"city and username are required"
        })
        return;
    }
    const userQuery = `SELECT id FROM users WHERE username=$1 `
    const user = await client.query(userQuery,[username]);
    if(user.rows.length===0){
        throw new Error("no user found");
    }
    const userId = user.rows[0].id;
    const resp = await axios.get(
      `http://api.weatherstack.com/current?access_key=${weatherApiAccessKey}&query=${city}`
    );
    const weatherData = resp.data;
    const query = `
    INSERT INTO search_history(user_id, city, weather_result)
    VALUES($1, $2, $3)
    `

    await client.query(query,[userId, city, weatherData])
    res.status(200).json({
        msg:"weather details fetched successfully",
      data: weatherData,
    });
  } catch (error) {
    res.status(404).json({
      msg: "some error occured",
      error,
    });
  }
});

app.get("/api/v1/validate-token", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1]; 
  
      if (!token) {
         res.status(401).json({ msg: "No token provided" });
         return;
      }
  
      const decoded = jwt.verify(token, jwt_secret);
      res.status(200).json({ msg: "Token is valid", decoded });
    } catch (error) {
      res.status(401).json({ msg: "Invalid token", error});
    }
  });

  app.get("/api/v1/get-users-search-history", async (req, res) => {
    try {
      const historyQuery = `
        SELECT 
  u.username, 
  sh.city, 
  sh.weather_result AS result, 
  sh.search_time AS searched_at
FROM 
  search_history sh
INNER JOIN 
  users u 
ON 
  sh.user_id = u.id
ORDER BY 
  sh.search_time DESC

      `;
  
      const historyResult = await client.query(historyQuery);
  
      res.status(200).json({ history: historyResult.rows });
    } catch (error) {
      console.error("Error fetching search history for all users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
app.listen(port, () => {
  console.log(`app is listening on port ${port}`);
});

