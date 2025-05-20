"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

interface SidebarButtonProps {
  collapsed: boolean
  toggleCollapsed: () => void
}

export default function SidebarButton({ collapsed, toggleCollapsed }: SidebarButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="fixed z-50"
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        left: collapsed ? "16px" : "400px", // Update from 360px to 400px
        marginLeft: collapsed ? "0" : "-16px",
      }}
    >
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full bg-white shadow-md border border-gray-200 hover:bg-gray-50"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </motion.div>
  )
}
