import { loginAction } from "@/app/admin/actions";

type AdminLoginProps = {
  configured: boolean;
};

const inputClass =
  "w-full bg-white border-2 border-black p-4 font-mono text-sm focus:outline-none focus:border-primary rounded-none placeholder:text-black/30 placeholder:opacity-100";

export default function AdminLogin({ configured }: AdminLoginProps) {
  return (
    <section className="mx-auto w-full max-w-xl border-2 border-black bg-white p-8">
      <div className="mb-8 space-y-4">
        <div className="font-mono text-[10px] tracking-[0.3em] opacity-50 uppercase border-b-2 border-black pb-2">
          ავტორიზაცია / AUTHENTICATION
        </div>
        <h2 className="font-black text-4xl uppercase tracking-tighter">
          ადმინისტრატორის შესვლა
        </h2>
        <p className="text-xs font-mono opacity-70 uppercase tracking-widest leading-relaxed">
          პანელი ქართულ ინტერფეისზეა.<br/>საჯარო საიტის ენები ცალკე რჩება.
        </p>
      </div>

      <form action={loginAction} className="space-y-6">
        <label className="block space-y-2">
          <span className="font-mono text-[10px] tracking-widest uppercase opacity-60">პაროლი / PASSWORD</span>
          <input
            type="password"
            name="password"
            required
            disabled={!configured}
            className={inputClass}
            placeholder="ENTER_PASSWORD..."
          />
        </label>

        <button
          type="submit"
          disabled={!configured}
          className="w-full bg-primary text-white py-4 font-black font-mono text-[12px] tracking-[0.2em] border-2 border-black hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          შესვლა / LOGIN
        </button>
      </form>
    </section>
  );
}
