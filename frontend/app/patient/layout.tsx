import { Background, Navigation } from "@/components"

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <Background name="gradient-2" />
      <main className="full ml-auto md:w-[calc(100%-72px)] xl:w-[calc(100%-240px)] p-4 xs:px-4">
        {children}
      </main>
    </>
  )
}
