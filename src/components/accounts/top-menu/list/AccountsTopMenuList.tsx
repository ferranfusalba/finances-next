"use client";
import { useRef, useState } from "react";
import { Account } from "@/types/Account";
import Link from "next/link";

export default function AccountsTopMenuList({
  accountList,
}: {
  accountList: Array<Account>;
}) {
  const [clientAccountList, setClientAccountList] = useState(accountList);

  const dragAccount = useRef<number>(0);
  const draggedOverAccount = useRef<number>(0);

  async function handleSort(account: Account) {
    const accountClone = [...clientAccountList];

    const temp = accountClone[dragAccount.current];
    accountClone[dragAccount.current] =
      accountClone[draggedOverAccount.current];
    accountClone[draggedOverAccount.current] = temp;

    setClientAccountList(accountClone);

    // await fetch(`/api/accounts/${account.id}`, {
    //   method: "PUT",
    //   body: JSON.stringify({
    //     ...account,
    //     order: accountClone.indexOf(accountClone[dragAccount.current]) + 1,
    //   }),
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });
  }

  return (
    <>
      <ol className="flex overflow-auto flex-nowrap scroll-touch">
        {clientAccountList.map((account, index) => (
          <li
            key={index}
            className="border-2 border-white flex justify-center items-center mx-2.5 px-4 cursor-move"
            draggable="true"
            onDragStart={() => (dragAccount.current = index)}
            onDragEnter={() => (draggedOverAccount.current = index)}
            onDragEnd={() => handleSort(account)}
            onDragOver={(e) => e.preventDefault()}
          >
            <Link
              className="w-max min-w-10rem text-center"
              href={"/accounts/" + account.code}
            >
              {account.name}
            </Link>{" "}
          </li>
        ))}
      </ol>
    </>
  );
}
