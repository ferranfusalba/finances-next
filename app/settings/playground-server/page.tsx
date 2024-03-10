import Layout02b from "@/components/layouts/Layout02b";

const PlaygroundServerPage = async () => {
  return (
    <Layout02b>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-sky-300 text-yellow-400">
          ARS
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-sky-300 text-yellow-400">
          ARS
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-sky-300 text-slate-50">
          ARS
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-blue-950 text-slate-50">
          AUD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-950 text-slate-50">
          AUD
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-red-600 text-slate-50">
          CAD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-red-600 text-slate-50">
          CAD
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-red-700 text-slate-50">
          CHF
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-red-700 text-slate-50">
          CHF
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-blue-800 text-amber-300">
          EUR
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-800 text-amber-300">
          EUR
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-800 text-slate-50">
          EUR
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-blue-950 text-red-600">
          NZD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-950 text-red-600">
          NZD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-blue-950 text-slate-50">
          NZD
        </span>
      </div>
      <div className="m-2">
        <span className="font-mono p-1 mx-2 rounded-md bg-lime-900 text-slate-50">
          USD
        </span>
        <span className="font-mono p-1 mx-2 border-solid border-2 rounded-md border-lime-900 text-slate-50">
          USD
        </span>
      </div>
    </Layout02b>
  );
};

export default PlaygroundServerPage;
