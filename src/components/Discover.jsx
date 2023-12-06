import React, { useEffect, useState } from "react";
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"
import { motion } from "framer-motion";
import {useDispatch, useSelector, shallowEqual} from 'react-redux';
import { getImages , getMore } from "../redux/location/locationSlice";
import { Tilt } from "react-tilt";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";


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
   className=" w-full rounded-lg "
    >	
  <img
						src={image}
						alt={name}
						style={{ width: "100%", borderRadius: "8px" }}
					/>
		 			<p className="left-2 text-white text-[14px] leading-snug text-center">
					From {photographer}
		 			</p>
      </div>		
		// <div
		// 	// variants={fadeIn("up", "spring", index * 0.5, 0.75)}
		// 	className="p-2 rounded-lg sm:w-[280px] w-[80%] bg-white"
		// >
			
		// 		<div className="relative ">
    //     <Tilt
		// 		options={{
		// 			max: 40,
		// 			scale: 1,
		// 			speed: 450,
		// 		}}
		// 	>

    //     {/* </Tilt>
		// 		</div>

		// 		<div className="mt-3">
		// 			<p className="mt-2 text-black text-[14px] leading-snug text-center">
		// 				{description}
		// 			</p>
		// 		</div>
		// 		<div className="mt-2 flex flex-wrap gap-1"></div>
    //     <div className="mt-3">
		// 			<p className="mt-2 text-black text-[14px] leading-snug text-center">
		// 				{photographer}
		// 			</p>
		// 		</div>
		
		// </div> */}
	);
};

const SearchZone = ({value , handleClick, onclick})=> {
  return(
<div className="flex flex-row flex-wrap w-full h-30 justify-start gap-10 items-center py-2" >
         <input 
         className="placeholder-shown:border-gray-500 p-2 rounded-lg "
          placeholder="mountain , car"
          value={value}
          onChange={handleClick}
          />
     {
      value &&
      <div className="flex justify-center items-center cursor-pointer" 
      onClick={onclick}
      >
					<a className="shadow-md shadow-gray-700 p-2 bg-zinc-800 rounded-lg flex justify-center text-sm"
					>
					search
					</a>
				</div>
     } 
      </div>
  )
}
const Discover = () => {
  const {images, next_page , loading, error } = useSelector(
    state => state.location,
    shallowEqual,
  );
  const [query , setQuery] = useState("")
 const dispatch = useDispatch()

  const items = images && images.map((item , index)=>(
    <AreaCard
      key={index}
      index={index}
      image={item.src.large}
      photographer={item.photographer}
    />
  ));
const LoadMore = () => {
  dispatch(getMore({next_page :next_page}));
}
//  console.log("Result", locations);
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
      onclick={()=>{dispatch(getImages({query:query})) }}
      />
     <ResponsiveMasonry
                columnsCountBreakPoints={{350: 1, 750: 2, 900: 3}}
            >
                <Masonry
                gutter="20px"
                columnsCount={3}
                >
       {items}  
     </Masonry>
     </ResponsiveMasonry>
     {
      next_page && 
      <div className="flex justify-center items-center cursor-pointer" 
      onClick={LoadMore}
      >
					<a className="shadow-md shadow-gray-700 p-2 bg-zinc-800 rounded-lg flex justify-center text-sm"
					>
					Load more
					</a>
				</div>
     }
    </>
  );
};

export default SectionWrapper(Discover, "discover");
