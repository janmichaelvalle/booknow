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


// Props are for data passed in from parent
type LoginFormProps = {
  // props should usually describe the function that sends the data upward
  onSubmit: (email: string, password: string) => void
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
        {/* Read values ONLY on submit */}
        <form
        /*
        onSubmit = event handler and expects a javascript function
        {} = tells JSX you are putting JavaScript in the slot
         (e) => { ... } = the function you are putting there
        */
          onSubmit={(e) => {
            // stop browser from refreshing the page
            e.preventDefault()

            // FromData reads all the fields in the form
            // e.currentTarget means: the actual <form> element that was submitted
            const formData = new FormData(e.currentTarget)
            const email = String(formData.get("email") ?? "")
            const password = String(formData.get("password") ?? "")

            // This calls <LoginForm onSubmit={handleLogin} /> from LoginPage.tsx. Basically handleLogin(email, password)

            onSubmit(email, password)
          }}
        >

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>

              </div>
              <Input id="password" type="password" name="password" required />
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
