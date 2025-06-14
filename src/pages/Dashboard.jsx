// src/pages/Dashboard.jsx
import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 text-sm">
        Bienvenido al panel de control. Aquí puedes iniciar con tus tareas.
      </p>
    </motion.div>
  );
}
