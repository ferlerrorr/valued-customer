import { NextApiRequest, NextApiResponse } from "next";
import mysql, { PoolConnection, RowDataPacket } from "mysql2/promise";

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let connection: PoolConnection | null = null;

  try {
    console.log("Received request body:", req.body);

    connection = await pool.getConnection();
    console.log("Database connection established");

    const { VCustID, VCustName, status, MotherCode, Vgroup } = req.body;

    if (!VCustID || !VCustName) {
      return res
        .status(400)
        .json({ error: "Customer ID and Name are required." });
    }

    const activeStatus = status ? 1 : 0;

    const query = `
      UPDATE valuedcustomer
      SET VCustName = ?, Active = ?, MotherCode = ?, Vgroup = ?
      WHERE VCustID = ?`;

    // Explicitly typing the result as an array of RowDataPacket
    const [result] = await connection.execute<RowDataPacket[]>(query, [
      VCustName,
      activeStatus,
      MotherCode || null,
      Vgroup || null,
      VCustID,
    ]);

    console.log("Update result:", result);

    // Typing affectedRows as part of the RowDataPacket result
    if (result.length === 0 || result[0]?.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Customer not found or no changes made." });
    }

    // Fetch updated customer details
    const [updatedCustomer] = await connection.execute<RowDataPacket[]>(
      "SELECT * FROM valuedcustomer WHERE VCustID = ?",
      [VCustID]
    );

    console.log("Updated customer result:", updatedCustomer);

    if (!Array.isArray(updatedCustomer) || updatedCustomer.length === 0) {
      return res.status(404).json({ error: "Updated customer not found." });
    }

    return res.status(200).json({
      message: "Customer updated successfully.",
      updatedCustomer: updatedCustomer[0],
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({
      error: "An error occurred while updating the customer.",
      details: (error as Error).message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
