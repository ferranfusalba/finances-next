export interface AccountBudgetParamsProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    year?: string;
    [key: string]: string | string[] | undefined;
  }>;
}
