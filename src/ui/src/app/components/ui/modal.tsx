"use client";

import { useState } from "react";

export default function Modal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"form" | "upload">("form");

  if (!open) return null; // Hide modal when closed

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-white p-6 rounded-lg shadow-lg w-96'>
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
            <form className='mt-4 space-y-4'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700'
                >
                  Name
                </label>
                <input
                  id='name'
                  type='text'
                  placeholder='Enter customer name'
                  className='w-full p-2 border rounded-md'
                  required
                />
              </div>
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700'
                >
                  Email
                </label>
                <input
                  id='email'
                  type='email'
                  placeholder='Enter email address'
                  className='w-full p-2 border rounded-md'
                  required
                />
              </div>
              <button
                type='submit'
                className='w-full bg-blue-600 text-white py-2 rounded-md'
              >
                Submit
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
                Upload File
              </label>
              <input
                id='file'
                type='file'
                className='w-full p-2 border rounded-md'
              />
              <button className='w-full bg-gray-500 text-white py-2 rounded-md'>
                Upload
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
