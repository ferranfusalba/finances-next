export interface Account {
  active: boolean;
  createdAt: Date;
  description: string;
  id: number;
  initialBalance: string;
  name: string;
  type: number;
  updatedAt: Date;
}

export interface AccountParamsProps {
  params: {
    id: string;
  };
}
