// pages/api/valuedCustomer/valuedCustomer.ts

import { NextApiRequest, NextApiResponse } from "next";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "10.60.15.119",
  user: "ferl",
  password: "Welcome#01",
  database: "ssdpos",
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

      // Fetch only rows where Active = 1
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
