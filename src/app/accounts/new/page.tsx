"use client";
import { useRouter } from "next/navigation";

export default function NewAccount() {
  const router = useRouter();

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    const name = e.target.name.value;
    const description = e.target.description.value;

    const res = await fetch("/api/accounts/", {
      method: "POST",
      body: JSON.stringify({ name, description }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log(data);

    router.push("/accounts/" + data.id);
  };

  return (
    <div className="h-screen flex justify-center items-center">
      <form className="bg-slate-800 p-10 w-1/4" onSubmit={handleSubmit}>
        {/* Name */}
        <label htmlFor="name" className="font-bold text-sm">
          Account Name
        </label>
        <input
          type="text"
          id="name"
          className="border border-gray-400 p-2 mb-4 w-full text-black"
          placeholder="Account Name"
        />
        {/* Active */}
        {/* Type */}
        {/* <label htmlFor="type" className="font-bold text-sm">
          Type
        </label>
        <input
          type="number"
          id="type"
          className="border border-gray-400 p-2 mb-4 w-full text-black"
          placeholder="Type"
        /> */}
        {/* Description */}
        <label htmlFor="description" className="font-bold text-sm">
          Description
        </label>
        <textarea
          rows={3}
          name=""
          id="description"
          className="border border-gray-400 p-2 mb-4 w-full text-black"
          placeholder="Description"
        ></textarea>
        {/* Initial Balance */}
        {/* <label htmlFor="balance" className="font-bold text-sm">
          Initial Balance
        </label>
        <input
          type="number"
          id="balance"
          className="border border-gray-400 p-2 mb-4 w-full text-black"
          placeholder="Initial Balance"
        /> */}
        {/* Send Button */}
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add
        </button>
      </form>
    </div>
  );
}
