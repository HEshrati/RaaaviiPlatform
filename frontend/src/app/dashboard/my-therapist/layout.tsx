import CoreTestsGate from "@/components/CoreTestsGate";
export default function MyTherapistLayout({ children }: { children: React.ReactNode }) {
  return <CoreTestsGate>{children}</CoreTestsGate>;
}
