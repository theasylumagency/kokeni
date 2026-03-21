import { loginAction } from "@/app/admin/actions";

type AdminLoginProps = {
  configured: boolean;
};

export default function AdminLogin({ configured }: AdminLoginProps) {
  return (
    <div className="w-full">
      <form action={loginAction} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Administrator Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              name="password"
              required
              disabled={!configured}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!configured}
          className="flex w-full justify-center rounded-md border border-transparent bg-gray-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
