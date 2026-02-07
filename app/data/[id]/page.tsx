import { DataParamsProps } from "@/types/Data";

export default async function DataLayout({ params }: DataParamsProps) {
  const { id } = await params;
  return <>Data {id}</>;
}
