// src/animations/variants.js
export const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3 } },
};

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
};

export const slideUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const cardHover = {
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' },
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

export const staggerItem = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
};
