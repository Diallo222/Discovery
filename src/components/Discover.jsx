import React, { useEffect, useState } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { motion } from "framer-motion";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { getImages, getMore } from "../redux/location/locationSlice";
import { styles } from "../styles";
import Search from "./Search";
import AreaCard from "./AreaCard";
import { fadeIn, staggerContainer, textVariant } from "../utils/motion";
import BarLoader from "./Indicator";

const Discover = () => {
  const { images, next_page, loading } = useSelector(
    (state) => state.location,
    shallowEqual
  );
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();

  const items =
    images &&
    images.map((item, index) => (
      <AreaCard
        key={index}
        index={index}
        image={item.src.large}
        photographer={item.photographer}
      />
    ));

  const LoadMore = () => {
    dispatch(getMore({ next_page: next_page }));
  };

  useEffect(() => {
    dispatch(getImages({ query: "Minimalist" }));
  }, []);

  return (
    <motion.section
      id="discover"
      variants={staggerContainer()}
      initial="hidden"
      whileInView="show"
      className={`${styles.padding} max-w-full mx-auto relative z-0`}
    >
      <motion.div variants={textVariant()}>
        <p className="text-[18px] text-black font-semibold uppercase tracking-wider">Explore</p>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-1 text-zinc-800 text-[17px] max-w-3xl leading-[30px]"
      >
        Search for something, ex: car, mountain, land, etc...
      </motion.p>
      <Search
        value={query}
        handleClick={(e) => setQuery(e.target.value)}
        onclick={() => {
          dispatch(getImages({ query: query }));
        }}
      />

      {/* Masonry Grid with Responsive Layout */}
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
        <Masonry gutter="20px">
          {items}
        </Masonry>
      </ResponsiveMasonry>

      {next_page && !loading && (
        <div
          className="flex justify-center items-center cursor-pointer"
          onClick={LoadMore}
        >
          <a className="px-6 py-2 font-medium bg-slate-50 text-black w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-cyan-400">
            Load more
          </a>
        </div>
      )}

      {loading && (
        <motion.div className="flex justify-center items-center my-4">
          <BarLoader />
        </motion.div>
      )}
    </motion.section>
  );
};

export default Discover;
