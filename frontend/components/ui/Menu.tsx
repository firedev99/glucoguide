"use client"

import { useRef } from "react"
import { motion } from "framer-motion"

import { fadingAnimation, slideInAnimation } from "@/lib/animations"
import { routeLinks as content } from "@/lib/dummy/routes"

import { Background, Icon } from "@/components"
import { usePathname, useRouter } from "next/navigation"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useAppContext } from "@/hooks/useAppContext"
import { useProfile } from "@/hooks/useProfile"

import Link from "next/link"

export default function Menu() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()

  const { closeMenu } = useAppContext()
  const { logout } = useProfile(false)

  const router = useRouter()

  useClickOutside(containerRef, () => closeMenu())

  return (
    <>
      {/* mobile menu */}
      <motion.nav
        variants={slideInAnimation}
        initial="initial"
        animate="animate"
        exit="exit"
        ref={containerRef}
        className="bg-[--primary-white] dark:bg-neutral-900 fixed z-[70] min-h-full h-full w-60 top-0 left-0 pt-6 flex flex-col prevent-scroll md:hidden"
      >
        <Background name="half-box-pattern" className="hidden dark:block" />
        <Background name="gradient-3" />
        {/* logo */}
        <div className="center gap-2 mb-8">
          <Icon className="w-8 h-8 -ml-4" name="gluco-guide" />
          <h3 className="font-bold bg-gradient-to-r text-lg from-blue-800 to-indigo-900 bg-clip-text text-transparent dark:from-indigo-500 dark:to-blue-500">
            GlucoGuide
          </h3>
        </div>

        <div className="h-full w-full flex flex-col px-4 pb-3 justify-between overflow-y-auto custom-scroll">
          {/* overview routes */}
          <div className="flex flex-col gap-3">
            <span className="text-xs text-opacity-70 ml-2 font-medium">
              Overview
            </span>
            {content.slice(0, 6).map(({ name, icon, dest }, idx) => (
              <Link
                href={dest ?? "#"}
                onClick={() => closeMenu()}
                className={`flex transition duration-200 items-center py-2 px-2 gap-2 rounded-md ${
                  pathname === dest
                    ? `bg-[--primary-blue] dark:bg-neutral-800 hover:bg-[--primary-blue] text-[--primary-white]`
                    : `hover:bg-neutral-200 dark:hover:bg-neutral-800`
                }`}
                key={`sidebar_upper_link_${idx}`}
              >
                <div>
                  <Icon
                    name={icon}
                    pathClassName={`transition duration-200  dark:stroke-neutral-300 ${
                      pathname === dest
                        ? `stroke-[--primary-white]`
                        : `opacity-90`
                    }`}
                  />
                </div>
                <span className="text-sm font-bold">{name}</span>
              </Link>
            ))}
          </div>

          {/* support routes */}
          <div className="flex flex-col gap-3 mt-6">
            <span className="text-xs text-opacity-70 ml-2  font-medium">
              Support
            </span>
            {content
              .slice(6, content.length)
              .map(({ name, icon, dest }, idx) => (
                <button
                  key={`sidebar_bottom_link_${idx}`}
                  onClick={() => {
                    // handle user logout
                    if (idx === 2) {
                      logout()
                      closeMenu()
                    } else if (dest) {
                      router.push(dest)
                    } else {
                      // help section goes here
                    }
                  }}
                >
                  <div
                    className={`flex items-center transition duration-200 py-2 px-2 gap-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 ${
                      idx === 2 && `mt-8`
                    }`}
                  >
                    <div>
                      <Icon
                        pathClassName="opacity-90 dark:stroke-neutral-300"
                        name={icon}
                      />
                    </div>
                    <span className="text-sm font-bold">{name}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </motion.nav>

      {/* overlay */}
      <motion.div
        className="size-full bg-black/80 backdrop-blur-sm inset-0 fixed z-50"
        variants={fadingAnimation}
        initial="initial"
        animate="animate"
        exit="exit"
      />
    </>
  )
}
