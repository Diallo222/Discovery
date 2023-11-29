import { motion } from "framer-motion";

import { styles } from "../styles";

const Home = () => {
  return (
    <section className={` flex relative w-full h-screen mx-auto justify-center items-center `}>
      <div
        className={`max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5`}
      >
        <div className="flex flex-col justify-center items-center mt-5">
          <div className="w-5 h-5 rounded-full bg-[#ffffff]" />
          <div className="w-1 sm:h-70 h-40 hero-gradient" />
        </div>

        <div>
          <h1 className={`${styles.heroHeadText} text-white-100 md:w-[500px]`}>
           Discover and explore beautifull images
          </h1>
          <p className={`${styles.heroSubText} mt-2 text-gray-300`}>
            All images are taken by <br className="sm:block hidden" />
            professional photographer
          </p>
        </div>
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
    </section>
  );
};

export default Home;
