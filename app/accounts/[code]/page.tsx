import { db } from "@/lib/db";
import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import { AccountParamsProps } from "@/types/Account";
import TransactionTable from "@/components/accounts/tables/transactions/TransactionTable";
import { AddTransaction } from "@/components/accounts/tables/transactions/AddTransaction";
import ZustandClient from "@/components/accounts/tables/transactions/ZustandClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <div className="grid grid-cols-12">
        <div className="col-span-1">
          <Avatar>
            {/* // TODO: Build image & bankCode matchers */}
            {/* <AvatarImage src="https://images.unsplash.com/photo-1708022792768-edfab8b2be7a?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" /> */}
            <AvatarFallback>{account?.bankName[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="col-span-10">
          <span>{account?.bankName}</span>
          <div>
            <span>{account?.name}</span>
            <span>{account?.code}</span>
          </div>
          <div>
            <span>{account?.type}</span>
            <span>{account?.defaultCurrency}</span>
            <span>{account?.currentBalance}</span>
          </div>
        </div>
        <div className="col-span-1">
          <DeleteAccount params={params} />
        </div>
      </div>
      <div className="flex justify-between">
        <ZustandClient></ZustandClient>
        <AddTransaction
          account={account}
          accountId={accountId}
          accountCode={accountCode}
        />
      </div>
      <div>
        <TransactionTable accountTransactions={accountTransactions} />
      </div>
    </>
  );
}
