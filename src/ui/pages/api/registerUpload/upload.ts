import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { IncomingMessage } from "http";
import readline from "readline";

export const config = {
  api: {
    bodyParser: false,
  },
};

const REQUIRED_HEADERS = ["Customer Name", "Mother Code", "Group"];

async function extractCSVContent(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const rawData = Buffer.concat(chunks).toString("utf-8");

      // Ensure the request contains valid CSV content
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

// Custom function to correctly split CSV lines
function parseCSVLine(line: string): string[] {
  const regex = /(?:\"([^\"]*)\")|([^\",]+)/g;
  const result: string[] = [];
  let match;

  while ((match = regex.exec(line)) !== null) {
    result.push(match[1] !== undefined ? match[1] : match[2]);
  }

  return result.map((cell) => cell.trim());
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract CSV content
    const csvContent = await extractCSVContent(req);
    const tempFilePath = path.join("/tmp", `upload-${Date.now()}.csv`);
    fs.writeFileSync(tempFilePath, csvContent);

    // Read CSV file and process line by line
    const fileStream = fs.createReadStream(tempFilePath);
    const rl = readline.createInterface({ input: fileStream });

    const rows: string[][] = [];
    for await (const line of rl) {
      rows.push(parseCSVLine(line)); // Use the improved CSV parsing function
    }

    // Extract and validate headers
    const headers = rows.shift() ?? [];
    if (JSON.stringify(headers) !== JSON.stringify(REQUIRED_HEADERS)) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: "Invalid CSV format" });
    }

    // Convert CSV to JSON
    const jsonData = rows.map((row) =>
      REQUIRED_HEADERS.reduce(
        (acc, key, i) => ({ ...acc, [key]: row[i] ?? "" }),
        {}
      )
    );

    // Cleanup: Remove the temporary file
    fs.unlinkSync(tempFilePath);
    res.status(200).json({ data: jsonData });
  } catch (error) {
    res.status(400).json({
      error: "Only CSV files are allowed",
      details: (error as Error).message,
    });
  }
}
