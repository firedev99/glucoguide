"use client"

import { Menu, Header, Sidebar, ChatModal } from "@/components"
import { AnimatePresence } from "framer-motion"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAppContext } from "@/hooks/useAppContext"

export default function Navigation() {
  const { showMenu, showChat, closeMenu } = useAppContext()

  let pathname = usePathname()

  // close menu on route change
  useEffect(() => {
    closeMenu()
    //eslint-disable-next-line
  }, [pathname])

  return (
    <>
      <Header />
      <AnimatePresence>{showMenu && <Menu />}</AnimatePresence>
      <Sidebar />
      {showChat && <ChatModal />}
    </>
  )
}
