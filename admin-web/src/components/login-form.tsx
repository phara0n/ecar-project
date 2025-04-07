import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { toast } from "sonner"
import { useTranslation } from 'react-i18next'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLoginMutation } from "@/store/apiSlice"
import { setCredentials } from "@/store/slices/authSlice"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const { t } = useTranslation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [login, { isLoading, error }] = useLoginMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const data = await login({ username, password }).unwrap()
      dispatch(setCredentials({ accessToken: data.access, refreshToken: data.refresh }))
      toast.success(t('login.loginSuccess'))
      navigate("/")
    } catch (err) {
      console.error("Failed to login:", err)
      let errorMessage = t('login.loginFailed')
      if (err && typeof err === "object" && "data" in err && err.data) {
        const errorData = err.data as any
        errorMessage = errorData.detail ?? 
                       (errorData.non_field_errors ? errorData.non_field_errors.join(", ") : null) ?? 
                       (errorData.username ? `Login Error: ${errorData.username.join(", ")}` : null) ?? 
                       (errorData.password ? `Password Error: ${errorData.password.join(", ")}` : null) ?? 
                       t('login.loginFailed')
      }
      toast.error(errorMessage)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="login">{t('login.loginLabel')}</Label>
                <Input
                  id="login"
                  type="text"
                  placeholder={t('login.loginLabel')}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder={t('login.passwordLabel')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">
                  {t('login.loginFailed')}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('login.submitButtonLoading') : t('login.submitButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

