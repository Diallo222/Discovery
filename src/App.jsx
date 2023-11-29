import { BrowserRouter } from "react-router-dom";

import {
  Discover,
  Home,
  Navbar,

} from "./components";


const App = () => {
  return (
    <BrowserRouter>
      <div className="relative z-0 bg-primary">
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
          <Navbar />
          <Home />
        </div>
        <Discover />
      </div>
    </BrowserRouter>
  );
};

export default App;
