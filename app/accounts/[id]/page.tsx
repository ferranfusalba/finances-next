import { db } from "@/lib/db";
import DeleteAccount from "@/components/accounts/delete/DeleteAccount";
import { AccountParamsProps } from "@/types/Account";
import TransactionTable from "@/components/accounts/tables/transactions/TransactionTable";
import { AddTransaction } from "@/components/accounts/tables/transactions/AddTransaction";
import ZustandClient from "@/components/accounts/tables/transactions/ZustandClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currency } from "@/lib/utils";

async function loadAccount({ params }: AccountParamsProps) {
  return await db.financialAccount.findUnique({
    where: {
      id: params.id,
    },
  });
}

async function loadAccountTransactions(id: string) {
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
    <div className="m-auto w-11/12 xl:w-9/12 pb-20">
      <div className="grid grid-cols-12 py-6">
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <Avatar>
            {/* TODO: Build image & bankCode matchers */}
            {/* <AvatarImage src="https://images.unsplash.com/photo-1708022792768-edfab8b2be7a?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" /> */}
            <AvatarFallback>{account?.bankName[0]}</AvatarFallback>
          </Avatar>
        </div>
        <div className="col-span-8 md:col-span-10 grid gap-2">
          <span className="text-2xl">{account?.bankName}</span>
          <div>
            <span className="font-mono p-1 bg-slate-100 v rounded-md text-stone-900">
              {account?.code}
            </span>
            <span> </span>
            <span>{account?.name}</span>
          </div>
          <div>
            <span className="font-mono p-1 bg-blue-800 v rounded-md text-amber-300">
              {account?.defaultCurrency}
            </span>
            <span> </span>
            <span>{account?.type}</span>
            <span> </span>
            <span className="font-mono">
              {currency("ca-AD", "EUR").format(
                account?.currentBalance as number
              )}
            </span>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 grid justify-center content-center">
          <DeleteAccount params={params} />
        </div>
      </div>
      <div className="flex justify-between py-2">
        <ZustandClient></ZustandClient>
        <AddTransaction
          account={account}
          accountId={accountId}
          accountCode={accountCode}
        />
      </div>
      <div className="py-2">
        <TransactionTable accountTransactions={accountTransactions} />
      </div>
    </div>
  );
}
