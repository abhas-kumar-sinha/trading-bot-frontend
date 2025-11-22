import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/defi/layout/navbar";

// Pages
import Defi from "./pages/Defi";
import Live from "./pages/Live";

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-5 border-t-transparent border-sidebar-primary rounded-full scale-175 animate-spin" />
    </div>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <Loader />;

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen px-6 font-sans pb-6 max-w-[1600px] mx-auto">
        <Navbar />

        <Routes>
          <Route path="/" element={<Live />} />
          <Route path="/defi" element={<Defi />} />
        </Routes>

      </div>
    </HashRouter>
  );
};

export default App;
