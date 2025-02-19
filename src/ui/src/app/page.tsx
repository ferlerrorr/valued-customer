"use client";

import { Button } from "./components/ui/button";
import DataTable from "./components/DataTable";

export default function Home() {
  return (
    <div className='grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      {/* Button Add New Customer needs a Modal Form For insert and some Form Validation */}
      <Button variant='primary'>Add New Customer</Button>{" "}
      <h1 className='text-2xl font-bold'>Valued Customers</h1>
      <div className='w-full max-w-4xl'>
        <DataTable />
      </div>
    </div>
  );
}
