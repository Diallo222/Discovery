import React from 'react'
import { motion } from "framer-motion";
const AreaCard = ({
    name,
    image,
    photographer,
  }) => {
    return (
      <motion.div 
      initial={{ scale: 1 }}
      whileHover={{ scale: 0.98 }}
      className="w-full  overflow-hidden transition-transform duration-700 ease-in-out">
        <motion.img
          src={image}
          alt={name}
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1}}
          className="transition-transform duration-700 ease-in-out "
        />
        <p className=" text-black uppercase text-base md:text-md tracking-tighter font-medium text-center mt-2">
          From {photographer}
        </p>
      </motion.div>
    );
  };

  export default AreaCard