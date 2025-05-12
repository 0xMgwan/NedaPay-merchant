"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar } from "react-icons/fa6";

interface Invoice {
  id: string;
  created: string;
  name: string;
  email: string;
  status: string;
  amount: string;
}

const mockInvoices: Invoice[] = [];

const statusTabs = ["All", "Draft", "Overdue", "Outstanding", "Paid", "Partial"];

import Header from '../components/Header';

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [activeTab, setActiveTab] = useState("All");
  const router = useRouter();

  return (
    <>
      <Header />
      <div className="my-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
          <span aria-hidden="true">←</span> Back
        </button>
      </div>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
      <p className="text-gray-500 mb-6">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-50 rounded-xl shadow-md p-6 flex flex-col items-center justify-center md:col-span-2">
          <FaFileInvoiceDollar className="text-4xl text-blue-600 mb-2" />
          <div className="font-semibold text-lg mb-1">Create Invoice</div>
          <div className="text-gray-500 text-sm mb-4">Create and Send Crypto Invoices</div>
          <button
            onClick={() => router.push("/invoice/create")}
            className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
          >
            Create
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Invoices</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.created}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:underline mr-2">View</button>
                      <button className="text-blue-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-6">
          <button className="px-3 py-1 rounded bg-gray-100 text-gray-400 cursor-not-allowed" disabled>&lt;</button>
          <span className="text-sm text-gray-600">Page 1 of 0</span>
          <button className="px-3 py-1 rounded bg-gray-100 text-gray-400 cursor-not-allowed" disabled>&gt;</button>
        </div>
      </div>
      </div>
      </div>
    </>
  );
}
