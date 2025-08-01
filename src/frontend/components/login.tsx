import { useInternetIdentity } from "ic-use-internet-identity";
import { Button } from "./ui/button";

export default function LoginButton() {
  const { login, loginStatus } = useInternetIdentity();

  const disabled = loginStatus === "logging-in" || loginStatus === "success";
  const text = loginStatus === "logging-in" ? "Logging in..." : "Login with Internet Identity";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md p-8 mx-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              Welcome
            </h2>
            <p className="mt-2 text-gray-300">
              Sign in to access your account
            </p>
          </div>
          
          <Button
            onClick={login}
            disabled={disabled}
            className="w-full py-6 text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-[1.02]"
          >
            {text}
          </Button>
          
          {loginStatus === "logging-in" && (
            <div className="w-full max-w-xs mx-auto mt-4">
              <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="animate-pulse h-full bg-indigo-500 rounded-full" style={{ width: "70%" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}