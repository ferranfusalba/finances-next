type ParamsProps = {
  params: {
    id: string;
    name: string;
  };
};

export default function DataLayout({ params }: ParamsProps) {
  return <>Data {params.id}</>;
}
