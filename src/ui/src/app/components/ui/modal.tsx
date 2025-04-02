"use client";

import { useState, useEffect } from "react";

type CsvRow = {
  VCustID: string;
  VCustName: string;
  Active: string;
  MotherCode: string;
  VGroup: string;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
};

type Customer = {
  VCustID: string;
  VCustName: string;
  Active: string;
  MotherCode: string;
  Vgroup: string;
};

export default function Modal({ open, onClose }: ModalProps) {
  const [activeTab, setActiveTab] = useState<"form" | "upload">("form");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    motherCode: "",
    group: "",
  });

  const [vGroups, setVGroups] = useState<string[]>([]);

  const isValidMotherCode = (code: string): boolean => {
    return /^\d+-\d+$/.test(code);
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch("/customerData/customerData.json");
        if (!response.ok) throw new Error("Failed to load customer data");

        const data: Customer[] = await response.json();
        const uniqueGroups = [
          ...new Set(data.map((customer) => customer.Vgroup).filter(Boolean)),
        ];

        setVGroups(uniqueGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, []);

  if (!open) return null;
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === "text/csv") {
      setFile(selectedFile);
      setErrorMessage("");
    } else {
      setFile(null);
      setErrorMessage("Please upload a valid CSV file.");
    }
  };

  const parseCSV = (csvText: string): CsvRow[] | null => {
    const rows = csvText.split("\n").filter(Boolean).slice(1);

    let hasError = false;
    const parsedData: CsvRow[] = rows.map((row) => {
      // Updated regex to handle commas inside quotes
      const columns =
        row
          .match(/"(.*?)"|([^",]+)/g)
          ?.map((col) => col.replace(/(^"|"$)/g, "").trim()) ?? [];

      while (columns.length < 5) {
        columns.push("");
      }

      const VCustID = columns[0] ?? "";
      const VCustName = columns[1] ?? "";
      const Active = columns[2] ?? "";
      let MotherCode = columns[3] === "" ? "" : columns[3];
      let VGroup = columns[4] ?? "";

      if (VGroup === "") {
        VGroup = MotherCode;
        MotherCode = "";
      }

      if (MotherCode !== "" && !MotherCode.includes("-")) {
        setErrorMessage("Invalid MotherCode. Must be in '123-456' format.");
        hasError = true;
      }

      return {
        VCustID,
        VCustName,
        Active,
        MotherCode,
        VGroup,
      };
    });

    if (hasError) {
      console.error("There were errors in parsing the CSV data.");
      return null;
    }

    console.log(parsedData);

    return parsedData;
  };

  const handleUpload = async () => {
    if (!file) return;

    setErrorMessage("");
    setLoading(true);
    setCsvData([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/registerUpload/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await res.text();

      if (!res.ok) throw new Error(result || "Unknown error occurred");

      const parsedData = parseCSV(result);

      if (!parsedData) {
        setLoading(false);
        return;
      }

      setCsvData(parsedData);

      const csvRows = parsedData
        .map((row) => {
          const columns = [
            row.VCustID,
            row.VCustName,
            row.Active,
            row.MotherCode,
            row.VGroup,
          ];

          const escapedColumns = columns.map((col) => {
            if (col == null) return "";

            let escapedCol = col.toString();

            if (escapedCol.includes('"')) {
              escapedCol = escapedCol.replace(/"/g, '""');
            }

            if (escapedCol.includes(",") || escapedCol.includes("\n")) {
              escapedCol = `"${escapedCol}"`;
            }
            return escapedCol;
          });

          return escapedColumns.join(",");
        })
        .join("\r\n");

      const fileName = `MSSVAC${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "")}.csv`;

      const blob = new Blob([csvRows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Request timed out (30s limit)"
          : error instanceof Error
          ? error.message
          : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name || !formData.group) {
      setErrorMessage("Name and Group are required.");
      return;
    }

    if (formData.motherCode && !isValidMotherCode(formData.motherCode)) {
      setErrorMessage("Invalid MotherCode. Must be in '123-456' format.");
      return;
    }

    try {
      const response = await fetch("/api/register/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = "Submission failed. Please try again.";

        try {
          const errorResponse = await response.clone().json();
          if (errorResponse?.error) {
            errorMessage = errorResponse.error;
          }
        } catch {
          console.error("API Error:", response.status);
        }

        setErrorMessage(errorMessage);
        return;
      }

      const data = await response.json();

      if (data && data.data) {
        const { VCustID, name, active, motherCode, group } = data.data;

        const csvRows = [
          `"${VCustID}","${name}","${active}","${motherCode}","${group}"`,
        ];

        const csvContent = csvRows.join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `MSSVAC${new Date()
          .toLocaleDateString("en-GB")
          .replace(/\//g, "")}.csv`;

        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL object
        window.URL.revokeObjectURL(url);

        setFormData({
          name: "",
          motherCode: "",
          group: "",
        });
      }
    } catch (error) {
      console.error("Unexpected Error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
      <div className='bg-white p-5 rounded-lg shadow-lg w-[30em] mb-[12em] mr-[1em]'>
        <div className='flex justify-between items-center border-b pb-2'>
          <h2 className='text-lg font-semibold'>Add New Customer</h2>
          <button onClick={onClose} className='text-gray-600 hover:text-black'>
            ✖
          </button>
        </div>

        <div className='mt-4'>
          {errorMessage && (
            <div className='mt-2 p-2 bg-red-100 text-red-700 border border-red-400 rounded'>
              {errorMessage}
            </div>
          )}
          <div className='flex border-b'>
            {["form", "upload"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 p-2 ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab(tab as "form" | "upload")}
              >
                {tab === "form" ? "Form Submit" : "File Upload"}
              </button>
            ))}
          </div>

          {activeTab === "form" ? (
            <form className='mt-4 space-y-4' onSubmit={handleSubmit}>
              <div>
                <label className='block text-sm font-medium'>
                  Customer Name
                </label>
                <input
                  type='text'
                  className='w-full p-2 border rounded-md'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium'>Mother Code</label>
                <input
                  type='text'
                  className='w-full p-2 border rounded-md'
                  value={formData.motherCode}
                  onChange={(e) =>
                    setFormData({ ...formData, motherCode: e.target.value })
                  }
                />
              </div>

              {/* Group Selection Dropdown */}
              <div>
                <label className='block text-sm font-medium'>Group</label>
                <select
                  className='w-full p-2 border rounded-md'
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({ ...formData, group: e.target.value })
                  }
                  required
                >
                  <option value=''>Select a Group</option>
                  {vGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type='submit'
                className='w-full py-2 bg-blue-600 text-white rounded-md'
              >
                Submit
              </button>
            </form>
          ) : (
            <div className='mt-4 space-y-4'>
              <input
                type='file'
                accept='.csv'
                className='w-full p-2 border rounded-md'
                onChange={handleFileChange}
              />
              <button
                className={`w-full py-2 rounded-md ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white"
                }`}
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
              {csvData.length > 0 && (
                <div className='mt-4 overflow-auto max-h-[10rem] border rounded-md p-2 bg-gray-100'>
                  <table className='w-full border-collapse border border-gray-300 text-sm'>
                    <thead>
                      <tr className='bg-gray-200'>
                        {[
                          "CustomerID",
                          "CustomerName",
                          "Status",
                          "MotherCode",
                          "Group",
                        ].map((col) => (
                          <th key={col} className='border p-1'>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.map((customer, index) => (
                        <tr key={index}>
                          {Object.values(customer).map((value, i) => (
                            <td key={i} className='border p-1'>
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
