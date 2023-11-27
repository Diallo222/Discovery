import React from "react";

import { motion } from "framer-motion";
import { Tilt } from "react-tilt";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";
import { area, herobg, logo } from "../assets";

const AreaCard = ({
	index,
	name,
	description,
	image,
	source_code_link,
	demo_link,
}) => {
	return (
		<motion.div
			variants={fadeIn("up", "spring", index * 0.5, 0.75)}
			className="p-2 rounded-lg sm:w-[280px] w-[80%] bg-white"
		>
			
				<div className="relative ">
        <Tilt
				options={{
					max: 40,
					scale: 1,
					speed: 450,
				}}
			>
					<img
						src={image}
						alt={name}
						className="w-[full] h-[full] md:h-[200px]  object-cover rounded-md"
					/>
        </Tilt>
				</div>

				<div className="mt-3">
					<h3 className="text-black font-bold text-2xl">{name}</h3>
					<p className="mt-2 text-black text-[14px] leading-snug">
						{description}
					</p>
				</div>
				<div className="mt-2 flex flex-wrap gap-1"></div>
				<div className="mt-3 flex justify-center items-center">
					<a className="shadow-md shadow-gray-700 p-2 bg-zinc-800 rounded-lg flex justify-center text-sm"
						// href={demo_link}
						target="_blank"
					>
						Discover
					</a>
				</div>
		
		</motion.div>
	);
};

const Discover = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Explore</p>
      </motion.div>
     
         <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        I'm a skilled software developer with experience 
      </motion.p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 gap-10 text-grayscale-50 w-full justify-items-center place-content-center">
       
          <AreaCard 
          key={"Home"} 
          index={1} 
          title={"Goooo"}
          image={herobg}
          description={"I'm a skilled software developer with experience  I'm a skilled software developer with experience "}
          // {...service} 
          />
            <AreaCard 
          key={"Home"} 
          index={1} 
          title={"Goooo"}
          image={herobg}
          description={"I'm a skilled software developer with experience  I'm a skilled software developer with experience "}
          // {...service} 
          />
            <AreaCard 
          key={"Home"} 
          index={1} 
          title={"Goooo"}
          image={herobg}
          description={"I'm a skilled software developer with experience  I'm a skilled software developer with experience "}
          // {...service} 
          />
      
      </div>
     
     

      
    </>
  );
};

export default SectionWrapper(Discover, "discover");
