import React from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => (
  <table className={`min-w-full border border-gray-300 ${className || ""}`}>
    {children}
  </table>
);

export const TableHead: React.FC<TableProps> = ({ children, className }) => (
  <thead className={`bg-gray-200 font-semibold ${className || ""}`}>
    {children}
  </thead>
);

export const TableRow: React.FC<TableProps> = ({ children, className }) => (
  <tr className={`border-b border-gray-300 ${className || ""}`}>{children}</tr>
);

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className,
  ...props
}) => (
  <td
    {...props}
    className={`px-3 py-2 border-r border-gray-300 text-[.8em] ${
      className || ""
    }`}
  >
    {children}
  </td>
);

export const TableBody: React.FC<TableProps> = ({ children, className }) => (
  <tbody className={className || ""}>{children}</tbody>
);
