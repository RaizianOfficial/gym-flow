"use client"

import { useState, useTransition } from "react"
import { registerGym } from "@/app/actions/auth"
import Link from "next/link"
import { Dumbbell } from "lucide-react"

export default function RegisterPage() {
  const [gymName, setGymName] = useState("")
  const [slug, setSlug] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSlugChange = (val: string) => {
    // Automatically convert to lowercase and format as slug
    const formatted = val
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    setSlug(formatted)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await registerGym({ gymName, slug, email, password })
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-bg">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-accent shadow-sm">
          <Dumbbell className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-primary">
          Register your gym
        </h2>
        <p className="mt-2 text-center text-sm text-secondary">
          Or{" "}
          <Link
            href="/login"
            className="font-semibold text-accent hover:text-success transition-colors"
          >
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-6 py-8 shadow-md rounded-xl border border-secondary/5 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-danger/10 p-4 text-sm text-danger border border-danger/20">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="gymName"
                className="block text-sm font-medium text-secondary"
              >
                Gym Name
              </label>
              <div className="mt-1">
                <input
                  id="gymName"
                  name="gymName"
                  type="text"
                  required
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none sm:text-sm"
                  placeholder="Iron Temple"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-secondary"
              >
                Gym Domain Slug
              </label>
              <div className="mt-1 flex rounded-xl shadow-sm">
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="block w-full rounded-l-xl border border-secondary/20 bg-bg px-4 py-2 text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none sm:text-sm"
                  placeholder="iron-temple"
                  disabled={isPending}
                />
                <span className="inline-flex items-center rounded-r-xl border border-l-0 border-secondary/20 bg-secondary/5 px-3 text-secondary sm:text-sm select-none">
                  .gymflow.com
                </span>
              </div>
              <p className="mt-1 text-xs text-secondary/60">
                Used for your tenant dashboard routing (e.g. gymflow.com/slug/dashboard)
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary"
              >
                Owner Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none sm:text-sm"
                  placeholder="owner@yourgym.com"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-secondary"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-secondary/20 bg-bg px-4 py-2 text-primary shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none sm:text-sm"
                  placeholder="••••••••"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors disabled:opacity-50"
              >
                {isPending ? "Creating your gym..." : "Create Gym & Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
