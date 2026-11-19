'use client';
import { useEffect } from 'react';
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="grid min-h-[65vh] place-items-center px-5 py-16">
      <div className="max-w-xl text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#eee9f7] text-3xl">
          ✳
        </span>
        <p className="mt-7 text-xs font-bold tracking-[.2em] text-[#6c91a7]">A LITTLE DETOUR</p>
        <h1 className="mt-3 text-4xl font-black">Something didn’t go as planned.</h1>
        <p className="mt-4 leading-7 text-slate-500">
          The page ran into an unexpected problem. Your account and saved information are safe. Try
          again in a moment.
        </p>
        <button
          onClick={() => reset()}
          className="mt-7 rounded-xl bg-[#263b49] px-6 py-3 font-bold text-white"
        >
          Try again ↗
        </button>
      </div>
    </div>
  );
}
