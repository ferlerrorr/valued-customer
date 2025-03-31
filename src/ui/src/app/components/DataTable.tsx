import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableHead, TableRow, TableCell, TableBody } from "./ui/table";

interface Customer {
  VCustID: string;
  VCustName: string;
  Active: number;
  MotherCode: string;
  Vgroup: string;
  CompanyName: string;
  created_at: Date;
}

const columnHeaders = {
  VCustID: "Customer ID",
  VCustName: "Customer Name",
  Active: "Status",
  MotherCode: "Mother Code",
  Vgroup: "Group",
  CompanyName: "Company Name",
  created_at: "Date Enrolled",
};
const PAGE_SIZES = [10, 50, 100, 500, 1000] as const;
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
  const [vgroupOptions, setVgroupOptions] = useState<string[]>([]);

  useEffect(() => {
    const uniqueVgroups = [...new Set(data.map((customer) => customer.Vgroup))];
    setVgroupOptions(uniqueVgroups);
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const localResponse = await fetch("/customerData/customerData.json");
        if (localResponse.ok) {
          const localData: Customer[] = await localResponse.json();
          setData(localData);
          setFilteredData(localData);
        }

        const apiResponse = await fetch("api/valuedCustomer/valuedCustomer");
        if (!apiResponse.ok) throw new Error("API failed");

        const apiData: Customer[] = await apiResponse.json();
        setData(apiData);
        setFilteredData(apiData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const [searchColumn, setSearchColumn] = useState<
    | "All"
    | "VCustID"
    | "VCustName"
    | "Active"
    | "MotherCode"
    | "Vgroup"
    | "CompanyName"
    | "created_at"
  >("All");

  useEffect(() => {
    setFilteredData(
      data.filter((customer) => {
        if (searchColumn === "All") {
          return Object.entries(customer).some(
            ([key, value]) =>
              key !== "Actions" &&
              String(value).toLowerCase().includes(search.toLowerCase())
          );
        } else if (searchColumn === "created_at") {
          // Check if any alphanumeric character is present
          return (
            /\w/.test(search) &&
            String(customer[searchColumn])
              .toLowerCase()
              .includes(search.toLowerCase())
          );
        } else {
          return String(customer[searchColumn])
            .toLowerCase()
            .includes(search.toLowerCase());
        }
      })
    );
  }, [search, searchColumn, data]);

  const columnMap: Record<string, keyof Customer> = {
    CustumerID: "VCustID",
    CustumerName: "VCustName",
    Status: "Active",
    Group: "Vgroup",
    DateEnrolled: "created_at",
    CompanyName: "CompanyName",
    MotherCode: "MotherCode",
  };

  const handleSort = (columnLabel: string) => {
    const column = columnMap[columnLabel];
    if (!column) return;

    const order = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(order);

    setFilteredData(
      [...filteredData].sort((a, b) => {
        const valA = a[column];
        const valB = b[column];

        // Handle null values (push nulls to bottom)
        if (valA === null) return order === "asc" ? 1 : -1;
        if (valB === null) return order === "asc" ? -1 : 1;

        // Sort dates properly
        if (column === "created_at") {
          return order === "asc"
            ? new Date(valA).getTime() - new Date(valB).getTime()
            : new Date(valB).getTime() - new Date(valA).getTime();
        }

        // Sort numbers correctly
        if (typeof valA === "number" && typeof valB === "number") {
          return order === "asc" ? valA - valB : valB - valA;
        }

        // Sort strings correctly
        return order === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      })
    );
  };
  const totalPages = Math.ceil(filteredData.length / Number(pageSize));

  const paginatedData = filteredData.slice(
    (page - 1) * Number(pageSize),
    page * Number(pageSize)
  );

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer({ ...customer });
  };

  // const handleUpdate = () => {
  //   if (!selectedCustomer) return;
  //   setData((prevData) =>
  //     prevData.map((customer) =>
  //       customer.VCustID === selectedCustomer.VCustID
  //         ? selectedCustomer
  //         : customer
  //     )
  //   );
  //   setFilteredData((prevData) =>
  //     prevData.map((customer) =>
  //       customer.VCustID === selectedCustomer.VCustID
  //         ? selectedCustomer
  //         : customer
  //     )
  //   );
  //   setSelectedCustomer(null);
  // };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(selectedCustomer);
  };

  return (
    <div className='p-4 w-full'>
      <div className='flex justify-between items-center mb-4'>
        <div className='flex items-center gap-2'>
          <div>
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
        </div>
        <div className='flex items-center justify-center gap-1'>
          <label className='text-sm font-medium'>Search In:</label>
          <div className='relative'>
            <select
              className='border rounded py-2 px-2 pr-6 appearance-none'
              value={searchColumn}
              onChange={(e) =>
                setSearchColumn(e.target.value as keyof Customer | "All")
              }
            >
              <option value='All'>All Columns</option>
              <option value='VCustID'>Customer ID</option>
              <option value='VCustName'>Customer Name</option>
              <option value='Active'>Status</option>
              <option value='MotherCode'>Mother Code</option>
              <option value='Vgroup'>Group</option>
              <option value='CompanyName'>Company Name</option>
              <option value='created_at'>Date Enrolled</option>
            </select>
            <div className='absolute inset-y-0 right-3 flex items-center pointer-events-none text-[.1em]'>
              ╲╱
            </div>
          </div>
          <Input
            type='text'
            placeholder='Search...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='w-72'
          />
        </div>
      </div>
      {/* Table */}
      <Table className='table-fixed w-full'>
        <TableHead className='sticky top-0 bg-gray-100 shadow-md border border-gray-300'>
          <TableRow className='border border-gray-00'>
            {[
              "CustumerID",
              "CustumerName",
              "Status",
              "MotherCode",
              "Group",
              "CompanyName",
              "DateEnrolled",
              "Actions",
            ].map((key, index) => (
              <th
                key={index}
                className={`cursor-pointer px-4 py-2 border border-gray-300 bg-gray-100 text-gray-700`}
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
        <TableBody>
          {paginatedData.map((customer) => (
            <TableRow key={customer.VCustID}>
              <TableCell>{customer.VCustID}</TableCell>
              <TableCell>{customer.VCustName}</TableCell>
              <TableCell>
                {customer.Active === 1 ? "Active" : "Inactive"}
              </TableCell>
              <TableCell>{customer.MotherCode}</TableCell>
              <TableCell>{customer.Vgroup}</TableCell>
              <TableCell>{customer.CompanyName}</TableCell>
              <TableCell>
                {customer.created_at
                  ? new Date(customer.created_at).toISOString().split("T")[0] // Extract YYYY-MM-DD
                  : "N/A"}
              </TableCell>
              <TableCell>
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
      {pageSize && (
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
      {selectedCustomer && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-md'>
            <h2 className='text-xl font-semibold mb-4'>Edit Customer</h2>

            <form onSubmit={handleSubmit}>
              {Object.entries(selectedCustomer).map(([key, value]) => {
                // Skip UpdateID field
                if (key === "UpdateID") return null;

                return (
                  <div key={key} className='mb-4'>
                    <label className='block text-sm font-medium mb-1'>
                      {columnHeaders[key as keyof typeof columnHeaders] || key}
                    </label>

                    {key === "Active" ? (
                      // Toggle Slider for Active Status
                      <div
                        className={`relative w-14 h-7 flex items-center rounded-full pl-[2px] cursor-pointer transition-colors ${
                          selectedCustomer.Active === 1
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                        onClick={() =>
                          setSelectedCustomer({
                            ...selectedCustomer,
                            Active: selectedCustomer.Active === 1 ? 0 : 1,
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
                    ) : key === "Vgroup" ? (
                      // Dropdown Selection for Group
                      <select
                        value={selectedCustomer.Vgroup || ""}
                        onChange={(e) =>
                          setSelectedCustomer({
                            ...selectedCustomer,
                            Vgroup: e.target.value,
                          })
                        }
                        className='mt-1 block w-full p-2 border border-gray-300 rounded-md sm:text-sm'
                      >
                        <option value='' disabled>
                          Select Group
                        </option>
                        {vgroupOptions.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    ) : (
                      // Regular Input for Other Fields
                      <Input
                        value={
                          key === "created_at" && value
                            ? new Date(value).toISOString().split("T")[0]
                            : value !== null && value !== undefined
                            ? String(value)
                            : ""
                        }
                        onChange={(e) =>
                          setSelectedCustomer({
                            ...selectedCustomer,
                            [key]: e.target.value,
                          })
                        }
                        disabled={
                          key === "VCustID" ||
                          key === "created_at" ||
                          key === "CompanyName"
                        }
                      />
                    )}
                  </div>
                );
              })}

              <div className='flex justify-end gap-3 mt-6'>
                <Button variant='primary' type='submit'>
                  Update
                </Button>
                <Button
                  variant='outline'
                  onClick={() => setSelectedCustomer(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
