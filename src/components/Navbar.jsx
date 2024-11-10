import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCameraRetro } from "react-icons/fa";

const Navbar = () => {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (scrollTop > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
        setActive("");
      }
    };

    window.addEventListener("scroll", handleScroll);

    const navbarHighlighter = () => {
      const sections = document.querySelectorAll("section[id]");

      sections.forEach((current) => {
        const sectionId = current.getAttribute("id");
        const sectionHeight = current.offsetHeight;
        const sectionTop =
          current.getBoundingClientRect().top - sectionHeight * 0.2;

        if (sectionTop < 0 && sectionTop + sectionHeight > 0) {
          setActive(sectionId);
        }
      });
    };

    window.addEventListener("scroll", navbarHighlighter);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", navbarHighlighter);
    };
  }, []);

  return (
    <nav
      className={`px-6 w-full flex items-center py-2 fixed top-0 z-20 ${
        scrolled ? "bg-gray-200" : "bg-transparent"
      }`}
    >
      <div className="w-full flex justify-between items-center  mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2 cursor-pointer "
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
         <FaCameraRetro className="text-lg text-black" />
          <p className="text-black uppercase text-lg font-semibold drop-shadow-lg ">
            Discovery
          </p>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
