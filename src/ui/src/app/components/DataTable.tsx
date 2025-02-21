"use client";

import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableHead, TableRow, TableCell, TableBody } from "./ui/table";

interface Customer {
  VCustID: string;
  VCustName: string;
  Active: number;
  UpdateID: number;
  MotherCode: string;
}

const PAGE_SIZES = [10, 25, 50, 100, 500, "Full Page"] as const;
type PageSizeOption = (typeof PAGE_SIZES)[number];

const DataTable: React.FC = () => {
  const [data, setData] = useState<Customer[]>([]);
  const [filteredData, setFilteredData] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<keyof Customer | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    fetch("/api/valuedCustomer/valuedCustomer")
      .then((res) => res.json())
      .then((data: Customer[]) => {
        setData(data);
        setFilteredData(data);
      });
  }, []);

  useEffect(() => {
    setFilteredData(
      data.filter((customer) =>
        customer.VCustName.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, data]);

  const handleSort = (column: keyof Customer) => {
    const order = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(order);
    setFilteredData(
      [...filteredData].sort((a, b) => {
        if (a[column] < b[column]) return order === "asc" ? -1 : 1;
        if (a[column] > b[column]) return order === "asc" ? 1 : -1;
        return 0;
      })
    );
  };

  const totalPages =
    pageSize === "Full Page" ? 1 : Math.ceil(filteredData.length / pageSize);
  const paginatedData =
    pageSize === "Full Page"
      ? filteredData
      : filteredData.slice(
          (page - 1) * Number(pageSize),
          page * Number(pageSize)
        );

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleUpdate = () => {
    if (!selectedCustomer) return;
    setData((prevData) =>
      prevData.map((customer) =>
        customer.VCustID === selectedCustomer.VCustID
          ? selectedCustomer
          : customer
      )
    );
    setSelectedCustomer(null);
  };

  return (
    <div className='p-4 w-[100%]'>
      <div className=' flex justify-between items-center mb-[1em]'>
        {/* Page Size Selector */}
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>Rows per page:</label>
          <select
            className='border rounded px-2 py-1'
            value={pageSize}
            onChange={(e) => {
              const newSize =
                e.target.value === "Full Page"
                  ? "Full Page"
                  : Number(e.target.value);
              setPageSize(newSize as PageSizeOption);
              setPage(1);
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <Input
          type='text'
          placeholder='Search...'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className='w-[17em]'
        />
      </div>

      {/* Table */}
      <Table className='table-fixed w-full'>
        {/* Table Head */}
        <TableHead className='sticky top-0 bg-gray-100 shadow-md border border-gray-300'>
          <TableRow className='border border-gray-00'>
            {[
              { key: "VCustID", width: "w-[100px] text-left" },
              { key: "VCustName", width: "w-[200px] text-left" },
              { key: "Active", width: "w-[100px] text-center" },
              { key: "UpdateID", width: "w-[150px] text-left" },
              { key: "MotherCode", width: "w-[150px] text-left" },
              { key: "Actions", width: "w-[100px] text-center" },
            ].map(({ key, width }, index) => (
              <th
                key={index}
                className={`cursor-pointer px-4 py-2 ${width} border border-gray-300 bg-gray-100 text-gray-700`}
                onClick={() => handleSort(key as keyof Customer)}
              >
                <div className='flex items-center justify-between w-full'>
                  <span>{key}</span>
                  <span
                    className={`ml-2 ${
                      sortColumn === key ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {sortColumn === key
                      ? sortOrder === "asc"
                        ? "↑"
                        : "↓"
                      : "⇅"}
                  </span>
                </div>
              </th>
            ))}
          </TableRow>
        </TableHead>

        {/* Table Body */}
        <TableBody>
          {paginatedData.map((customer) => (
            <TableRow key={customer.VCustID}>
              <TableCell>{customer.VCustID}</TableCell>
              <TableCell>{customer.VCustName}</TableCell>
              <TableCell>
                {customer.Active === 1 ? "Active" : "Inactive"}
              </TableCell>
              <TableCell>{customer.UpdateID}</TableCell>
              <TableCell>{customer.MotherCode}</TableCell>
              <TableCell className='w-[100px]'>
                <Button
                  variant='outline'
                  onClick={() => handleEditClick(customer)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {pageSize !== "Full Page" && (
        <div className='flex justify-between mt-4'>
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modal */}
      {/* Modal Form For insert and some Form Validation */}
      {selectedCustomer && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-96'>
            <h2 className='text-xl font-semibold mb-4'>Edit Customer</h2>

            {Object.entries(selectedCustomer).map(([key, value]) => (
              <div key={key} className='mb-3'>
                <label className='block text-sm font-medium mb-1'>{key}</label>

                {key === "Active" ? (
                  // Toggle Slider for Active Status (Reversed Logic)
                  <div
                    className={`relative w-14 h-7 flex items-center rounded-full pl-[2px] cursor-pointer transition-colors ${
                      selectedCustomer.Active === 1
                        ? "bg-green-500"
                        : "bg-gray-600"
                    }`}
                    onClick={() =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        Active: selectedCustomer.Active === 1 ? 0 : 1, // Toggle active state
                      })
                    }
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                        selectedCustomer.Active === 1
                          ? "translate-x-0"
                          : "translate-x-7"
                      }`}
                    ></div>
                  </div>
                ) : (
                  // Regular Input for Other Fields
                  <Input
                    value={value}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        [key]: e.target.value,
                      })
                    }
                    disabled={key === "VCustID"}
                  />
                )}
              </div>
            ))}

            <div className='flex justify-end gap-2 mt-4'>
              <Button variant='primary' onClick={handleUpdate}>
                Update
              </Button>
              <Button
                variant='outline'
                onClick={() => setSelectedCustomer(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
