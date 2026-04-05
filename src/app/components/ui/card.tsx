import { motion } from "framer-motion";

type CardProps = {
  title: string;
  value: string | number;
};

export function Card({ title, value }: CardProps) {
  return (
    <motion.div
      className="bg-[#23272a] p-6 rounded-2xl shadow-md border border-[#2c2f33] hover:shadow-lg transition-all"
      whileHover={{ scale: 1.03, boxShadow: "0 4px 32px #5865f233" }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <p className="text-[#b9bbbe] text-sm mb-1">{title}</p>
      <h2 className="text-3xl font-bold text-[#f2f3f5]">{value}</h2>
    </motion.div>
  );
}