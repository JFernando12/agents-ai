import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Generates a dev JWT for the frontend until a real login is implemented.
// The token is signed server-side so JWT_SECRET never reaches the client.
export async function POST() {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: "JWT_SECRET is not configured" },
        { status: 500 }
      );
    }

    const devUser = {
      id: "dev-user-001",
      email: "fernandocastrejonh@gmail.com",
      name: "Fernando Castrejon",
      role: "admin" as const,
    };

    const token = jwt.sign(devUser, jwtSecret, { expiresIn: "7d" });

    return NextResponse.json({
      success: true,
      token,
      user: devUser,
    });
  } catch (err) {
    console.error("Error generating token:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
