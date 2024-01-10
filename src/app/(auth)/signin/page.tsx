import { CredentialsForm } from "@/components/auth/CredentialsForm";
import { GoogleSignInButton } from "@/components/auth/AuthButtons";
import { authConfig } from "@/libs/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SignInPage() {
  const session = await auth(authConfig);

  if (session) return redirect("/");

  return (
    <>
      <div className="w-full h-full-main flex flex-col items-center justify-center py-2">
        <div className="flex flex-col items-center mt-10 p-10">
          <h1 className="mt-10 mb-4 text-4xl font-bold">Sign In</h1>
          <GoogleSignInButton />
          <span className="text-2xl font-semibold text-white text-center mt-8">
            or
          </span>
          <CredentialsForm />
        </div>
      </div>
    </>
  );
}
