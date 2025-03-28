"use client"

import { firey } from "@/utils"
import { TMedications } from "@/types"
import { motion } from "framer-motion"
import { useApi } from "@/hooks/useApi"
import { useProfile } from "@/hooks/useProfile"
import { useClickOutside } from "@/hooks/useClickOutside"
import { patientService } from "@/lib/services/patient"
import {
  ActivityModal,
  EmptySuggestions,
  Button,
  PopoverModal,
} from "@/components"
import React, { useRef, useState } from "react"
import { useActivities } from "@/hooks/useActivities"

export default function Medications() {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const container = useRef<HTMLDivElement>(null)

  // retrieve medication details
  const { data: profile } = useProfile()
  const { data: suggestions } = useApi(
    [`patients:medications:${profile?.id}`],
    (_, token) => patientService.getMedications(token),
    {
      select: (data) => firey.convertKeysToCamelCase(data) as TMedications | [],
    }
  )

  // distribute all the activities based on hours
  const { data } = useActivities(suggestions)

  // utilizes the hook to handle hovering outside the referred modal
  useClickOutside(container, () => setIsHovering(false))

  return (
    <React.Fragment>
      <motion.div
        ref={container}
        className="absolute z-20 right-0 top-0 w-full max-w-xl 2xl:max-w-4xl h-96 border border-gray-300 dark:border-neutral-500 rounded-3xl overflow-hidden  bg-neutral-100 dark:bg-neutral-800 [--slide-to:0px] [--slide-from:336px] 2xl:[--slide-from:250px]"
        initial={{ x: "var(--slide-from)" }}
        animate={{
          x: isHovering ? "var(--slide-to)" : "var(--slide-from)",
        }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        onTapStart={() => setIsHovering(true)}
      >
        {suggestions &&
          (!Array.isArray(suggestions) ? (
            <React.Fragment>
              <div className="ml-4 mt-5 flex justify-between mr-4">
                <h2 className="text-xl font-semibold opacity-80">Activity</h2>
                <Button
                  className="text-xs relative z-10"
                  onClick={() => setIsOpen(true)}
                >
                  add activity
                </Button>
              </div>

              {/* medications/activities */}
              <div className="h-full overflow-y-auto custom-scroll -mt-2 p-4 pb-16">
                {Object.keys(data).map((item, idx) => (
                  <div
                    key={`activity-m-${idx}`}
                    className="py-3 relative flex items-center"
                  >
                    {data[item].length !== 0 && (
                      <React.Fragment>
                        <div className="after:absolute after:contents[''] after:w-[85%] sm:after:w-[90%] after:h-0.5 after:bg-transparent after:-mt-0.5 after:top-1/2 after:left-12 sm:after:left-14 after:border-b after:border-gray-400/60 dark:after:border-neutral-500 after:border-dashed flex">
                          <span className="text-sm sm:text-base inline-block">
                            {item}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 sm:gap-2.5 mx-auto">
                          {data[item].map((activity: any, aIdx: number) => (
                            <div
                              key={`${
                                activity.name
                                  ? activity.name.toLowerCase().trim()
                                  : activity.time.toLowerCase().trim()
                              }-${aIdx}`}
                              className={`py-1 px-3.5 text-sm font-medium border rounded-full w-fit z-10 bg-neutral-200/70 dark:bg-neutral-800 shadow-[inset_0_0_0_1px_rgba(56,56,56,0.3)] ${`ml-${
                                aIdx * 5
                              }`}`}
                            >
                              <PopoverModal
                                modalClass={`-mt-5 p-2 ml-12 z-40 min-w-36 sm:min-w-44 text-center ${
                                  !activity.duration &&
                                  !activity.times &&
                                  `group-hover:hidden`
                                }`}
                                content={
                                  activity.name ? activity.name : activity.time
                                }
                              >
                                <div className="flex flex-col text-xs">
                                  <span>
                                    {activity.duration ? `Duration` : `Amount`}:{" "}
                                    {activity.amount
                                      ? `${activity.amount} ${
                                          activity.times.length > 1
                                            ? `, every ${activity.times.join(
                                                " and "
                                              )}.`
                                            : ``
                                        }`
                                      : activity.duration}
                                  </span>

                                  {activity.description && (
                                    <span>Note: {activity.description}</span>
                                  )}
                                </div>
                              </PopoverModal>
                            </div>
                          ))}
                        </div>
                      </React.Fragment>
                    )}
                  </div>
                ))}
              </div>
            </React.Fragment>
          ) : (
            <EmptySuggestions />
          ))}
      </motion.div>

      {/* activity adding modal */}
      <ActivityModal
        active={isOpen}
        details={suggestions}
        closeHandler={() => setIsOpen(false)}
      />
    </React.Fragment>
  )
}
