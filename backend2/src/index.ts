import express from "express";
import "dotenv/config";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import axios from "axios";
import { access_key, jwt_secret } from "./config";
import { db } from "./db";

const app = express();
const port = 3000;
const weatherApiAccessKey = access_key;
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

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
    const user = await db.user.create({
      data: {
        name: name ?? "",
        username,
        password: hashedPassword,
      },
    });
    console.log("user: ", user);
    res.status(200).json({
      msg: "user created successfully",
      user,
    });
  } catch (err) {
    res.status(404).json({
      msg: "user already exists might be",
      err,
    });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new Error("username or password cannot be empty");
    }
    const user = await db.user.findFirst({
      where: {
        username,
      },
    });
    if (!user) {
      throw new Error("user not found");
    }
    const pass = user.password;
    await bcrypt.compare(password, pass);
    const token = await jwt.sign(username, jwt_secret);
    res.status(200).json({
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
    if (typeof city !== "string" || typeof username !== "string") {
      throw new Error("username or city type is not string");
    }

    if (!city || !username) {
      throw new Error("city or username is empty");
    }

    const user = await db.user.findFirst({
      where: {
        username,
      },
    });

    if (!user) {
      throw new Error("no user found in db");
    }

    const weatherDetails = await axios.get(
      `http://api.weatherstack.com/current?access_key=${weatherApiAccessKey}&query=${city}`
    );
    console.log("weather details: ", weatherDetails.data);

    res.status(200).json({
      msg: "weather details fetched successfully",
      data: weatherDetails.data,
    });
  } catch (error) {
    res.json({
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
    res.status(401).json({ msg: "Invalid token", error });
  }
});

app.get("/api/v1/get-users-search-history", async (req, res) => {
  try {
    const { username } = req.query;
    if (typeof username !== "string") {
      throw new Error("username type is not string");
    }
    const user = await db.user.findFirst({
      where: {
        username,
      },
    });

    if (!user) {
      throw new Error("no user found in db");
    }

    const history = await db.searchHIstory.findMany({
      where: {
        user_id: user.id,
      },
    });

    res.status(200).json({
      history,
    });
  } catch (error) {
    res.json({ error });
  }
});

app.listen(port, () => {
  console.log(`app is listening on port ${port}`);
});
