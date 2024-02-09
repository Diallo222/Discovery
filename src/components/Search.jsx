import React from "react";

const Search = ({ value, handleClick, onclick }) => {
    return (
      <div className="flex flex-row flex-wrap w-full h-30 justify-start gap-10 items-center py-10">
        <input
          className="placeholder-shown:border-slate-50 p-2 rounded-lg  bg-slate-100 text-black"
          placeholder="mountain , car"
          value={value}
          onChange={handleClick}
        />
        {value && (
          <div
            className="flex justify-center items-center cursor-pointer"
            onClick={onclick}
          >
            <a className="px-6 py-2 font-medium bg-slate-50 text-black w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-cyan-400">
              search
            </a>
          </div>
        )}
      </div>
    );
  };

  export default Search