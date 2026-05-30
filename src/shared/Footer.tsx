"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowUp,
} from "react-icons/fa";
import { Logo } from "@/components/navbar/Logo";


const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);
  const pathname = usePathname();

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400) {
      setShowScroll(true);
    } else if (showScroll && window.pageYOffset <= 400) {
      setShowScroll(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll]);

  const logoSrc = "/favicon.png";

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, type: "tween", ease: "easeOut" },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 },
    },
  };

  // Helper to determine active class
  const isActive = (href: string) => pathname === href;

  return (
    <footer className="bg-gray-950 text-gray-300 pt-16 pb-8 px-4 md:px-10 lg:px-24 relative">
      {/* Scroll to Top Button */}
      {showScroll && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 z-50"
          aria-label="Scroll to top"
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaArrowUp className="text-xl" />
        </motion.button>
      )}

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12"
        >
          {/* Company Info */}
          <motion.div variants={fadeInUp} className="space-y-5">
            <Logo imageSrc={logoSrc} />
            <p className="leading-relaxed">
              Your trusted partner for premium tech products in Bangladesh. We
              bring innovation to your doorstep.
            </p>
            <div className="flex space-x-4">
              <motion.a
                whileHover={{ scale: 1.2, color: "#f97316" }}
                href="#"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <FaFacebook className="text-xl" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, color: "#f97316" }}
                href="#"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <FaTwitter className="text-xl" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, color: "#f97316" }}
                href="#"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <FaInstagram className="text-xl" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, color: "#f97316" }}
                href="#"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <FaLinkedin className="text-xl" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.2, color: "#f97316" }}
                href="#"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <FaYoutube className="text-xl" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links with active class */}
          <motion.div variants={fadeInUp} className="space-y-5">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: "Home", href: "/" },
                { name: "Products", href: "/products" },
                { name: "About Us", href: "/about" },
                { name: "Blog", href: "/blog" },
                { name: "Contact", href: "/contact" },
                { name: "FAQs", href: "/faqs" },
              ].map((item) => (
                <motion.li key={item.href} whileHover={{ x: 5 }}>
                  <Link
                    href={item.href}
                    className={`transition-colors ${
                      isActive(item.href)
                        ? "text-orange-500 font-semibold"
                        : "hover:text-orange-400"
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Categories with active class */}
          <motion.div variants={fadeInUp} className="space-y-5">
            <h4 className="text-lg font-semibold text-white">Categories</h4>
            <ul className="space-y-3">
              {[
                { name: "Smartphones", href: "/category/smartphones" },
                { name: "Laptops", href: "/category/laptops" },
                { name: "Home Appliances", href: "/category/home-appliances" },
                { name: "Audio Devices", href: "/category/audio-devices" },
                { name: "Gaming", href: "/category/gaming" },
                { name: "Accessories", href: "/category/accessories" },
              ].map((cat) => (
                <motion.li key={cat.href} whileHover={{ x: 5 }}>
                  <Link
                    href={cat.href}
                    className={`transition-colors ${
                      isActive(cat.href)
                        ? "text-orange-500 font-semibold"
                        : "hover:text-orange-400"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={fadeInUp} className="space-y-5">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <div className="space-y-4">
              <motion.div whileHover={{ x: 5 }} className="flex items-start">
                <FaMapMarkerAlt className="text-orange-400 mt-1 mr-3 flex-shrink-0" />
                <p>123 Tech Tower, Gulshan Avenue, Dhaka 1212, Bangladesh</p>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} className="flex items-center">
                <FaPhoneAlt className="text-orange-400 mr-3" />
                <a
                  href="tel:+8801712345678"
                  className="hover:text-orange-400 transition-colors"
                >
                  +880 1712 345 678
                </a>
              </motion.div>
              <motion.div whileHover={{ x: 5 }} className="flex items-center">
                <FaEnvelope className="text-orange-400 mr-3" />
                <a
                  href="mailto:info@digitalxpress.com"
                  className="hover:text-orange-400 transition-colors"
                >
                  info@digitalxpress.com
                </a>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="pt-8 border-t border-gray-800"
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:flex md:flex-row md:space-x-6 md:gap-x-0 md:gap-y-0 md:justify-center md:items-center">
            {[
              "Privacy Policy",
              "Terms of Service",
              "Shipping Policy",
              "Returns & Refunds",
            ].map((policy) => {
              const href = `/${policy.toLowerCase().replace(/\s+/g, "")}`;
              return (
                <motion.div key={policy} whileHover={{ y: -2 }}>
                  <Link
                    href={href}
                    className={`text-sm transition-colors ${
                      isActive(href)
                        ? "text-orange-500 font-semibold"
                        : "text-gray-500 hover:text-orange-400"
                    }`}
                  >
                    {policy}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-500 text-sm mb-4 md:mb-0 text-left md:text-center mt-10"
        >
          &copy; {new Date().getFullYear()} Digital Xpress. All rights reserved.
        </motion.p>
      </div>
    </footer>
  );
};

export default Footer;