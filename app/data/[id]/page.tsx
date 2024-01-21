import { DataParamsProps } from "@/types/Data";

export default function DataLayout({ params }: DataParamsProps) {
  return <>Data {params.id}</>;
}
