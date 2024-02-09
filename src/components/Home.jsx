import { motion, animate, stagger } from "framer-motion";
import { styles } from "../styles";
import { useEffect } from "react";
import { fadeIn, textVariant } from "../utils/motion";
import ShuffleGrid from "./ShuffleGrid";

const Home = () => {
  useEffect(() => {
    const sequence = [
      [
        "h1",
        { opacity: [0.1, 1], y: [-50, 0] },
        // { duration: 1, x: { duration: 2 }}
      ],
    ];
    animate(sequence, { duration: 2 }, { delay: stagger(0.4) });
  }, []);

  return (
    <section
      className={` flex relative w-full h-screen mx-auto justify-center items-center `}
    >
      <div
        className={`mx-auto flex flex-col items-center gap-5`}
      >
        {/* <div className="flex flex-col justify-center items-center mt-5">
          <div className="w-5 h-5 rounded-full bg-[#ffffff]" />
          <div className="w-1 sm:h-70 h-40 hero-gradient" />
        </div> */}

        <motion.h1
          variants={textVariant()}
          className={`${styles.heroHeadText} drop-shadow-lg mt-6 text-white-100 w-[360px] md:w-[650px] `}
        >
          Discover and explore beautifull images
        </motion.h1>
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className={`${styles.heroSubText} drop-shadow-lg text-center mt-2 w-[360px] text-slate-50`}
        >
          All images are taken by <br className="sm:block hidden" />
          professional photographer
        </motion.p>

        <motion.a
          href="#discover"
          className="px-6 py-2 font-medium bg-slate-50 text-black w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
        >
          Explore
        </motion.a>
      </div>

      <div className="absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center">
        <a href="#discover">
          <div className="w-[30px] h-[60px] rounded-3xl border-4 border-slate-50 flex justify-center items-start p-2">
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-3 h-3 rounded-full bg-white mb-1"
            />
          </div>
        </a>
      </div>
      <ShuffleGrid />
    </section>
  );
};

export default Home;
