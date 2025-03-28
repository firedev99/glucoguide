"use client"

import { motion } from "framer-motion"

type Props = {
  type?: "primary" | "secondary" | "outline"
  typeBtn?: "button" | "submit" | "reset"
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export default function Button({
  type = "primary",
  typeBtn = "button",
  onClick,
  children,
  className,
  disabled,
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={typeBtn}
      disabled={disabled}
      className={`py-2 px-3 inline-flex items-center font-medium gap-x-2 text-sm rounded-lg border border-gray-200 ${className} ${
        type === "primary" &&
        `bg-blue-600 dark:bg-blue-700 text-white border-transparent hover:bg-blue-700`
      } ${
        type === "outline" &&
        ` bg-white dark:bg-neutral-300 text-neutral-600 shadow-sm hover:bg-gray-50 hover:text-neutral-700 dark:hover:bg-neutral-200 focus:outline outline-offset-2 focus:outline-blue-400`
      } ${
        type === "secondary" &&
        `text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br dark:border-neutral-300`
      } disabled:opacity-50 disabled:pointer-events-none font-semibold`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}
