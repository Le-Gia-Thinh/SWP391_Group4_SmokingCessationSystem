import { useEffect } from "react";

export function useScrollReveal(selector = ".scroll-section", options) {
    useEffect(() => {
        const els = Array.from(document.querySelectorAll(selector));
        if (!els.length) return;

        const io = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, ...options }
        );

        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [selector, options]);
}