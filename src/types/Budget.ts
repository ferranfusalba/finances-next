export interface Budget {
  active: boolean;
  createdAt: Date;
  description: string;
  id: number;
  initialBalance?: string;
  name: string;
  type: number;
  updatedAt: Date;
}

export interface BudgetParamsProps {
  params: {
    id: string;
  };
}
