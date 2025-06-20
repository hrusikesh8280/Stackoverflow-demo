import { useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");


const handletype = (e) => {
  setQuestion(e.target.value);
  console.log( e.target.value);
}

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 p-10 bg-gray-50">
      <h1 className="text-3xl font-semibold text-blue-700">
        Stack Overflow By Hrusikesh
      </h1>

      <input
        value={question}
        onChange={(e) => handletype(e)}
        placeholder="Type a question…"
        className="w-full max-w-xl border rounded-md p-3 focus:outline-none focus:ring focus:ring-blue-300"
      />

   
    </main>
  );
}
