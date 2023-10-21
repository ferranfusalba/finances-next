type ParamsProps = {
  params: {
    id: string;
    name: string;
  };
};

export default async function DataLayout({ params }: ParamsProps) {
  return <>Data {params.id}</>;
}
