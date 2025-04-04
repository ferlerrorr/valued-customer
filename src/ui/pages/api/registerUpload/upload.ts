import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { IncomingMessage } from "http";
import readline from "readline";
import mysql, {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

export const config = {
  api: {
    bodyParser: false,
  },
};

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const REQUIRED_HEADERS = ["Customer Name", "Mother Code", "Group"];

async function extractCSVContent(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const rawData = Buffer.concat(chunks).toString("utf-8");
      const matches = rawData.match(
        /(?:\r\n|\n){2}([\s\S]+?)(?:\r\n|\n)------WebKitFormBoundary/
      );
      if (!matches || !matches[1].includes(",")) {
        return reject(new Error("Only CSV files are allowed"));
      }
      resolve(matches[1].trim());
    });
    req.on("error", reject);
  });
}

function parseCSVLine(line: string): string[] {
  const regex = /(?:\"([^\"]*)\")|([^\",]+)/g;
  const result: string[] = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    result.push(match[1] !== undefined ? match[1] : match[2]);
  }
  return result.map((cell) => cell.trim());
}

function generateNewVCustID(lastVCustID: string): string {
  let nextID = "9000-000001";
  if (lastVCustID) {
    const numericID = lastVCustID.replace("-", "");
    const incrementedID = (parseInt(numericID, 10) + 1)
      .toString()
      .padStart(10, "0");
    nextID = `${incrementedID.slice(0, 4)}-${incrementedID.slice(4)}`;
  }
  return nextID;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  let connection: PoolConnection | null = null;
  try {
    const extractedCSVContent = await extractCSVContent(req);
    const tempFilePath = path.join("/tmp", `upload-${Date.now()}.csv`);
    fs.writeFileSync(tempFilePath, extractedCSVContent);
    const fileStream = fs.createReadStream(tempFilePath);
    const rl = readline.createInterface({ input: fileStream });

    const rows: string[][] = [];
    for await (const line of rl) {
      rows.push(parseCSVLine(line));
    }
    const headers = rows.shift() ?? [];
    if (JSON.stringify(headers) !== JSON.stringify(REQUIRED_HEADERS)) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: "Invalid CSV format" });
    }

    const jsonData = rows.map((row) =>
      REQUIRED_HEADERS.reduce(
        (acc, key, i) => ({ ...acc, [key]: row[i] ?? "" }),
        {} as Record<string, string | null>
      )
    );

    connection = await pool.getConnection();
    const [lastRow] = await connection.query<RowDataPacket[]>(
      `SELECT VCustID FROM valuedcustomer ORDER BY VCustID DESC LIMIT 1`
    );

    let lastVCustID = lastRow.length > 0 ? lastRow[0].VCustID : "9000-000000";
    const values: (string | null)[][] = jsonData
      .filter(({ "Customer Name": name }) => name?.trim())
      .map(({ "Customer Name": name, "Mother Code": mother, Group }) => {
        const newVCustID = generateNewVCustID(lastVCustID);
        lastVCustID = newVCustID;
        return [newVCustID, name, mother ? mother.toString() : null, Group];
      });

    const insertQuery = `INSERT INTO valuedcustomer (VCustID, VCustName, MotherCode, VGroup) VALUES ?`;
    await connection.query<ResultSetHeader>(insertQuery, [values]);
    fs.unlinkSync(tempFilePath);

    const insertedVCustIDs = values.map((v) => v[0]);
    const [fetchedRows] = await connection.query<RowDataPacket[]>(
      `SELECT VCustID AS CustID, VCustName, Active, MotherCode, VGroup FROM valuedcustomer WHERE VCustID IN (?)`,
      [insertedVCustIDs]
    );

    const headersCSV = [
      "Customer ID",
      "Customer Name",
      "isActive",
      "Mother Code",
      "Group",
    ];
    const csvRows = fetchedRows.map(
      (customer) =>
        `"${customer.CustID}","${customer.VCustName.replace(/"/g, '""')}","${
          customer.Active
        }","${customer.MotherCode}","${customer.VGroup}"`
    );
    const csvContent = [headersCSV.join(","), ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(400).json({
      error: "An error occurred while processing the CSV file",
      details: (error as Error).message,
    });
  } finally {
    if (connection) connection.release();
  }
}
