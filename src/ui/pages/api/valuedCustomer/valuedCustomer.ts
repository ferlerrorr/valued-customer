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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT * FROM valuedcustomer ORDER BY Active DESC"
    );

    console.log("MySQL Response:", JSON.stringify(rows, null, 2));
    res.status(200).json(rows);
    localStorage.setItem("valuedCustomers", JSON.stringify(rows));
  } catch (error) {
    console.error("Database connection or query failed:", error);
    res.status(500).json({
      error: "Database connection or query failed",
      details: (error as Error).message,
    });
  } finally {
    if (connection) connection.release();
  }
}
