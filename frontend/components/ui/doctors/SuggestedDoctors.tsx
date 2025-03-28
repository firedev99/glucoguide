"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { useQuery } from "react-query"
import React, { useState } from "react"
import { useRouter } from "next/navigation"

import { firey } from "@/utils"
import { TDoctor } from "@/types"

import { Icon, Swiper } from "@/components"
import { doctorServices } from "@/lib/services/doctor"

type Props = {
  experience?: number
  limit?: number
  hospitalId?: string
  doctorIds?: [string]
  children?: React.ReactNode
  page?: number
  detachedHospitalId?: string
}

export default function SuggestedDoctors({
  experience,
  hospitalId,
  doctorIds,
  limit = 10,
  children,
  page = 1,
  detachedHospitalId,
}: Props) {
  const [dragging, setDragging] = useState<boolean>(false)

  const router = useRouter()

  const params = firey.createSearchParams({
    page,
    limit,
  })

  const paramsOfExperience = firey.createSearchParams({
    page: 1,
    limit: 12,
    experience,
  })

  // Retrieve all the doctor informations from a specific hospital
  const { data: doctorsOfHospital, isLoading: isDocHospitalLoading } = useQuery(
    [`doctors:hospital:${hospitalId}:page:${page}`],
    async () => {
      if (!hospitalId) {
        throw new Error(`failed to retrieve doctors information!`)
      }

      return doctorServices.getDoctorsFromHospital(
        hospitalId,
        params.toString()
      )
    },
    {
      enabled: !!hospitalId,
      select: (data) => {
        // Covert keys to camelCase
        return firey.convertKeysToCamelCase(data) as {
          total: number
          doctors: TDoctor[]
        }
      },
    }
  )

  // Retrieve all the doctor informations based on experience
  const { data: experiencedDoctors, isLoading: isExperiencedLoading } =
    useQuery(
      [`doctors:page:${page}:experience:${experience}`],
      async () => {
        if (!experience) {
          throw new Error(`failed to retrieve doctors information!`)
        }

        return doctorServices.getDoctors(paramsOfExperience.toString())
      },
      {
        enabled: !!experience,
        select: (data) => {
          // Covert keys to camelCase
          return firey.convertKeysToCamelCase(data) as {
            total: number
            doctors: TDoctor[]
          }
        },
      }
    )

  // Retrieve all the doctor informations
  const { data: retrievedDoctors, isLoading: isInfoLoading } = useQuery(
    [`doctors:page:${page}`],
    async () => doctorServices.getDoctors(params.toString()),
    {
      select: (data) => {
        // Covert keys to camelCase
        return firey.convertKeysToCamelCase(data) as {
          total: number
          doctors: TDoctor[]
        }
      },
    }
  )

  const doctorsInfo = doctorsOfHospital
    ? doctorsOfHospital.doctors
    : experiencedDoctors
    ? experiencedDoctors.doctors
    : retrievedDoctors?.doctors

  const modDoctors =
    doctorsInfo &&
    doctorsInfo.filter(
      (doctor) =>
        !doctorIds?.includes(doctor.id) &&
        doctor.hospital.id !== detachedHospitalId
    )

  // Handle navigation based on dragging status
  function handleNavigation(
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    id: string
  ) {
    if (!dragging && typeof window !== "undefined") {
      e.preventDefault()

      if (e.ctrlKey) {
        window.open(`/hospitals/doctors/info?id=${id}`, `_blank`)
      } else {
        router.push(`/hospitals/doctors/info?id=${id}`)
      }
    }
  }

  const isLoading =
    isInfoLoading && isDocHospitalLoading && isExperiencedLoading

  // Show loading UI if the retrieval data is still fetching
  if (isLoading)
    return (
      <div role="status" className="animate-pulse">
        <div className="mt-7 w-full h-64 sm:h-96 bg-gray-300/80 dark:bg-neutral-700/75 rounded-md" />
        <span className="sr-only">Loading...</span>
      </div>
    )

  return (
    <React.Fragment>
      {modDoctors && modDoctors.length !== 0 && children}
      <Swiper
        onDragStart={() => setDragging(true)}
        onDragEnd={() => setDragging(false)}
      >
        {modDoctors &&
          modDoctors.map((doctor, idx) => (
            <div
              key={`carousel-${idx}`}
              className="w-80 h-96 2xl:size-96 min-w-80 2xl:min-w-96"
            >
              <div className={`size-full p-2`}>
                <motion.div
                  className="relative size-full rounded-lg hover:cursor-pointer active:cursor-grabbing"
                  whileTap={{ scale: 0.988 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => handleNavigation(e, doctor.id)}
                >
                  <Image
                    fill
                    src={doctor.imgSrc}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    alt="doctor.png"
                    style={{ objectFit: "cover", filter: "contrast(0.9)" }}
                    priority
                    className="rounded-lg"
                  />
                  {/* Overlay */}
                  <div className="min-h-full min-w-full bg-black/35 absolute top-0 right-0 bottom-0 left-0 rounded-lg" />

                  {/* Doctor details */}
                  <div className="w-11/12 text-[--primary-white] bg-white/20 backdrop-blur-lg p-4 absolute bottom-3 2xl:bottom-4 left-1/2 -translate-x-1/2 rounded-lg">
                    <h3 className="font-bold line-clamp-1">{doctor.name}</h3>
                    <div className="flex items-center -ml-1">
                      <Icon name="pin" className="size-5" />
                      <h5 className="ml-1 text-sm font-semibold line-clamp-1">
                        {doctor.hospital.name}
                      </h5>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          ))}
      </Swiper>
    </React.Fragment>
  )
}
