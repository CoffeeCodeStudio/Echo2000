import { useState, useEffect, useRef } from "react";

export function useScrollDirection(threshold = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDir = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY.current;

      // Only update if we've scrolled past threshold
      if (Math.abs(diff) < threshold) {
        ticking.current = false;
        return;
      }

      // Show nav when scrolling up, hide when scrolling down
      // Also always show when at top of page
      if (scrollY < 50) {
        setIsVisible(true);
      } else if (diff > 0) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true); // scrolling up
      }

      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return isVisible;
}
