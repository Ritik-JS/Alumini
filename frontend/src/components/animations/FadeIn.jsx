import { motion } from 'framer-motion';

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const FadeIn = ({ children, delay = 0, duration = 0.5, className = '' }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={fadeInVariants}
    transition={{ delay, duration }}
    className={className}
  >
    {children}
  </motion.div>
);

export default FadeIn;
