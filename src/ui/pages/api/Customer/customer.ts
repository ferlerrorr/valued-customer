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
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();
    const { vcustIds } = req.body;

    if (!vcustIds || !Array.isArray(vcustIds) || vcustIds.length === 0) {
      return res.status(400).json({ error: "VCustIDs array is required" });
    }

    const query = `
      SELECT VCustID, VCustName, MotherCode, Active, Vgroup, created_at
      FROM valuedcustomer
      WHERE VCustID IN (?)`;

    const [customers] = await connection.query<RowDataPacket[]>(query, [
      vcustIds,
    ]);

    if (customers.length === 0) {
      return res
        .status(404)
        .json({ error: "No customers found for the provided VCustIDs" });
    }

    const vcustMap = new Map(
      customers.map((customer) => [customer.VCustID, customer.VCustName])
    );

    customers.forEach((customer) => {
      if (customer.MotherCode && vcustMap.has(customer.MotherCode)) {
        customer.CompanyName = vcustMap.get(customer.MotherCode) || "";
      } else {
        customer.CompanyName = "";
      }
    });

    const headers = "CompanyName,BPName,MotherCode,Status,Group,DateEnrolled\n";
    const csvData = customers
      .map((customer) => {
        const formattedDate = new Date(customer.created_at)
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "");

        const status = customer.Active === 1 ? "ACTIVE" : "INACTIVE";

        return (
          `"${customer.CompanyName.replace(/"/g, '""')}",` +
          `"${customer.VCustName.replace(/"/g, '""')}",` +
          `${customer.MotherCode},${status},${customer.Vgroup},${formattedDate}`
        );
      })
      .join("\r\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ValuedCustomer.csv"
    );
    res.status(200).send(headers + csvData);
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching data.",
      details: (error as Error).message,
    });
  } finally {
    if (connection) connection.release();
  }
}
