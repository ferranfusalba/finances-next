import { db } from "@/lib/db";
import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import { AccountParamsProps } from "@/types/Account";
import TransactionTable from "@/components/accounts/tables/transactions/TransactionTable";
import { AccountTransaction } from "@/types/Transaction";

async function loadAccount({ params }: AccountParamsProps) {
  return await db.financialAccount.findUnique({
    where: {
      code: params.code,
    },
  });
}

async function loadAccountTransactions(id: number) {
  return await db.financialAccountTransaction.findMany({
    where: {
      accountId: id,
    },
  });
}

export default async function AccountLayout({ params }: AccountParamsProps) {
  const account = await loadAccount({ params });
  const accountId = account!.id;
  const accountCode = account!.code;
  const accountTransactions = await loadAccountTransactions(accountId);

  return (
    <>
      <ol>
        <li>Account code (params): {params.code}</li>
        <li>Account code (account): {account?.code}</li>
        <li>Account id (account): {account?.id}</li>
        <li>Account order (account): {account?.order}</li>
        <li>Account name: {account?.name}</li>
        <li>Account active: {account?.active?.toString()}</li>
        <li>Account type: {account?.type?.toString()}</li>
        <li>Account description: {account?.description}</li>
        <li>Account defaultCurrency: {account?.defaultCurrency}</li>
        <li>Account initialBalance: {account?.initialBalance?.toString()}</li>
        <li>Account currentBalance: {account?.currentBalance?.toString()}</li>
        <li>Account createdAt: {account?.createdAt.toString()}</li>
        <li>Account updatedAt: {account?.updatedAt.toString()}</li>
      </ol>
      <DeleteAccount params={params} />
      <TransactionTable
        account={account}
        accountId={accountId}
        accountCode={accountCode}
        accountTransactions={accountTransactions}
      />
    </>
  );
}
