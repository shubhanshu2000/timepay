import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { elasticClient } from "../config/elasticsearch";
import { LoginCredentials, RegisterUser } from "../types";
import { ensureUsersIndex } from "../services/authService";
import {
  createAuthenticationError,
  createValidationError,
} from "../types/errors";

export const register = async (
  req: Request<{}, {}, RegisterUser>,
  res: Response
) => {
  try {
    // Ensure users index exists
    await ensureUsersIndex();

    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await elasticClient.search({
      index: "users",
      body: {
        query: {
          term: {
            "email.keyword": email,
          },
        },
      },
    });

    if (userExists.hits.hits.length > 0) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await elasticClient.index({
      index: "users",
      body: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        createdAt: new Date(),
      },
      refresh: true,
    });

    // Generate token
    const token = jwt.sign(
      {
        id: result._id,
        email,
        role: "USER",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result._id,
          name,
          email,
          role: "USER",
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
};

export const login = async (
  req: Request<{}, {}, LoginCredentials>,
  res: Response
) => {
  try {
    // Ensure users index exists
    await ensureUsersIndex();

    const { email, password } = req.body;
    if (!email || !password) {
      throw createValidationError("Email and password are required");
    }

    // Find user
    const result = await elasticClient.search({
      index: "users",
      body: {
        query: {
          term: {
            "email.keyword": email,
          },
        },
      },
    });

    const user = result.hits.hits[0];

    if (!user) {
      throw createAuthenticationError("Invalid credentials");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(
      password,
      user._source.password
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user._id,
        email: user._source.email,
        role: user._source.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user._source.name,
          email: user._source.email,
          role: user._source.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
};
