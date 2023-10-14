type ParamsProps = {
  params: {
    id: string;
  };
};

export default function AccountLayout({ params }: ParamsProps) {
  return <>Account id: {params.id}</>;
}
