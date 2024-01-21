import { db } from "@/lib/db";
import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import { AccountParamsProps } from "@/types/Account";
import TransactionTable from "@/components/accounts/tables/transactions/TransactionTable";

// async function loadAccount({ params }: AccountParamsProps) {
//   return await db.account.findUnique({
//     where: {
//       code: params.code,
//     },
//   });
// }

async function loadAccountTransactions(userId: number) {
  return await db.accountTransaction.findMany({
    where: {
      accountId: userId,
    },
  });
}

export default async function AccountLayout({ params }: AccountParamsProps) {
  // const account = await loadAccount({ params });
  // const accountTransactions = await loadAccountTransactions(account!.id);

  return (
    <>
      {/* <ol>
        <li>Account code (params): {params.code}</li>
        <li>Account code (account): {account?.code}</li>
        <li>Account id (account): {account?.id}</li>
        <li>Account order (account): {account?.order}</li>
        <li>Account name: {account?.name}</li>
        <li>Account active: {account?.active?.toString()}</li>
        <li>Account type: {account?.type?.toString()}</li>
        <li>Account description: {account?.description}</li>
        <li>Account initialBalance: {account?.initialBalance?.toString()}</li>
        <li>Account createdAt: {account?.createdAt.toString()}</li>
        <li>Account updatedAt: {account?.updatedAt.toString()}</li>
      </ol>
      <DeleteAccount params={params} />
      <TransactionTable accountTransactions={accountTransactions} /> */}
    </>
  );
}
