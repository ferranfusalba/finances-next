export interface SalaryLine {
  id: string;
  salaryId: string;
  concept: string;
  group: string;
  amount: number;
  order: number;
}

export interface SalaryPaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  payee: string;
  concept: string;
  subcategory: string | null;
  dateTime: Date;
  accountId: string;
}

export interface SalaryPayment {
  id: string;
  salaryId: string;
  transactionId: string;
  concept: string;
  transaction: SalaryPaymentTransaction;
}

export interface Salary {
  id: string;
  userId: string;
  month: Date;
  employer: string;
  grossPay: number;
  currency: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  lines: SalaryLine[];
  payments: SalaryPayment[];
}
