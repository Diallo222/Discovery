import React, { useEffect, useState } from "react";

import { motion } from "framer-motion";
import {useDispatch, useSelector, shallowEqual} from 'react-redux';
import { getLocations } from "../redux/location/locationSlice";
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
	photographer,
	demo_link,
}) => {
	return (
		<div
			// variants={fadeIn("up", "spring", index * 0.5, 0.75)}
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
					<p className="mt-2 text-black text-[14px] leading-snug text-center">
						{description}
					</p>
				</div>
				<div className="mt-2 flex flex-wrap gap-1"></div>
        <div className="mt-3">
					<p className="mt-2 text-black text-[14px] leading-snug text-center">
						{photographer}
					</p>
				</div>
		
		</div>
	);
};

const SearchZone = ({value , handleClick, onclick})=> {
  return(
<div className="flex flex-row w-full h-30 justify-start gap-10 items-center py-2" >
         <input 
         className="placeholder-shown:border-gray-500 p-2 rounded-lg "
          placeholder="you@example.com"
          value={value}
          onChange={handleClick}
          />
      <div className="flex justify-center items-center cursor-pointer" 
      onClick={onclick}
      >
					<a className="shadow-md shadow-gray-700 p-2 bg-zinc-800 rounded-lg flex justify-center text-sm"
						// href={demo_link}
						// target="_blank"
					>
					search
					</a>
				</div>
      </div>
  )
}
const Discover = () => {
  const {locations, loading, error} = useSelector(
    state => state.location,
    shallowEqual,
  );
  const [query , setQuery] = useState("")
 const dispatch = useDispatch()

//  console.log("Result", locations.photos);
//  console.log("Here", query);
//   useEffect(()=> {
// console.log('rerender');
//   }, [])
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Explore</p>
      </motion.div>
     
         <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        Search for something , ex: car , mountain , land etc ...
      </motion.p>
      <SearchZone 
      value={query}
      handleClick={(e)=> setQuery(e.target.value)}
      onclick={()=>{dispatch(getLocations({query:query}))}}
      />
     
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-3 xl:grid-cols-4 gap-10 text-grayscale-50 w-full justify-items-center place-content-center">
       {
 locations?.photos?.length && locations.photos.map((item)=>{
          return (
            <AreaCard 
            key={item.id} 
            index={item.id} 
            title={item.alt}
            image={item.src.landscape}
            description={item.alt}
            photographer={item.photographer}
            // {...service} 
            />
          )
        })
       }  
      </div>
     
     

      
    </>
  );
};

export default SectionWrapper(Discover, "discover");
