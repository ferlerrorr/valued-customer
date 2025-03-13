"use client";

import { useState } from "react";
import { Button } from "./components/ui/button";
import DataTable from "./components/DataTable";
import Modal from "./components/ui/modal";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className='flex flex-col items-center min-h-screen gap-2 pt-[2.5em] font-[family-name:var(--font-geist-sans)] w-full '>
      <h1 className='text-3xl font-bold tracking-wider'>Valued Customers</h1>

      {/* Button aligned to the left */}
      <div className='w-full flex  max-w-[103em] pt-[1.2em] justify-between'>
        <Button variant='primary' onClick={() => setIsOpen(true)}>
          Add New Customer
        </Button>
        <Button variant='primary'>Export Search Data</Button>
      </div>

      {/* Modal Component */}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} />

      {/* DataTable taking up 75% of viewport width */}
      <div className='w-full max-w-[105em]'>
        <DataTable />
      </div>
    </div>
  );
}
