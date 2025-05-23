"use client"

import { Icon } from "@/components"
import { useEffect, useState } from "react"
import { TDoctorAppointment } from "@/types"
import { useAnalytics } from "@/hooks/useAnalysis"
import { useDoctor } from "@/hooks/useDoctor"
import { useRouter } from "next/navigation"

export default function Analytics() {
  const [hydrated, setHydrated] = useState(false)

  const router = useRouter()

  // Retrieve requested appointments
  const { data, isLoading } = useDoctor<TDoctorAppointment[]>("requested")
  const { calculatePercentage } = useAnalytics("month")

  // Calculate metrics for displaying analytics
  const patientAnalysis = calculatePercentage()
  const appointmentAnalysis = calculatePercentage("appointments")

  function handleNavigation(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    url: string
  ) {
    if (typeof window !== "undefined") {
      e.preventDefault()
      if (e.ctrlKey) {
        window.open(url, `_blank`)
      } else {
        router.push(url)
      }
    }
  }

  useEffect(() => {
    setHydrated(true)
  }, [])

  // Loading UI Skeleton
  if (!isLoading && !hydrated)
    return (
      <div
        role="status"
        className="animate-pulse mt-3 lg:mt-0 min-h-40 w-full col-span-4 lg:order-1 lg:col-span-3 flex gap-2 md:gap-3"
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={`analytics-skeleton-${i}`}
            className="size-full rounded-[26px] bg-gray-300/80 min-h-40 dark:bg-neutral-700/75"
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    )

  return (
    <div
      className={`mt-3 lg:mt-0 min-h-40 w-full col-span-4 lg:order-1 lg:col-span-3 flex gap-2 md:gap-3`}
    >
      {/* Patient Metrics */}
      <div className="text-sm text-start size-full relative bg-neutral-200 dark:bg-neutral-800 rounded-[26px] shadow-sm border border-neutral-300 dark:border-none dark:gradient-border-black">
        <div className="size-full flex flex-col p-3 2xl:p-4">
          <div className="flex justify-between items-center mt-2 md:mt-0">
            <h3 className="md:text-base lg:text-lg font-semibold md:font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Patients
            </h3>
            <button
              className="hidden relative md:center size-9 rounded-full bg-neutral-300 group hover:bg-neutral-400/80 dark:bg-neutral-700/80 dark:hover:bg-neutral-700 hover:cursor-pointer transition"
              onClick={(e) =>
                handleNavigation(e, "/doctor/appointments/patients")
              }
            >
              <Icon
                name="rotated-arrow"
                className="size-8"
                pathClassName="fill-neutral-600 dark:fill-neutral-400 group-hover:fill-neutral-700 group-hover:dark:fill-neutral-300"
              />
            </button>
          </div>
          <h1 className="mt-auto text-2xl lg:text-3xl font-bold text-neutral-600 dark:text-neutral-300">
            {patientAnalysis === 0 ? 0 : `${patientAnalysis}%`}
          </h1>
          <p className="text-xs leading-3 font-semibold mb-3 text-neutral-500">
            Patient {patientAnalysis >= 0 ? `increase` : `decrease`} of{" "}
            {patientAnalysis}% in 1 month.
          </p>
        </div>
      </div>

      {/* Appointment Metrics */}
      <div className="text-sm text-start size-full relative bg-neutral-200 dark:bg-neutral-800 rounded-[26px] shadow-sm border border-neutral-300 dark:border-none dark:gradient-border-black">
        <div className="size-full flex flex-col p-3 2xl:p-4">
          <div className="flex justify-between items-center mt-2 md:mt-0">
            <h3 className="md:text-base lg:text-lg font-semibold md:font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Appointments
            </h3>
            <button
              className="hidden relative md:center size-9 rounded-full bg-neutral-300 group hover:bg-neutral-400/80 dark:bg-neutral-700/80 dark:hover:bg-neutral-700 hover:cursor-pointer transition"
              onClick={(e) => handleNavigation(e, "/doctor/appointments")}
            >
              <Icon
                name="rotated-arrow"
                className="size-8"
                pathClassName="fill-neutral-600 dark:fill-neutral-400 group-hover:fill-neutral-700 group-hover:dark:fill-neutral-300"
              />
            </button>
          </div>
          <h1 className="mt-auto text-2xl lg:text-3xl font-bold text-neutral-600 dark:text-neutral-300">
            {appointmentAnalysis === 0 ? 0 : `${appointmentAnalysis}%`}
          </h1>
          <p className="line-clamp-2 leading-3 text-xs text-neutral-500 font-semibold mb-3">
            Appointments {appointmentAnalysis >= 0 ? `increase` : `decrease`} of{" "}
            {appointmentAnalysis}% in 1 month.
          </p>
        </div>
      </div>

      {/* Patient on Queue */}
      <div className="text-sm text-start size-full relative bg-neutral-200 dark:bg-neutral-800 rounded-[26px] shadow-sm border border-neutral-300 dark:border-none dark:gradient-border-black">
        <div className="size-full flex flex-col p-3 2xl:p-4">
          <div className="flex justify-between items-center mt-2 md:mt-0">
            <h3 className="md:text-base lg:text-lg font-semibold leading-4 md:font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Patient on Queue
            </h3>
            <button
              className="hidden relative md:center size-9 rounded-full bg-neutral-300 group hover:bg-neutral-400/80 dark:bg-neutral-700/80 dark:hover:bg-neutral-700 hover:cursor-pointer transition"
              onClick={(e) => handleNavigation(e, "/doctor/appointments")}
            >
              <Icon
                name="rotated-arrow"
                className="size-8"
                pathClassName="fill-neutral-600 dark:fill-neutral-400 group-hover:fill-neutral-700 group-hover:dark:fill-neutral-300"
              />
            </button>
          </div>
          <h1 className="mt-auto text-2xl lg:text-3xl font-bold text-neutral-600 dark:text-neutral-300">
            {data && data?.length > 0 ? `${data.length}+` : 0}
          </h1>
          <p className="line-clamp-2 leading-3 text-xs text-neutral-500 font-semibold mb-3">
            Number of appointment requests on queue.
          </p>
        </div>
      </div>
    </div>
  )
}
