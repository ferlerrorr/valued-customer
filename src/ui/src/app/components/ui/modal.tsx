"use client";

import { useState } from "react";

export default function Modal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  type CsvRow = {
    column1: string;
    column2: number;
    column3: string;
  };

  type Customer = {
    CustID: string;
    VCustName: string;
    Active: number;
    MotherCode: string;
    Vgroup: string;
  };

  const [activeTab, setActiveTab] = useState<"form" | "upload">("form");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [insertedVCustIDs, setInsertedVCustIDs] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    motherCode: "",
    group: "",
  });

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setErrorMessage("");
    setLoading(true);
    setCsvData([]);

    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch("/api/registerUpload/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let result;
      try {
        result = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(result?.error || "Unknown error occurred");
      }

      setCsvData(Array.isArray(result.data) ? result.data : []);
      setInsertedVCustIDs(
        Array.isArray(result.insertedVCustIDs) ? result.insertedVCustIDs : []
      );
    } catch (error) {
      setCsvData([]);

      const errorMessage =
        error instanceof DOMException && error.name === "AbortError"
          ? "Request timed out (30s limit)"
          : error instanceof Error
          ? error.message
          : "An unknown error occurred";
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!Array.isArray(insertedVCustIDs) || insertedVCustIDs.length === 0) {
      alert("No valid Customer IDs for export.");
      return;
    }

    try {
      const res = await fetch("/api/registerExport/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ insertedVCustIDs }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch export data:", errorText);
        throw new Error(`Failed to fetch export data: ${errorText}`);
      }

      const result = await res.json();
      const customers = result.customers;

      if (!customers || customers.length === 0) {
        alert("No data available for export.");
        return;
      }

      // CSV headers
      const headers = [
        "Customer ID",
        "Customer Name",
        "isActive",
        "Customer ID",
        "Mother Code",
        "Group",
      ];

      const rows = customers.map(
        (customer: Customer) =>
          `${customer.CustID},"${customer.VCustName}",${customer.Active},${customer.CustID},${customer.MotherCode},${customer.Vgroup}`
      );

      const csvContent = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "valued-customers.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Error:", error);
      alert("Failed to export data. Please try again.");
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    } else {
      console.error("Input field is missing a valid 'name' attribute.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.motherCode || !formData.group) {
      alert("All fields are required.");
      return;
    }

    // Submit the form data
    const response = await fetch("/api/register/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();

      // Assuming the API response contains the inserted customer data in the 'data' field
      if (data && data.data) {
        const { VCustID, name, active, motherCode, group } = data.data;

        // Now, you can create the CSV content from the response data
        const csvHeaders = [
          "VCustID",
          "Customer Name",
          "Mother Code",
          "isActive",
          "Group",
        ];
        const csvRows = [
          `"${VCustID}","${name}","${motherCode}","${active}","${group}"`,
        ];

        const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

        // Create a Blob from the CSV content
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        // Create a link to trigger the download
        const link = document.createElement("a");
        link.href = url;
        link.download = `customer-export.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke the URL to free up memory
        window.URL.revokeObjectURL(url);
      }
    } else {
      console.error("Failed to submit the form.");
    }
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-100'>
      <div className='bg-white p-6 rounded-lg shadow-lg w-96 mt-[8em]'>
        <div className='flex justify-between items-center border-b pb-2'>
          <h2 className='text-lg font-semibold'>Add New Customer</h2>
          <button onClick={onClose} className='text-gray-600 hover:text-black'>
            ✖
          </button>
        </div>

        {/* Tabs */}
        <div className='mt-4'>
          <div className='flex border-b'>
            <button
              className={`flex-1 p-2 ${
                activeTab === "form"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("form")}
            >
              Form Submit
            </button>
            <button
              className={`flex-1 p-2 ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              File Upload
            </button>
          </div>

          {/* Form Tab */}
          {activeTab === "form" && (
            <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700'
                >
                  Customer Name
                </label>
                <input
                  id='name'
                  name='name'
                  type='text'
                  placeholder='Enter Customer Name'
                  onChange={handleChange}
                  className='w-full p-2 border rounded-md'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='motherCode'
                  className='block text-sm font-medium text-gray-700'
                >
                  Mother Code
                </label>
                <input
                  id='motherCode'
                  name='motherCode'
                  type='text'
                  placeholder='Enter Mother Code'
                  onChange={handleChange}
                  className='w-full p-2 border rounded-md'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='group'
                  className='block text-sm font-medium text-gray-700'
                >
                  Group
                </label>
                <input
                  id='group'
                  name='group'
                  type='text'
                  placeholder='Enter Group'
                  onChange={handleChange}
                  className='w-full p-2 border rounded-md'
                  required
                />
              </div>
              <button
                type='submit'
                className='w-full bg-blue-600 text-white py-2 rounded-md'
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>
          )}
          {/* File Upload Tab */}
          {activeTab === "upload" && (
            <div className='mt-4 space-y-4'>
              <label
                htmlFor='file'
                className='block text-sm font-medium text-gray-700'
              >
                Upload CSV File
              </label>
              <input
                id='file'
                type='file'
                accept='.csv'
                className='w-full p-2 border rounded-md'
                onChange={handleFileChange}
              />
              <button
                className={`w-full py-2 rounded-md bg-blue-600 ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
                } text-white`}
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload"}{" "}
                {/* ✅ Show loading text */}
              </button>

              {/* Display CSV Data in Table */}
              {csvData && csvData.length > 0 ? (
                <div>
                  <div className='mt-4 overflow-auto max-h-[10rem] border rounded-md p-2 bg-gray-100'>
                    <table className='w-full border-collapse border border-gray-300 text-sm'>
                      <thead>
                        <tr className='bg-gray-200'>
                          {Object.keys(csvData[0]).map((header) => (
                            <th
                              key={header}
                              className='border p-1  border-collapse border border-gray-300'
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.map((row, index) => (
                          <tr
                            key={index}
                            className='odd:bg-white even:bg-gray-50'
                          >
                            {Object.values(row).map((value, idx) => (
                              <td key={idx} className='border p-1'>
                                {value as string}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className={`w-full py-2 rounded-md bg-blue-600 mt-4 ${
                      loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
                    } text-white`}
                    disabled={loading}
                    onClick={handleExport}
                  >
                    {loading ? "Exporting..." : "Export"}{" "}
                    {/* ✅ Show loading text */}
                  </button>
                </div>
              ) : (
                errorMessage && (
                  <p className='text-red-500 text-sm mt-2'>{errorMessage}</p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
