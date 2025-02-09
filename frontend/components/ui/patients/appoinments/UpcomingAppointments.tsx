"use client"

import { TAppointment } from "@/types"
import React, { useState } from "react"
import { format, startOfToday, startOfTomorrow } from "date-fns"
import { AppointmentDetailsModal, Appointment } from "@/components"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

type Props = {
  appointmentsToday: TAppointment[]
  appointmentsTomorrow: TAppointment[]
  appointmentsCurrentWeek: TAppointment[]
}

export default function UpcomingAppointments({
  appointmentsToday,
  appointmentsTomorrow,
  appointmentsCurrentWeek,
}: Props) {
  const today = startOfToday()
  const tomorrow = startOfTomorrow()
  const params = useSearchParams()
  const pathaname = usePathname()
  const router = useRouter()

  const popup = !!params.get("popup")
  const id = params.get("id")

  const [selected, setSelected] = useState<TAppointment | null>(null)
  const [openDetailsModal, setOpenDetailsModal] = useState<boolean>(false)

  // extract the appointment ids
  const todaysIds = appointmentsToday.map((info) => info.id)
  const tomorrowIds = appointmentsTomorrow.map((info) => info.id)
  const combinedIds = new Set([...todaysIds, ...tomorrowIds])

  const otherAppointments = appointmentsCurrentWeek.filter(
    (info) => !combinedIds.has(info.id)
  )

  // handle appointment details modal opening
  function handleOpenDetailsModal(info: TAppointment) {
    setSelected(info)
    // setSelected(id)
    setOpenDetailsModal(true)
  }

  // handle appointment details modal closing
  function closeDetailsModal() {
    setSelected(null)
    setOpenDetailsModal(false)
    if (!popup) return
    router.replace(pathaname)
  }

  if (appointmentsCurrentWeek.length === 0) return <div />

  return (
    <React.Fragment>
      <div
        className={`bg-slate-200/50 dark:bg-neutral-700 p-4 pb-7 rounded-lg overflow-hidden ${
          appointmentsCurrentWeek.length > 0 && `mb-4`
        }`}
      >
        <h2 className="font-extrabold text-lg ml-2 opacity-95">
          Upcoming Appointments
        </h2>

        {/* appointments for today */}
        <div>
          {appointmentsToday.length > 0 && (
            <h5 className="ml-2 my-2 text-sm font-bold opacity-80">
              Today - {format(today, "dd MMMM")}
            </h5>
          )}
          <div className="flex flex-col gap-4">
            {appointmentsToday.map((item, idx) => (
              <Appointment
                key={`appointment-today-${idx}`}
                appointment={item}
                openModal={handleOpenDetailsModal}
              />
            ))}
          </div>
        </div>

        {/* appointments for tomorrow */}
        <div
          className={
            appointmentsTomorrow.length > 0 ? `mt-6 md:mt-8` : `hidden`
          }
        >
          {appointmentsTomorrow.length > 0 && (
            <h5 className="ml-2 my-2 text-sm font-bold opacity-80">
              Tomorrow - {format(tomorrow, "dd MMMM")}
            </h5>
          )}
          <div className="flex flex-col gap-4">
            {appointmentsTomorrow.map((item, idx) => (
              <Appointment
                key={`appointment-tom-${idx}`}
                appointment={item}
                openModal={handleOpenDetailsModal}
              />
            ))}
          </div>
        </div>

        {/* rest of the appointments in the running week */}
        <div
          className={otherAppointments.length > 0 ? `mt-6 md:mt-8` : `hidden`}
        >
          {otherAppointments.length > 0 && (
            <h5 className="ml-2 my-2 text-sm font-bold opacity-80">
              Other Appointments
            </h5>
          )}
          <div className="flex flex-col gap-4">
            {otherAppointments.map((item, idx) => (
              <Appointment
                key={`appointment-tom-${idx}`}
                appointment={item}
                openModal={handleOpenDetailsModal}
              />
            ))}
          </div>
        </div>
      </div>

      {/* appointment details modal */}
      <AppointmentDetailsModal
        isOpen={openDetailsModal}
        closeModal={closeDetailsModal}
        selected={selected}
        setSelected={setSelected}
      />
    </React.Fragment>
  )
}
