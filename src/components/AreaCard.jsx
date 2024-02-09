const AreaCard = ({
    index,
    name,
    description,
    image,
    photographer,
    demo_link,
  }) => {
    return (
      <div className=" w-full rounded-lg ">
        <img
          src={image}
          alt={name}
          style={{ width: "100%", borderRadius: "8px" }}
          className="transition-transform duration-300 hover:scale-110"
        />
        <p className="left-2 text-white text-[14px] leading-snug text-center">
          From {photographer}
        </p>
      </div>
    );
  };

  export default AreaCard