import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type LoginFormProps = {
  onSubmit: () => void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  return (

    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>

              </div>
              <Input id="password" type="password" required />
            </Field>
            <Field>
              <Button type="submit">Login</Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>

  )
}
