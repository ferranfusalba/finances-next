export interface AccountParamsProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    year?: string;
    [key: string]: string | string[] | undefined;
  }>;
}
