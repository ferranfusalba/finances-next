const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full flex bg-neutral-900">
      <div className="hidden md:flex md:w-1/2 items-center justify-center border-r border-neutral-700">
        <h1 className="text-5xl font-bold text-neutral-300">Finances</h1>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
