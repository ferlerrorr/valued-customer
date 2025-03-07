import { NextApiRequest, NextApiResponse } from "next";
import mysql from "mysql2/promise";
import fs from "fs";
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

  try {
    const [rows] = await pool.execute(
      "SELECT VCustID, VCustName, Active, UpdateID, MotherCode FROM valuedcustomer ORDER BY Active DESC"
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    // Convert the data to JSON format
    const jsonData = JSON.stringify(rows, null, 2);

    // Define the file path to store the response
    const filePath = path.join(
      process.cwd(),
      "public/customerData",
      "customerData.json"
    );

    // Write the JSON data to a file in the public folder
    fs.writeFileSync(filePath, jsonData, "utf-8");

    // Return the data in the API response
    res.status(200).json(rows);
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({
      error: "Database query failed",
      details: (error as Error).message,
    });
  }
}
