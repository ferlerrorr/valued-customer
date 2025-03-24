import { NextApiRequest, NextApiResponse } from "next";
import mysql, {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

// Define database connection
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to generate a new VCustID
function generateNewVCustID(lastVCustID: string): string {
  let nextID = "9000-000001"; // Default ID
  if (lastVCustID) {
    const numericID = lastVCustID.replace("-", ""); // Remove dash
    const incrementedID = (parseInt(numericID, 10) + 1)
      .toString()
      .padStart(10, "0");
    nextID = `${incrementedID.slice(0, 4)}-${incrementedID.slice(4)}`; // Reinsert dash
  }
  return nextID;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { name, motherCode, group } = req.body;

    if (!name || !motherCode || !group) {
      return res.status(400).json({ error: "All fields are required." });
    }

    let connection: PoolConnection | null = null;
    try {
      connection = await pool.getConnection();

      // Fetch the last VCustID from the database to generate the next one
      const [lastRow] = await connection.query<RowDataPacket[]>(
        `SELECT VCustID FROM valuedcustomer ORDER BY VCustID DESC LIMIT 1`
      );
      const lastVCustID =
        lastRow.length > 0 ? lastRow[0].VCustID : "9000-000000";

      // Generate new VCustID for the new customer
      const newVCustID = generateNewVCustID(lastVCustID);

      // Prepare the data for insertion
      const values = [
        newVCustID,
        name,
        motherCode ? motherCode.toString() : null,
        group,
      ];

      // Insert the new customer into the database
      const insertQuery = `
        INSERT INTO valuedcustomer (VCustID, VCustName, MotherCode, VGroup)
        VALUES (?, ?, ?, ?)
      `;
      const [insertResult] = await connection.query<ResultSetHeader>(
        insertQuery,
        values
      );

      if (insertResult.affectedRows > 0) {
        // Now select the inserted data by VCustID
        const [customerData] = await connection.query<RowDataPacket[]>(
          `SELECT VCustID, VCustName, MotherCode, VGroup, Active FROM valuedcustomer WHERE VCustID = ?`,
          [newVCustID]
        );

        // Return the customer data
        res.status(200).json({
          message: "Customer registered successfully",
          data: {
            VCustID: customerData[0].VCustID,
            name: customerData[0].VCustName,
            active: customerData[0].Active,
            motherCode: customerData[0].MotherCode,
            group: customerData[0].VGroup,
          },
        });
      } else {
        res.status(500).json({ error: "Failed to register the customer." });
      }
    } catch (error) {
      res.status(500).json({
        error: "An error occurred while processing the request.",
        details: (error as Error).message,
      });
    } finally {
      if (connection) connection.release();
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
