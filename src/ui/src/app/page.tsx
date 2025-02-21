"use client";

import { Button } from "./components/ui/button";
import DataTable from "./components/DataTable";

export default function Home() {
  return (
    <div className='flex flex-col items-center min-h-screen gap-3  pt-[2.5em] font-[family-name:var(--font-geist-sans)] w-full'>
      <h1 className='text-3xl font-bold tracking-wider'>Valued Customers</h1>

      {/* Button aligned to the left */}
      <div className='w-full max-w-[105em]'>
        <Button variant='primary'>Add New Customer</Button>
      </div>

      {/* DataTable taking up 75% of viewport width */}
      <div className='w-full max-w-[105em] '>
        <DataTable />
      </div>
    </div>
  );
}
