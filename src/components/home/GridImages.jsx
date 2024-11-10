import React from "react";
import { motion } from "framer-motion";
import { RandomImages } from "../../constants"; // Assuming you have an array of images

const GalleryGrid = () => {
  return (
      <motion.div
        className="absolute w-11/12 h-full flex flex-row gap-4 justify-center items-center"
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
       <motion.img
          src={RandomImages[0].src}
          alt="Image 1"
          className="h-4/6 w-1/3 object-cover"
        />
         <motion.img
          src={RandomImages[1].src}
          alt="Image 1"
          className="h-4/6 w-1/3 object-cover"
        />
      </motion.div>

  );
};

export default GalleryGrid;
