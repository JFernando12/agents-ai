import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      throw new Error("No token provided");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    if (!decoded.email || !decoded.id) {
      throw new Error("Invalid token payload");
    }

    const userData = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    return NextResponse.json({
      success: true,
      user: userData,
      message: "Token verified successfully",
    });
  } catch (err) {
    console.error("Error in JWT verification:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
