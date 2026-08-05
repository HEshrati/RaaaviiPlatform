import FacilitatorEventForm from "@/components/events/FacilitatorEventForm";

export default async function EditFacilitatorEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FacilitatorEventForm eventId={id} />;
}
