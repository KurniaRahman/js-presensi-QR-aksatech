
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Side - Login Form */}
      <div className="flex w-full flex-col justify-center px-8 md:w-1/2 lg:px-24 xl:px-32 relative">
        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="AksaTech Logo"
            className="object-contain h-12 w-auto"
          />
        </div>

        <div className="mx-auto w-full max-w-sm mt-12 md:mt-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1F77C5] uppercase tracking-wider mb-8">Sistem Presensi Aksa Tech</h2>
            <h1 className="text-2xl font-semibold text-gray-900">Selamat Datang! </h1>
            <p className="mt-2 text-md text-gray-600">Masuk ke akun Anda</p>
          </div>
          <LoginForm />
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden w-1/2 bg-[#1F77C5] md:block relative">
        <img
          src="/background_login.png"
          alt="Login Illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
