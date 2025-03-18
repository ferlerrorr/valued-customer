import { NextApiRequest, NextApiResponse } from "next";
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

type Customer = {
  CustID: string;
  VCustName: string;
  Active: number;
  MotherCode: string;
  Vgroup: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { insertedVCustIDs } = req.body;

      if (!Array.isArray(insertedVCustIDs) || insertedVCustIDs.length === 0) {
        return res
          .status(400)
          .json({ error: "Invalid or empty insertedVCustIDs" });
      }

      const [rows] = await db.query(
        `
        SELECT 
          VCustID AS CustID,
          VCustName,
          Active,
          MotherCode,
          Vgroup
        FROM valuedcustomer
        WHERE VCustID IN (?)
        `,
        [insertedVCustIDs]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return res
          .status(404)
          .json({ message: "No data found for the provided IDs." });
      }

      const headers = [
        "Customer ID",
        "Customer Name",
        "isActive",
        "Customer ID",
        "Mother Code",
        "Group",
      ];
      const csvRows = (rows as Customer[]).map(
        (customer) =>
          `"${customer.CustID}"	"${customer.VCustName.replace(/"/g, '""')}"	"${
            customer.Active
          }"	"${customer.CustID}"	"${customer.MotherCode}"	"${customer.Vgroup}"`
      );
      const csvContent = [headers.join("\t"), ...csvRows].join("\n");

      res.status(200).json({
        message: "Export data fetched successfully",
        customers: rows,
        csvContent,
      });
    } catch (error) {
      console.error("Error fetching data from DB:", error);
      res.status(500).json({ error: "Failed to fetch export data." });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
