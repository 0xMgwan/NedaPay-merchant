"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaFileInvoiceDollar } from "react-icons/fa6";

import Header from '../../components/Header';
import { stablecoins } from '../../data/stablecoins';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [paymentCollection, setPaymentCollection] = useState("one-time");
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  // Include USDC as a default option
  const stablecoinOptions = [{ baseToken: 'USDC', name: 'USD Coin' }, ...stablecoins];
  const [currency, setCurrency] = useState(stablecoinOptions[0]?.baseToken || "USDC");
  const [lineItems, setLineItems] = useState([{ description: "", amount: "" }]);
  const [status, setStatus] = useState<string | null>(null);

  const handleLineItemChange = (idx: number, field: string, value: string) => {
    setLineItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const addLineItem = () => setLineItems([...lineItems, { description: "", amount: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          email,
          paymentCollection,
          dueDate,
          currency,
          lineItems,
          merchantEmail: "nedalabs@hotmail.com"
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        setStatus(errorData.error || "Failed to send invoice");
        return;
      }
      setStatus("success");
      setTimeout(() => router.push("/invoice"), 1200);
    } catch (err: any) {
      setStatus(err.message || "Unknown error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
      <Header />
      <div className="my-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
          <span aria-hidden="true">←</span> Back
        </button>
      </div>
      <div className="max-w-2xl mx-auto pb-2 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 space-y-6">

        <div>
          <label className="block font-medium mb-1">Recipient (Company or Name)</label>
          <input
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Payment Collection <span title='How often you want to collect payments' className='ml-1 text-gray-400 cursor-help'>ⓘ</span></label>
          <select
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={paymentCollection}
            onChange={e => setPaymentCollection(e.target.value)}
          >
            <option value="one-time">one-time</option>
            <option value="recurring">recurring</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Due Date</label>
          <input
            type="date"
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Receive Payments In</label>
          <select
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            required
          >
            {stablecoinOptions.map((coin, idx) => (
              <option key={`${coin.baseToken}-${coin.name}-${idx}`} value={coin.baseToken}>
                {coin.baseToken} - {coin.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Invoice Line Item</label>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="ex: Consulting Service"
              value={lineItems[0].description}
              onChange={e => handleLineItemChange(0, "description", e.target.value)}
              required
            />
            <input
              className="w-32 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={lineItems[0].amount}
              onChange={e => handleLineItemChange(0, "amount", e.target.value)}
              required
            />
          </div>
          {lineItems.slice(1).map((item, idx) => (
            <div className="flex gap-2 mb-2" key={idx + 1}>
              <input
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ex: Consulting Service"
                value={item.description}
                onChange={e => handleLineItemChange(idx + 1, "description", e.target.value)}
                required
              />
              <input
                className="w-32 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Amount"
                type="number"
                min="0.01"
                step="0.01"
                value={item.amount}
                onChange={e => handleLineItemChange(idx + 1, "amount", e.target.value)}
                required
              />
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-1 rounded mt-2 text-sm hover:bg-blue-700"
            onClick={addLineItem}
          >
            + Add
          </button>
        </div>
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            className="flex-1 py-3 rounded bg-gray-100 text-gray-700 font-semibold border border-gray-300 hover:bg-gray-200 transition"
            onClick={() => setStatus("draft")}
          >
            Save Draft
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Sending..." : "Send"}
          </button>

          {status === "success" && (
            <div className="mt-4 text-green-600 font-semibold">Invoice sent successfully!</div>
          )}
        </div>
      </form>
    </div>
  </div>
  );
}
