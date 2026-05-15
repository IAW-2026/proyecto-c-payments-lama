import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f6f1e7] flex items-center justify-center">
      <SignIn />
    </main>
  );
}