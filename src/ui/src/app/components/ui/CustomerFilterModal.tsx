"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./button";

interface Customer {
  VCustID: string;
  VCustName: string;
  MotherCode: string;
  Active: number;
  Vgroup: string;
  CompanyName: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerFilterModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterKey, setFilterKey] = useState<keyof Customer>("VCustID");
  const [filterValue, setFilterValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/customerData/customerData.json");
        const data: Customer[] = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error("Error loading customer data:", error);
      }
    };
    fetchData();
  }, []);

  const uniqueOptions = (column: keyof Customer) => {
    return Array.from(
      new Set(
        customers
          .map((c) => c[column])
          .filter((val) => val && String(val).trim() !== "")
      )
    ).sort((a, b) => String(a).localeCompare(String(b)));
  };

  const filteredCustomers = customers.filter((customer) =>
    filterKey === "Active"
      ? String(customer.Active) === filterValue
      : customer[filterKey]
          ?.toString()
          .toLowerCase()
          .includes(filterValue.toLowerCase())
  );
  const handleExport = () => {
    // console.log("Filtered customers:", filteredCustomers);
    const vcustIds: string[] = filteredCustomers.map(
      (customer) => customer.VCustID
    );
    // Log the VCustIDs as an array of strings
    console.log("VCustID of all filtered customers:", vcustIds);
  };

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedData = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
      <div className='bg-white mb-[8em] p-6 rounded-lg shadow-lg max-w-5xl w-full relative'>
        <h2 className='text-xl font-bold mb-4'>Customer Filter</h2>
        <button
          className='absolute top-2 right-4 text-gray-500'
          onClick={onClose}
        >
          ✖
        </button>

        {/* Filter Input */}
        <div className='mb-1 flex gap-1'>
          <select
            className='border p-1 rounded'
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value as keyof Customer)}
          >
            <option value='VCustID'>Customer ID</option>
            <option value='VCustName'>Customer Name</option>
            <option value='MotherCode'>Mother Code</option>
            <option value='Active'>Status</option>
            <option value='Vgroup'>Group</option>
            <option value='CompanyName'>Company Name</option>
            <option value='created_at'>Date Enrolled</option>
          </select>
          {filterKey === "Active" ? (
            <select
              className='border p-1 rounded w-full text-sm'
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value=''>All</option>
              <option value='1'>Active</option>
              <option value='0'>Inactive</option>
            </select>
          ) : filterKey === "Vgroup" || filterKey === "CompanyName" ? (
            <select
              className='border p-1 rounded w-full text-sm'
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setCurrentPage(1);
              }}
            >
              {uniqueOptions(filterKey).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              className='border p-2 rounded w-full'
              type='text'
              placeholder='Enter search value'
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setCurrentPage(1);
              }}
            />
          )}
          <Button
            disabled={!filterValue}
            onClick={() => {
              handleExport();
            }}
          >
            Export
          </Button>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='table-fixed w-full border-collapse border border-gray-300'>
            <thead className='sticky top-0 bg-gray-100 shadow-md border border-gray-300'>
              <tr>
                {[
                  "VCustID",
                  "VCustName",
                  "MotherCode",
                  "Active",
                  "Vgroup",
                  "CompanyName",
                  "created_at",
                ].map((key) => (
                  <th
                    key={key}
                    className='px-2 py-1 border border-gray-300 bg-gray-100 text-gray-700'
                  >
                    <span>{key}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((customer) => (
                  <tr key={customer.VCustID} className='border border-gray-300'>
                    <td className='px-2 py-1 border'>{customer.VCustID}</td>
                    <td className='px-2 py-1 border'>{customer.VCustName}</td>
                    <td className='px-2 py-1 border'>{customer.MotherCode}</td>
                    <td className='px-2 py-1 border'>
                      {customer.Active === 1 ? "Active" : "Inactive"}
                    </td>
                    <td className='px-2 py-1 border'>{customer.Vgroup}</td>
                    <td className='px-2 py-1 border'>{customer.CompanyName}</td>
                    <td className='px-2 py-1 border'>
                      {customer.created_at.split("T")[0]}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className='px-2 py-1 text-center text-gray-500'
                  >
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className='flex justify-between mt-4'>
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerFilterModal;
