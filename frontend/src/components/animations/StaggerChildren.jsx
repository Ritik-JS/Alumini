import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const StaggerContainer = ({ children, className = '' }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '' }) => (
  <motion.div variants={itemVariants} className={className}>
    {children}
  </motion.div>
);

export { containerVariants, itemVariants };
