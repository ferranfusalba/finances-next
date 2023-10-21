export interface Budget {
  active: boolean | null;
  createdAt: Date;
  description: string | null;
  id: number;
  initialBalance: string | null;
  name: string;
  type: number | null;
  updatedAt: Date;
}

export interface BudgetParamsProps {
  params: {
    id: string;
  };
}
