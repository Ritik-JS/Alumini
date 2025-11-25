import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export const SuccessAnimation = ({ message = 'Success!', show = true }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 0.5, repeat: 2 }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="h-16 w-16 text-green-500" />
        </motion.div>
        <p className="mt-4 text-lg font-semibold">{message}</p>
      </motion.div>
    </motion.div>
  );
};
