import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "neutral" | "good" | "warn";
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral"
}: StatCardProps) {
  return (
    <motion.section
      whileHover={{
        y: -6,
        scale: 1.02
      }}
      transition={{ duration: 0.2 }}
      className={`stat stat-${tone}`}
    >
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>

      <div className="statIcon">
        <Icon size={24} />
      </div>
    </motion.section>
  );
}