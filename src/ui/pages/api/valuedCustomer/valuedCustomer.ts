import { NextApiRequest, NextApiResponse } from "next";
import mysql from "mysql2/promise";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        "SELECT * FROM valuedcustomer WHERE Active = 1"
      );

      console.log(
        "Filtered MySQL Response (Active = 1):",
        JSON.stringify(rows, null, 2)
      );

      connection.release();
      res.status(200).json(rows);
    } catch (error) {
      console.error("Database connection or query failed:", error);
      res.status(500).json({
        error: "Database connection or query failed",
        details: (error as Error).message,
      });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
