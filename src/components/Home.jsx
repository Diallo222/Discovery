import { motion } from "framer-motion";
import { textVariant } from "../utils/motion";
import ShuffleGrid from "./ShuffleGrid";
const imageHoverEffect = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.05, rotate: 5 },
};

const Home = () => {
  return (
    <section className="w-full h-screen flex items-center justify-center mx-auto py-12 px-6 overflow-hidden overflow-x-hidden relative">
      {/* Background Images */}

      {/* Welcome Text Centered */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center w-full px-6">
        <motion.h1
          variants={textVariant(0.1)}
          initial="hidden"
          animate="show"
          className="text-4xl md:text-6xl lg:text-7xl font-medium uppercase tracking-wider text-black drop-shadow-sm"
        >
          Explore beautiful images
        </motion.h1>
      </div>
      <ShuffleGrid />
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 w-full flex justify-center items-center">
        <a href="#discover">
          <div className="w-[30px] h-[60px] rounded-3xl border-4 border-black flex justify-center items-start p-2">
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-3 h-3 rounded-full bg-black mb-1"
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Home;
