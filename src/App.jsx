import { BrowserRouter } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Discover, Home, Navbar } from "./components";

const App = () => {
  return (
    <BrowserRouter>
      <div className=" bg-gray-200 ">
        <Navbar />
        <Home />
        <Discover />
      </div>
    </BrowserRouter>
  );
};

export default App;
