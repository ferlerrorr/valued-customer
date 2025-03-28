"use client";

import { useState } from "react";

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

  const parseCSV = (csvText: string): CsvRow[] => {
    return csvText
      .split("\n")
      .filter(Boolean)
      .slice(1)
      .map((row) => {
        const columns =
          row
            .match(/"([^"]*)"|([^,]+)/g)
            ?.map((col) => col.replace(/"/g, "")) ?? [];
        return {
          VCustID: columns[0] ?? "",
          VCustName: columns[1] ?? "",
          Active: columns[2] ?? "",
          MotherCode: columns[3] ?? "",
          VGroup: columns[4] ?? "",
        };
      });
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

      setCsvData(parseCSV(result));

      const csvRows = result.split("\n").slice(1).join("\n");

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

    if (!formData.name || !formData.motherCode || !formData.group) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = "Submission failed. Please try again.";

        try {
          const errorResponse = await response.json();
          if (errorResponse?.error) {
            errorMessage = errorResponse.error;
          }
        } catch {
          console.error("API Error:", response.status, await response.text());
        }

        setErrorMessage(errorMessage);
        return;
      }

      const data = await response.json();

      if (data && data.data) {
        const { VCustID, name, active, motherCode, group } = data.data;

        const csvHeaders = [
          "Customer ID",
          "Customer Name",
          "Active",
          "Mother Code",
          "Group",
        ];

        const csvRows = [
          `"${VCustID}","${name}","${active}","${motherCode}","${group}"`,
        ];

        const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `MSSVAC${new Date()
          .toLocaleDateString("en-GB")
          .replace(/\//g, "")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
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
            <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
              {Object.keys(formData).map((key) => (
                <div key={key}>
                  <label className='block text-sm font-medium'>
                    {key
                      .replace(/^V?/, "")
                      .replace(/([A-Z])/g, " $1")
                      .trim()}
                  </label>
                  <input
                    type='text'
                    className='w-full p-2 border rounded-md'
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    required={key !== "MotherCode" && key !== "VGroup"}
                  />
                </div>
              ))}
              <button
                type='submit'
                className='w-full py-2 bg-blue-600 text-white rounded-md'
              >
                Submit
              </button>
              {/* Display error message only if it exists */}
              {errorMessage && (
                <p className='mt-2 text-sm text-red-600'>{errorMessage}</p>
              )}
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
